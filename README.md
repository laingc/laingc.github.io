# chrislaing.net

A Hugo site for Christopher Laing. This repository contains the source and the deployment workflow.
GitHub Actions deploys the checked build to GitHub Pages at <https://chrislaing.net/>.

## Requirements

- macOS or Linux
- Node.js from `.node-version`, or a compatible version from `package.json`
- Python 3.10 or later for the standard-library tool installer
- Make

Hugo uses the version in `.hugo-version`. Gitleaks uses `.gitleaks-version` for the source secret scan.
The installer checks release checksums and writes the binaries to `.tools/`.
The site has no runtime npm dependencies, theme submodules, analytics, or third-party JavaScript libraries.

## Prepare the tools

```sh
make bootstrap
npx playwright install chromium
```

On Linux, use `npx playwright install --with-deps chromium` to install browser system dependencies.

## Develop

```sh
make dev       # Published content at http://localhost:1313
make preview   # Include drafts and future posts locally
make check     # Fresh production build, unit checks, site validation, and secret scan
make browser-check
```

`make build` replaces `public/` with a fresh build. Do not store source files in this directory.
`make clean` removes only the generated `public/` directory.

## Add a post

```sh
TZ=Pacific/Auckland .tools/hugo new content blog/my-post.md
```

Keep `draft = true` until the article is ready for publication. Use a timezone-aware date for new posts.
Historical dates remain unchanged. A draft remains visible in this public source repository, even though the website excludes it.

## Deploy

Run the checks before a commit. Push approved source changes to `master`.
The workflow runs source checks and desktop and mobile browser checks before deployment.
Pull requests never deploy. Generated output never enters Git history.

`./deploy.sh` runs local checks only. It does not create commits or push changes.
See [deployment](docs/deployment.md) and [architecture](docs/architecture.md) for details.

## Historical notebooks

The notebooks document experiments from 2017. They remain historical records, not supported executable examples.
See [the archive notes](python_code/notebooks/README.md).

## Design attribution

The project-owned design adapts Future Imperfect by HTML5 UP, Julio Pescador, and Patrick Collins.
The templates, styles, and browser code replace the retired theme implementation.
See [the design licence](docs/design-licence.md).
