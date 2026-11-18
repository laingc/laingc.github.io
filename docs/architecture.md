# Architecture

Hugo converts Markdown and TOML front matter into static HTML. The local Ash theme lives in `themes/ash/`.
The site uses a profile homepage, an article archive, and reading layouts. Existing article URLs remain unchanged.
The homepage sections live in `content/_index.md`. The logo assets live in `assets/brand/`.

Hugo fingerprints the CSS and JavaScript in `assets/`. Syntax highlighting runs during the build.
The theme supplies Light and Dark styles, local fonts, and syntax highlighting.

Search uses `search.json` and browser-native JavaScript. The `/search/` page includes a page list for readers without JavaScript.
The existing `index.json` remains available for published articles. Its project-owned template lives in `layouts/`.
The script creates text nodes for results. It never inserts article text as HTML.

The website remains readable without JavaScript. Images and the domain file live in `static/`.
The existing YouTube shortcode embeds external video content. No other external scripts or fonts are required.

A project motion layer adds visual effects without changes to the theme or the content.
`assets/css/custom.css` uses the theme's custom stylesheet hook. `layouts/_partials/extend-footer.html` loads `assets/js/motion.js`.
The site opens in Dark mode (`defaultTheme` in `hugo.toml`). A reader's own choice of mode takes priority.
On the homepage, the header and masthead are always a dark band. Below the masthead, the page follows the reader's mode.
Headings, the name, and the introduction line use IBM Plex Mono, the face of the labels and dates.
The masthead has an entrance sequence, decoder text on the mono labels, and a faint Copper ROC plot on a 2D canvas.
The plot draws the logo's curve, with capability against complexity. Its operating point starts at the logo's position and follows a fine pointer along the curve.
The plot ends just past the name, and the name sits in the shaded area under the curve. The introduction sits on the open grid beyond the plot.
The grid and the operating point's dashed guide fade to half strength where they pass behind the name (`NAME_GRID_FADE` in `motion.js`).
Link text briefly decodes when a mouse pointer arrives on it. Screen readers keep the real text throughout.
Article lists, such as `/blog/` and each category, continue as the reader scrolls. `extend-footer.html` puts every card for the list in an inert template, and `motion.js` adds them near the end of the list.
The paginated pages remain for readers without JavaScript and for existing links. The back button returns to the same depth.
A sticky cadence strip above each list marks every article on a time axis and follows the article that the reader is on.
The homepage entries carry Ash images (`postImages` in `content/_index.md` and `cardImage` in each article). On wide screens each image fades into the list behind the right of its row. On narrow screens it becomes a strip above the entry.
A closing band (`[closing]`) follows the entries. It carries the statement of priorities and a lighthouse image, and keeps Ash Dark colours in both modes, like the masthead.
The point's readout moves to keep clear of the masthead text. On short landscape screens the name sits beside the introduction. On screens 1800 pixels wide or more, the column widens.
Content below the fold rises into view, rules draw across, and the theme toggle reveals the new colour mode in a circle.
The script hides only content that is below the fold when the page loads. When the reader prefers reduced motion, nothing moves.

Two theme templates support legacy `[[images]]` metadata: `layouts/single.html` and `layouts/_partials/ash/metadata.html` within `themes/ash/`.
They preserve featured images and social image URLs without changes to the existing articles.
The theme image partial reads dimensions from existing static images to reserve space before each image loads.

Every production build starts with an empty `public/` directory. This prevents stale pages and backups from surviving a rebuild.
Production builds exclude drafts and future posts. Redirects send `/about/` and `/about-me/` to the homepage, and preserve `/blog/three-types-of-ai/`.

Validation checks front matter, local targets, image descriptions, HTTPS canonical URLs, RSS, the sitemap, and the search index.
Gitleaks scans the source for credentials and redacts matches in its output.
Browser checks cover desktop and mobile layouts, navigation, search, redirects, and disabled JavaScript.

The old notebooks do not enter the published artefact. npm dependencies support development and validation only.
