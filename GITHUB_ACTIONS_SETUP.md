# GitHub Actions for Cloudflare Pages

This repository deploys three static sites to Cloudflare Pages with GitHub Actions:

- `itgrep.com`
- `nodejs.tech`
- `traefik.tech`

## Required GitHub repository secrets

Create these secrets in `Settings -> Secrets and variables -> Actions`:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

The API token should have:

- `Account`
- `Cloudflare Pages`
- `Edit`

## Required GitHub repository variables

Create these repository variables in `Settings -> Secrets and variables -> Actions`:

- `CF_PAGES_PROJECT_ITGREP`
- `CF_PAGES_PROJECT_NODEJS_TECH`
- `CF_PAGES_PROJECT_TRAEFIK_TECH`

Set each value to the matching Cloudflare Pages project name.

## Workflow files

- `.github/workflows/deploy-itgrep-pages.yml`
- `.github/workflows/deploy-nodejs-tech-pages.yml`
- `.github/workflows/deploy-traefik-tech-pages.yml`
- `.github/workflows/deploy-preview-pages.yml`
- `.github/workflows/_deploy-pages-site.yml`

## What the workflow does

Each workflow:

1. Checks out the repository.
2. Runs `node scripts/prepare-cloudflare-static.mjs <site_dir>`.
3. Deploys the prepared directory with `wrangler pages deploy`.

## Trigger behavior

- Automatic production deploy on `push` to `main` when the relevant site files change.
- Manual deploy from the GitHub Actions UI with `workflow_dispatch`.
- Automatic preview deploy on pull requests for changed sites only.

## One-time Cloudflare setup

Before the workflows can deploy successfully:

1. Create three Cloudflare Pages projects.
2. Set each project's production branch to `main`.
3. Bind the custom domains in Cloudflare Pages.
4. Configure `www -> apex` redirects and `Always Use HTTPS` in Cloudflare.

Cloudflare rule checklist:

- `docs/cloudflare-redirect-rules.md`
