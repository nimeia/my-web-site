import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();

const siteConfigs = [
  {
    siteDir: "itgrep.com",
    indexSource: "en.html",
    adsSource: path.join("ads.txt", "itgrep.com.txt"),
    ga4Id: "G-6NDMJQNDPS",
    adsenseClient: "ca-pub-7950559866369342",
    titleSuffix: null,
    removeLegacyUniversalAnalytics: false,
    deleteFiles: ["nodejs.tar"],
  },
  {
    siteDir: "nodejs.tech",
    indexSource: "zh-cn.html",
    adsSource: path.join("ads.txt", "nodejs.tech.txt"),
    ga4Id: "G-2WRNZHGVQT",
    adsenseClient: "ca-pub-8264273508355034",
    titleSuffix: " node js 学习 中文网",
    removeLegacyUniversalAnalytics: false,
    deleteFiles: ["nodejs.tar"],
  },
  {
    siteDir: "traefik.tech",
    indexSource: "index.html",
    adsSource: path.join("ads.txt", "traefik.tech.txt"),
    ga4Id: "G-ZP0D43CZ94",
    adsenseClient: "ca-pub-4861113683111015",
    titleSuffix: null,
    removeLegacyUniversalAnalytics: true,
    deleteFiles: [],
  },
];

const universalAnalyticsPairPattern =
  /\s*<script>\s*window\.ga = window\.ga \|\| function\(\)\s*\{[\s\S]*?<\/script>\s*<script async src="https:\/\/www\.google-analytics\.com\/analytics\.js"><\/script>\s*/gi;

const universalAnalyticsLoaderPattern =
  /\s*<script async src="https:\/\/www\.google-analytics\.com\/analytics\.js"><\/script>\s*/gi;

const ga4PairPattern =
  /\s*<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=[^"]+"><\/script>\s*<script>\s*window\.dataLayer = window\.dataLayer \|\| \[\];\s*function gtag\(\)\{dataLayer\.push\(arguments\);\}\s*gtag\("js", new Date\(\)\);\s*gtag\("config", "[^"]+"\);\s*<\/script>\s*/gi;

const adsensePattern =
  /\s*<script async src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-[^"]+" crossorigin="anonymous"><\/script>\s*/gi;

function createGa4Snippet(ga4Id) {
  return [
    `<script async src="https://www.googletagmanager.com/gtag/js?id=${ga4Id}"></script>`,
    `<script>window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag("js", new Date());gtag("config", "${ga4Id}");</script>`,
  ].join("");
}

function createAdsenseSnippet(adsenseClient) {
  return `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}" crossorigin="anonymous"></script>`;
}

async function walkHtmlFiles(dirPath) {
  const htmlFiles = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      htmlFiles.push(...(await walkHtmlFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
      htmlFiles.push(fullPath);
    }
  }

  return htmlFiles;
}

function ensureTitleSuffix(html, titleSuffix) {
  if (!titleSuffix) {
    return html;
  }

  return html.replace(/<title>([\s\S]*?)<\/title>/i, (match, title) => {
    if (title.endsWith(titleSuffix)) {
      return match;
    }
    return `<title>${title}${titleSuffix}</title>`;
  });
}

function stripManagedScripts(html, removeLegacyUniversalAnalytics) {
  let nextHtml = html
    .replace(ga4PairPattern, "")
    .replace(adsensePattern, "");

  if (removeLegacyUniversalAnalytics) {
    nextHtml = nextHtml
      .replace(universalAnalyticsPairPattern, "")
      .replace(universalAnalyticsLoaderPattern, "");
  }

  return nextHtml;
}

function injectManagedScripts(html, ga4Id, adsenseClient) {
  const injection = `${createGa4Snippet(ga4Id)}${createAdsenseSnippet(adsenseClient)}`;

  if (!html.includes("</head>")) {
    throw new Error("Expected </head> in HTML document.");
  }

  return html.replace(/<\/head>/i, `${injection}</head>`);
}

function createRedirectsFile() {
  return [
    "# Cloudflare Pages redirects for static compatibility",
    "/Ads.txt /ads.txt 301",
    "",
  ].join("\n");
}

async function ensureRootIndex(sitePath, indexSource) {
  const sourcePath = path.join(sitePath, indexSource);
  const indexPath = path.join(sitePath, "index.html");

  if (path.basename(sourcePath).toLowerCase() === "index.html") {
    return;
  }

  const sourceHtml = await fs.readFile(sourcePath, "utf8");
  await fs.writeFile(indexPath, sourceHtml, "utf8");
}

async function copyAdsTxt(sitePath, adsSource) {
  const adsContent = await fs.readFile(path.join(rootDir, adsSource), "utf8");
  await fs.writeFile(path.join(sitePath, "ads.txt"), adsContent, "utf8");
}

async function deleteFiles(sitePath, fileNames) {
  for (const fileName of fileNames) {
    const fullPath = path.join(sitePath, fileName);
    await fs.rm(fullPath, { force: true });
  }
}

async function processSite(config) {
  const sitePath = path.join(rootDir, config.siteDir);
  const htmlFiles = await walkHtmlFiles(sitePath);

  let updatedFiles = 0;

  for (const htmlFile of htmlFiles) {
    const originalHtml = await fs.readFile(htmlFile, "utf8");
    let nextHtml = stripManagedScripts(
      originalHtml,
      config.removeLegacyUniversalAnalytics,
    );
    nextHtml = ensureTitleSuffix(nextHtml, config.titleSuffix);
    nextHtml = injectManagedScripts(
      nextHtml,
      config.ga4Id,
      config.adsenseClient,
    );

    if (nextHtml !== originalHtml) {
      await fs.writeFile(htmlFile, nextHtml, "utf8");
      updatedFiles += 1;
    }
  }

  await ensureRootIndex(sitePath, config.indexSource);
  await copyAdsTxt(sitePath, config.adsSource);
  await fs.writeFile(
    path.join(sitePath, "_redirects"),
    createRedirectsFile(),
    "utf8",
  );
  await deleteFiles(sitePath, config.deleteFiles);

  return {
    siteDir: config.siteDir,
    htmlFiles: htmlFiles.length,
    updatedFiles,
  };
}

async function main() {
  const selectedSiteDirs = process.argv.slice(2);
  const selectedSites =
    selectedSiteDirs.length === 0
      ? siteConfigs
      : siteConfigs.filter((config) => selectedSiteDirs.includes(config.siteDir));

  if (selectedSiteDirs.length > 0 && selectedSites.length !== selectedSiteDirs.length) {
    const knownSites = new Set(siteConfigs.map((config) => config.siteDir));
    const unknownSites = selectedSiteDirs.filter((siteDir) => !knownSites.has(siteDir));
    throw new Error(`Unknown site arguments: ${unknownSites.join(", ")}`);
  }

  const results = [];

  for (const config of selectedSites) {
    results.push(await processSite(config));
  }

  for (const result of results) {
    console.log(
      `${result.siteDir}: updated ${result.updatedFiles} / ${result.htmlFiles} HTML files`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
