# Cloudflare Redirect Rules

These sites should use Cloudflare rules instead of `nginx` redirects.

Official references:

- `www -> apex`: https://developers.cloudflare.com/pages/how-to/www-redirect/
- Direct Upload CI/CD: https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/

## 1. Enable HTTPS redirect

For each zone:

1. Open Cloudflare dashboard.
2. Go to `SSL/TLS -> Edge Certificates`.
3. Enable `Always Use HTTPS`.

This replaces the old `HTTP -> HTTPS` behavior from `nginx`.

## 2. Redirect `www` to apex

Create one Bulk Redirect list with these entries:

| Source URL | Target URL | Status |
| --- | --- | --- |
| `www.itgrep.com` | `https://itgrep.com` | `301` |
| `www.nodejs.tech` | `https://nodejs.tech` | `301` |
| `www.traefik.tech` | `https://traefik.tech` | `301` |

Enable these options for each entry:

- Preserve query string
- Subpath matching
- Preserve path suffix
- Include subdomains

Then create one Bulk Redirect rule that uses the list.

## 3. Add proxied DNS for `www`

Per Cloudflare's `www -> apex` guide, create a proxied DNS record for each `www` host:

| Type | Name | IPv4 address | Proxy |
| --- | --- | --- | --- |
| `A` | `www` | `192.0.2.1` | Proxied |

Apply this in each zone:

- `itgrep.com`
- `nodejs.tech`
- `traefik.tech`

## 4. Optional: redirect `*.pages.dev`

If you do not want the Pages default domain exposed, create another Bulk Redirect list:

| Source URL | Target URL | Status |
| --- | --- | --- |
| `<itgrep-pages-project>.pages.dev` | `https://itgrep.com` | `301` |
| `<nodejs-tech-pages-project>.pages.dev` | `https://nodejs.tech` | `301` |
| `<traefik-tech-pages-project>.pages.dev` | `https://traefik.tech` | `301` |

## 5. Static redirect inside each site

The repository already writes an `_redirects` file into each site directory for:

- `/Ads.txt -> /ads.txt`

Files:

- `itgrep.com/_redirects`
- `nodejs.tech/_redirects`
- `traefik.tech/_redirects`
