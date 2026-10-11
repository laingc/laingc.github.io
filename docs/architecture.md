# Architecture

Hugo converts Markdown and TOML front matter into static HTML. Project-owned templates live in `layouts/`.
The content layout retains the site's article cards, profile sidebar, navigation, and existing URLs.

Hugo fingerprints the CSS and JavaScript in `assets/`. Syntax highlighting runs during the build.
The stylesheet for syntax highlighting uses Hugo's `github` Chroma style.

Search uses the generated `index.json` and browser-native JavaScript. It searches published article titles and content.
The script creates text nodes for results. It never inserts article text as HTML.

The website remains readable without JavaScript. Images and the domain file live in `static/`.
The existing YouTube shortcode embeds external video content. No other external scripts or fonts are required.

Every production build starts with an empty `public/` directory. This prevents stale pages and backups from surviving a rebuild.
Production builds exclude drafts and future posts. Redirects preserve `/about-me/` and `/blog/three-types-of-ai/`.

Validation checks front matter, local targets, image descriptions, HTTPS canonical URLs, RSS, the sitemap, and the search index.
Gitleaks scans the source for credentials and redacts matches in its output.
Browser checks cover desktop and mobile layouts, navigation, search, redirects, and disabled JavaScript.

The old notebooks do not enter the published artefact. npm dependencies support development and validation only.
