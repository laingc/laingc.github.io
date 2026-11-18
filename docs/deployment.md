# Deployment

## Repository configuration

The source repository is `laingc/laingc.github.io`. Its default branch is `master`.
GitHub Pages serves the root of the `gh-pages` branch. That branch contains only built files: one commit, replaced on each deployment.
`./deploy.sh` builds and checks the site locally, adds `.nojekyll` so that Pages serves the files unchanged, and force-pushes the branch.
The push uses your normal Git credentials. GitHub then publishes the branch with its own built-in job.

The custom domain is `laing.nz`. `static/CNAME` records this domain in each build, and the Pages settings hold the same value.
The **Check** workflow runs the source and browser checks on pushes and pull requests to `master`, with read-only permissions. It does not deploy.

## Domains

Cloudflare manages DNS for all three domains. The account settings are not in this repository.

| Host | Cloudflare configuration | Result |
| --- | --- | --- |
| `laing.nz` | Proxied `A` and `AAAA` records to the GitHub Pages addresses | Serves the site |
| `www.laing.nz` | Proxied `CNAME` to `laingc.github.io` | GitHub Pages redirects to `laing.nz` |
| `chrislaing.net`, `www.chrislaing.net` | Proxied records and a single redirect rule | `301` to the same path and query on `laing.nz` |
| `christopherlaing.com`, `www.christopherlaing.com` | Proxied records and a single redirect rule | `301` to the same path and query on `laing.nz` |

The `laing.nz` and `chrislaing.net` zones use SSL mode **Full**. GitHub Pages does not issue a certificate for a proxied domain.
Cloudflare provides the public certificate and **Always Use HTTPS** upgrades plain HTTP requests.

The `chrislaing.net` redirect rules for `/linkedin` and `/contact/professional` come before the domain redirect.
Keep this order when you add rules. The `laing.nz` zone has the same two short links for the `laing.nz` host. The disabled `laing.nz` page rule sends traffic to `chrislaing.net`.
Do not enable it, because it would create a redirect loop.

Mail records on `chrislaing.net` and `laing.nz` are independent of the website redirect.

## Publish a change

1. Run `make bootstrap` once, and again after a tool version changes.
2. Review the change for private material and unrelated files.
3. Run `./deploy.sh`. It stops if any check fails, and reports when the site is live.
4. Verify the changed pages at <https://laing.nz/>.
5. Commit the change and push `master`, so the source matches the live site.

Cloudflare may serve cached copies of images and styles for a short time after a deployment.

## Roll back

Revert the affected source commit, then run `./deploy.sh`. Push the revert to `master`.
Do not restore generated output, backup files, or the retired publication history.

## Maintenance

Dependabot proposes monthly npm and GitHub Actions updates. The **Check** workflow tests each update.
The external-link workflow runs weekly and on request. External service errors do not block source changes or deployments.
Review the Hugo, Gitleaks, and Node.js version pins monthly. Update the version files through a checked source change.

Git history replacement was a one-off migration. It is not a deployment operation.
History replacement does not remove copies from external caches or other people's clones.
