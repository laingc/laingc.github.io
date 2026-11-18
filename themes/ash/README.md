# Ash

Ash is an editorial Hugo theme for personal websites and technical writing. It pairs warm paper and graphite with a coordinated charcoal mode.

The theme includes profile and journal homepages, articles, general pages, nested sections, taxonomies, archives, search, feeds, and a 404 page.

## Requirements

- Hugo 0.146.7 or later, standard or extended edition.
- Go and Git for Hugo Module installation.
- Node.js 22.22 LTS or 24.8 or later, plus Python 3, for theme development checks.

Hugo builds the production site and processes its assets. The site serves fonts locally. Mathematics uses build-time MathML.

## Preview the example

From the theme directory, run:

```sh
hugo server --source exampleSite
```

Open `http://localhost:1313/`.

For Hugo 0.146.7–0.157.x, use the language configuration overlay:

```sh
hugo server --source exampleSite --config hugo.toml,hugo.legacy.toml
```

The example includes English, French, and Arabic content. Alex Morgan is a fictional author.

The example masthead uses Christopher Laing's Integrated cadence identity. Its SVG artwork remains unchanged.

## Install in a Hugo site

### Theme directory

1. Copy the `ash` directory into your site's `themes/` directory.
2. Add the following configuration to your site's `hugo.toml`.
3. Create your content in the site's `content/` directory.

```toml
baseURL = 'https://example.org/'
title = 'Your name'
theme = 'ash'
defaultContentLanguage = 'en'
timeZone = 'Pacific/Auckland'
enableRobotsTXT = true

[languages.en]
locale = 'en-NZ'
label = 'English'

[pagination]
pagerSize = 8

[outputs]
home = ['HTML', 'RSS', 'Search']

[markup.highlight]
noClasses = false

[params]
description = 'A short description of your website.'
mainSections = ['blog']

[params.author]
name = 'Your name'

[[menus.main]]
name = 'Writing'
pageRef = '/blog'
weight = 10

[[menus.main]]
name = 'About'
pageRef = '/about'
weight = 20
```

On Hugo versions before 0.158, use `languageCode`, `languageName`, and `languageDirection` instead of `locale`, `label`, and `direction`.

The example's `themesDir` value serves its bundled directory structure. A normal site uses Hugo's default `themes/` directory.

### Hugo Module

Initialise a module in the consuming site:

```sh
hugo mod init example.org/my-site
```

Replace `theme = 'ash'` with this import:

```toml
[[module.imports]]
path = 'example.org/ash'
```

For a local copy, point Hugo at the theme directory:

```sh
HUGO_MODULE_REPLACEMENTS="example.org/ash -> /absolute/path/to/ash" hugo server
```

`example.org/ash` is a local placeholder. For a published theme, use its actual repository module path and remove the local replacement.

## Content structure

```text
content/
├── _index.md
├── about.md
├── archive.md
├── search.md
└── blog/
    ├── _index.md
    └── first-essay/
        ├── index.md
        └── photograph.jpg
```

General pages use the reading layout. Pages in `mainSections` receive article metadata and navigation. `type = 'article'` also enables article treatment.

Sections can contain more sections. Hugo's normal content lookup, aliases, page weights, and permalink configuration remain available.

### Homepage

Add the homepage content to `content/_index.md`:

```toml
+++
title = 'Your name'
writingTitle = 'Ideas worth working through.'
featured = ['/blog/first-essay']

[hero]
eyebrow = 'Your field of work'
title = 'Your name'
location = 'Wellington, New Zealand'
intro = 'A personal introduction. **Markdown emphasis** is available.'
description = 'A short supporting paragraph.'

[[hero.links]]
label = 'Read my writing'
url = '/blog/'

[[sections]]
id = 'perspective'
label = '01 / Perspective'
title = 'A heading for this section.'
body = 'The body accepts Markdown.'
image = 'images/landscape.jpg'
imageAlt = 'Describe the photograph.'
caption = 'A short caption.'
reverse = false

[[sections.links]]
label = 'Read more'
url = '/about/'
+++
```

Optional hero fields are `image`, `imageAlt`, and `caption`. Ordinary homepage Markdown appears between the introduction and configured sections.

Without `featured`, the homepage selects recent entries from `mainSections`. Set `homeMode = 'journal'` for pagination or `showPosts = false` to hide entries.

#### Ash diagrams

A page's `diagram` is a line drawing in SVG under `assets/`. The theme inlines it, so its shapes take the colours of the current colour mode:

```toml
[diagram]
src = 'diagrams/the-memo.svg'
alt = 'A contour map of islands joined only by routes between ports on their shores.'
```

The diagram replaces the cover image at the top of the page. There it shows its centred frame, named by `data-frame="x y width height"` on the `svg` element, across the heading's column, and fades into the page on every side. Frame the drawing's subject with room for the fades; the frame may run past the drawing, so a shape cut at the drawing's edge falls inside the fade. Without `data-frame`, the whole drawing shows. A phone crops both sides of the frame. `alt` names the diagram for assistive technology.

Lists show the whole drawing, which fades in at the left and runs to the window edge, so put the detail of a drawing to the right and keep its left side quiet. A wide row shows the middle third of its height.

Shapes name a role with a class rather than a colour: `dg-faint`, `dg-line`, `dg-strong`, `dg-muted`, `dg-ink`, and `dg-accent` for lines; `dg-canvas` and the `dg-shape-*` classes for shapes filled with the page canvas; `dg-node`, `dg-node-accent`, `dg-dot`, and `dg-dot-ink` for markers; and `dg-label`, `dg-label-accent`, and `dg-code` for text. A diagram's own ids must be unique on the page. Link previews cannot use SVG, so give the page an `[[images]]` entry with a raster copy.

#### Illustrated entries and a closing band

Set `postImages = true` on the homepage, or in a section's `_index.md`, to show each entry's `diagram`, or failing that its `cardImage`, behind its row. A diagram on a card is decorative and hidden from assistive technology. A `cardImage` is a raster image:

```toml
[cardImage]
src = 'images/ridge.jpg'
position = '50% 54%'
tone = 'dark'
```

On wide screens the image sits behind the right of the row, fades into the list, and runs to the window edge. On screens up to 900 pixels wide it becomes a strip above the entry. The image is decorative and has empty alternative text. `position` sets the `object-position` of the crop. Add `srcLight` to give Light mode its own image; each mode loads only its own. Without it, `tone` (`dark` or `light`) names the grade of `src`, and the theme regrades the image in the other colour mode.

Add a `[closing]` table to show a band after the entries:

```toml
[closing]
label = 'Connect'
title = 'A closing statement.'
image = 'images/coast.jpg'
imagePosition = '55% 45%'

[[closing.links]]
label = 'Get in touch'
url = 'https://example.org/contact/'
```

The band keeps Ash Dark colours in both modes. Its image fades into the band from the right. Add `imageAlt` when the image carries meaning. Without it, the image is decorative. An optional `caption` adds a small line at the lower right, such as a photo credit.

### Articles

Create an article bundle with the supplied archetype:

```sh
hugo new content --kind blog blog/first-essay
```

An article can use these fields:

```toml
+++
title = 'The title of the essay'
subtitle = 'An optional subtitle.'
description = 'The description used in listings and metadata.'
date = 2026-02-12T09:00:00+13:00
lastmod = 2026-02-15T11:30:00+13:00
draft = false
author = 'Your name'
tags = ['systems', 'decisions']
categories = ['Technology']
series = ['Working notes']
aliases = ['/an-old-address/']
showToc = true

[cover]
src = 'photograph.jpg'
alt = 'Describe the subject of the photograph.'
caption = 'An optional caption with source information.'
+++
```

`<!--more-->` sets the summary boundary. `showToc`, `showReadingTime`, `showRelated`, and `showPostNavigation` accept page-level overrides.

| Field | Effect |
| --- | --- |
| `hidden = true` | Excludes the page from automatic content lists, feeds, and search. The page still builds. |
| `noindex = true` | Adds search-engine metadata and excludes the page from sitemaps, feeds, and local search. |
| `search = false` | Excludes the page from local search only. |
| `canonicalURL` | Supplies a canonical URL for republished content. |
| `images` | Supplies social image paths. `cover.src` takes priority. |

Hugo controls draft, future, and expired publication states. Its preview flags also apply to the theme.

### Search and archive pages

Create `content/search.md`:

```toml
+++
title = 'Search'
layout = 'search'
hidden = true
noindex = true
+++
```

Search requires `Search` in `outputs.home`. Each language receives its own index. Search matches titles, taxonomy terms, and article text.

The search page supports `?q=your+query`. Without JavaScript, it shows links to the indexed pages.

Create `content/archive.md`:

```toml
+++
title = 'Archive'
layout = 'archive'
hidden = true
+++
```

The archive groups entries from `mainSections` by publication year.

## Configuration reference

| Parameter under `[params]` | Default | Purpose |
| --- | --- | --- |
| `description` | Empty | Site description and metadata fallback. |
| `author.name` | Site title | Default author and copyright name. |
| `copyright` | Author or site title | Footer copyright text, after the year. |
| `defaultTheme` | `light` | `light`, `dark`, or `system`. An explicit browser selection takes priority. |
| `dateFormat` | `2 January 2006` | Hugo date format, localised by language. |
| `mainSections` | Hugo's inferred sections | Content sections used for article lists and the home feed. |
| `homeMode` | `profile` | `profile` or paginated `journal`. |
| `homePosts` | `3` | Number of entries on a profile homepage. |
| `showToc` | `true` | Table of contents when the page has headings. |
| `showReadingTime` | `true` | Estimated reading time for articles. |
| `showRelated` | `true` | Related articles from Hugo's related-content configuration. |
| `showPostNavigation` | `true` | Previous and next articles in the same section. |
| `showThemeCredit` | `true` | Footer theme credit. |
| `rssFullContent` | `false` | Full article content instead of summaries in feeds. |
| `logo` | Text wordmark | An image path for the header wordmark. |
| `brand` | Empty | Light/Dark logo paths and optional small-screen variants. See the example below. |
| `favicon` | Ash SVG | A custom favicon path. |
| `faviconFallback` | Empty | ICO fallback path. |
| `appleTouchIcon` | Empty | 180 × 180 PNG touch icon path. |
| `images` | Empty | Default social image paths. |
| `social` | Empty | An array of `{ name, url }` entries for the footer. |

`menus.main` supports nested entries. `menus.footer` supplies footer links. Use `pageRef` for content pages so Hugo resolves translated paths.

Hugo's `pagination.pagerSize`, `taxonomies`, `related`, `services.rss.limit`, and `outputs` control the corresponding native features.

### Integrated cadence identity

The supplied example uses the compact lockup at 320 px and the small symbol at 48 px. Below 600 px, the symbol replaces the full lockup.

At smaller desktop widths, the header lockup uses 280 px. Neither layout crops, mirrors, retypes, or recolours the artwork.

```toml
[params]
favicon = 'brand/favicon.svg'
faviconFallback = 'brand/favicon-light.ico'
appleTouchIcon = 'brand/ic-icon-light-180.png'

[params.brand]
name = 'Christopher Laing'
light = 'brand/ic-lockup-compact-light.svg'
dark = 'brand/ic-lockup-compact-dark.svg'
smallLight = 'brand/ic-symbol-small-light.svg'
smallDark = 'brand/ic-symbol-small-dark.svg'
width = 320
height = 74
```

Place the assets in your site's `assets/brand/` directory. The header and footer use the same brand partial.

An accessible name on the home link identifies the logo. Empty image alternatives prevent duplicate announcements.

The favicon follows the browser's colour preference independently of the page's explicit colour selection. The ICO and touch icon use the supplied light treatment.

For another identity, replace these asset paths and dimensions. The legacy `logo` parameter remains supported for a single image.

## Images and rich content

Images resolve from a page bundle, then `assets/`, then a static path or remote URL. JPEG and PNG resources receive responsive image variants.

SVG, GIF, and WebP images retain their original files. Remote images load from their source. The theme does not fetch remote images during builds.

Markdown images retain their natural colours. Hero and cover images receive Ash's mode-specific photographic treatment.

The theme supports code fences, tables, footnotes, task lists, definition lists, quotations, and heading links. Task checkboxes receive accessible labels during the build.

Use the shortcodes documented in [docs/shortcodes.md](docs/shortcodes.md) for figures, callouts, quotations, audio, and video. Hugo's built-in shortcodes are also available.

### Mathematics

Enable the Goldmark passthrough extension in the site configuration:

```toml
[markup.goldmark.extensions.passthrough]
enable = true
[markup.goldmark.extensions.passthrough.delimiters]
block = [['\[', '\]'], ['$$', '$$']]
inline = [['\(', '\)']]
```

Use `\(a^2 + b^2 = c^2\)` inline or `$$ ... $$` for a display equation. Hugo renders MathML at build time.

## Languages and dates

The theme includes English, French, and Arabic interface translations. Add translation tables in the site's `i18n/` directory for other languages.

Set `direction = 'rtl'` for right-to-left languages. The layout uses logical CSS properties and system font fallbacks for scripts outside the bundled fonts.

Use Hugo's filename or content-directory translation conventions. Translation links appear when equivalent pages exist.

The example uses `Pacific/Auckland` and explicit date offsets. Hugo handles New Zealand daylight saving for dates without explicit offsets.

## Customise the theme

### Ash 1.2 colours

Both modes use Copper `#C4521E` for the standard accent and accent text. `assets/css/ash-tokens.css` contains primitives, semantic roles, and component roles. Existing `--accent` and `--accent-text` names remain compatible. Raised and high surfaces retain standard Copper.

`assets/css/ash-colour-components.css` supplies opaque Copper action states, readable disabled labels, and semantic callouts. Add `button--copper` to an existing `button` for a genuine primary action. `button--secondary` selects an outlined action. Native `disabled` prevents activation, and `aria-pressed="true"` identifies a selected toggle.

The supplied active brand assets use the approved Copper mapping with the original Integrated cadence geometry. The versioned v1 source package remains historical.

In the parent project, the canonical source is `design-language/ash-tokens.css`. Run `python3 design-language/scripts/build-colours.py` from the project root after an edit. The exported files remain self-contained in this theme archive.

`--ash-accent-strong`, legacy Copper names, and high-surface focal aliases all resolve to standard Copper. `--ash-control-border` remains the separate neutral control outline. Status meanings are Moss success, Fjord information, Ochre warning, and Mulberry error.

`scripts/contrast-policy.json` records the user's approved Copper appearance exception. Tests retain failing contrast results and accept only the listed Copper applications. Other accessibility failures remain errors. White button labels and neutral keyboard focus retain their normal checks.

- Add `assets/css/custom.css` to override semantic colour, spacing, or font variables.
- Add `layouts/_partials/extend-head.html` for extra document-head content.
- Add `layouts/_partials/extend-footer.html` for content before the closing body tag.
- Override any layout, partial, render hook, or shortcode at the same path in your site.
- Use `data/` and site-specific partials for additional structured content.

The current layout convention uses `home.html`, `single.html`, `_partials/`, `_markup/`, and `_shortcodes/` directly under `layouts/`.

## Build and deploy

From your site directory, run:

```sh
hugo --minify
```

Publish the generated `public/` directory to a static host. Configure the host to serve `404.html` for missing paths.

For subdirectory hosting, include the prefix in `baseURL`, such as `https://example.org/notes/`. The theme resolves navigation and assets beneath that prefix.

The theme fingerprints CSS and JavaScript. It emits RSS feeds, social metadata, structured data, and sitemaps through Hugo.

## Development checks

From the theme directory, run:

```sh
npm ci
npx playwright install chromium
npm run test:build
npm run test:html
npm test
```

The build checks require Hugo and Go on `PATH`. Set `HUGO_BIN` to select a Hugo executable.

To include the minimum-version build, set `HUGO_MIN_BIN`:

```sh
HUGO_MIN_BIN=/path/to/hugo-0.146.7 npm run test:build
```

Checks cover independent consumer sites, module installation, empty sites, publication states, base paths, multilingual output, local links, metadata, XML, and JSON.

The HTML check validates generated documents against HTML content rules.

Browser checks cover responsive layouts, keyboard access, theme persistence, code copying, search, JavaScript-disabled reading, and automated accessibility rules.

Start the example server before you generate screenshots:

```sh
npm run screenshots
```

`ASH_PREVIEW_URL` selects a different preview address. Generated previews appear in `images/` and `.test-output/screenshots/`.

## Distribution

The theme code and original example material use the MIT licence. Font and photograph licences appear in [THIRD-PARTY.md](THIRD-PARTY.md).

Create a clean archive with:

```sh
python3 scripts/package-theme.py --output ../../ash-theme.zip
```

The archive excludes build output, dependency directories, and test reports.

Before theme-directory submission, set `homepage` and `licenselink` in `theme.toml` to the actual public repository URLs. Add `demosite` after deployment.

The `images/` directory contains the required 1500 × 1000 screenshot and 900 × 600 thumbnail. See the [Hugo theme-directory requirements](https://github.com/gohugoio/hugoThemesSiteBuilder#adding-a-theme).
