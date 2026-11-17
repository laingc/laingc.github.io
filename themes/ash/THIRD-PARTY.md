# Third-party assets

## Fonts

Fontsource supplies the unmodified WOFF2 files in `assets/fonts/`.

| Typeface | Source package | Licence file |
| --- | --- | --- |
| Source Serif 4 | `@fontsource-variable/source-serif-4` | `licenses/source-serif-4.txt` |
| DM Sans | `@fontsource-variable/dm-sans` | `licenses/dm-sans.txt` |
| IBM Plex Mono | `@fontsource/ibm-plex-mono` | `licenses/ibm-plex-mono.txt` |

These fonts use the SIL Open Font Licence 1.1. Source Serif 4 and DM Sans include Latin and extended Latin subsets.

IBM Plex Mono includes the Latin subset. Other scripts use the browser's available fallback fonts.

Source: [Fontsource](https://fontsource.org/).

## Example photograph

- File: `exampleSite/assets/images/landscape.jpg`.
- Source: [Unsplash photograph, image identifier photo-1469521669194-babb45599def](https://images.unsplash.com/photo-1469521669194-babb45599def).
- Licence: [Unsplash Licence](https://unsplash.com/license).
- Use: example content, generated image variants, and theme screenshots.

The photograph retains its separate licence. The theme's MIT licence covers the original theme code and original example material.

## Integrated cadence identity

The files in `exampleSite/assets/brand/` are unchanged copies from `logo/integrated-cadence-v1/assets/` in the parent project.

The compact lockups preserve Christopher Laing's fixed vector lettering and integrated symbol. Small symbols and favicons use the pack's optical variants.

The Light and Dark palettes come from the supplied assets. The theme does not reconstruct the lettering or apply image filters.

The identity belongs to Christopher Laing. The theme licence does not grant rights to use the identity as another person's brand.

## Original example media

The SVG process diagram, one-second synthetic audio tone, two-second colour-field video, and caption file were created for this theme.

These files use the theme's MIT licence. The process and numerical examples are illustrative.

## Development dependencies

Playwright, axe-core, and html-validate run the development checks. The production website does not include these packages.

Hugo supplies Chroma syntax highlighting and the embedded KaTeX engine used for MathML generation.
