# Deployment

## Repository configuration

The source repository is `laingc/laingc.github.io`. Its default branch is `master`.
GitHub Pages uses GitHub Actions, not a branch of generated files.
The custom domain is `laing.nz`. `static/CNAME` records this domain in each artefact.
GitHub Actions deployments ignore this file. The Pages settings hold the active custom domain.

The workflow has read-only permissions during the build. Only the deployment job receives Pages and OpenID Connect permissions.
Deployment uses GitHub's temporary workflow token. No personal access token or SSH key is required.

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

1. Run `make bootstrap`.
2. Run `make browser-check`.
3. Review the source diff for private material and unrelated files.
4. Commit the approved change.
5. Push the commit to `master`.
6. Verify the **Check and deploy** workflow in GitHub Actions.
7. Verify the changed pages at <https://laing.nz/>.

If a check fails, the workflow does not deploy the artefact.
The workflow also supports a manual run from GitHub Actions.

## Roll back

Revert the affected source commit. Run the checks before you push the revert.
Do not restore generated output, backup files, or the retired publication history.

## Maintenance

Dependabot proposes monthly npm and GitHub Actions updates. Every update runs the same validation before deployment.
The external-link workflow runs weekly and on request. External service errors do not block source changes or deployments.
Review the Hugo, Gitleaks, and Node.js version pins monthly. Update the version files through a checked source change.

Git history replacement was a one-off migration. It is not a deployment operation.
History replacement does not remove copies from external caches or other people's clones.
