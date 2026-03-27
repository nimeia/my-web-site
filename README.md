# Webapp Static Sites

This repository contains three static sites prepared for Cloudflare Pages:

- `itgrep.com`
- `nodejs.tech`
- `traefik.tech`

## Deploy

### GitHub Actions

The repository includes GitHub Actions workflows for production deploys and PR previews.

Production workflows:

- `.github/workflows/deploy-itgrep-pages.yml`
- `.github/workflows/deploy-nodejs-tech-pages.yml`
- `.github/workflows/deploy-traefik-tech-pages.yml`

Preview workflow:

- `.github/workflows/deploy-preview-pages.yml`

Shared reusable workflow:

- `.github/workflows/_deploy-pages-site.yml`

### Required GitHub configuration

Add these repository secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Add these repository variables:

- `CF_PAGES_PROJECT_ITGREP`
- `CF_PAGES_PROJECT_NODEJS_TECH`
- `CF_PAGES_PROJECT_TRAEFIK_TECH`

Detailed setup:

- `GITHUB_ACTIONS_SETUP.md`

### Deployment flow

Each workflow:

1. Checks out the repository.
2. Runs `node scripts/prepare-cloudflare-static.mjs <site_dir>`.
3. Uploads the prepared directory with `wrangler pages deploy`.

Production deploys trigger on `push` to `main` or `master` when the matching site paths change. The manual `Run workflow` button only appears after the workflow file is present on the repository default branch.

### Manual local deploy

Examples:

```bash
node scripts/prepare-cloudflare-static.mjs itgrep.com
npx wrangler pages deploy itgrep.com --project-name=<your-itgrep-pages-project>
```

```bash
node scripts/prepare-cloudflare-static.mjs nodejs.tech
npx wrangler pages deploy nodejs.tech --project-name=<your-nodejs-tech-pages-project>
```

```bash
node scripts/prepare-cloudflare-static.mjs traefik.tech
npx wrangler pages deploy traefik.tech --project-name=<your-traefik-tech-pages-project>
```

## Cloudflare Rules

Use Cloudflare instead of `nginx` for:

- `HTTP -> HTTPS`
- `www -> apex`
- optional `*.pages.dev -> custom domain`

Rule checklist:

- `docs/cloudflare-redirect-rules.md`
