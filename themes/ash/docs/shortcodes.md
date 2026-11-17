# Shortcodes

Use paired shortcodes for Markdown content. Use named parameters for media and captions.

## Figure

```text
{{< figure src="photo.jpg" alt="A description of the image." caption="A short caption." attr="Source name" attrlink="https://example.org/" >}}
```

`src` resolves from the page bundle, the asset directory, or a static or remote URL. Other parameters are `title`, `link`, `width`, `height`, and `class`.

`caption` accepts Markdown. `alt` supplies the image description. An empty `alt` identifies a decorative image.

## Callout

```text
{{< callout title="A useful qualification" >}}
This content accepts **Markdown**, lists, and links.
{{< /callout >}}
```

The optional `kind` parameter accepts `success`, `information`, `warning`, or `danger`. Each has a translated status label, a distinct symbol, and tested text, surface, and border tokens. Unknown values retain the existing custom-class behaviour. An omitted kind remains an editorial callout.

```text
{{< callout kind="warning" title="Review the source" >}}
The source needs review before this figure can support a decision.
{{< /callout >}}
```

## Quotation

```text
{{< quote author="Author name" source="Publication" url="https://example.org/" >}}
The quoted passage goes here.
{{< /quote >}}
```

The theme places the attribution after the quotation. The source link is optional.

## Audio

```text
{{< audio src="interview.mp3" type="audio/mpeg" title="Interview with the author" caption="Recorded in Wellington." >}}
**Transcript:** Place the spoken content here.
{{< /audio >}}
```

The player uses native browser controls. `title` supplies its accessible name. The transcript remains available beneath the player.

## Video

```text
{{< video src="demonstration.mp4" type="video/mp4" title="Demonstration" poster="poster.jpg" captions="captions.vtt" caption="A short demonstration." >}}
**Description:** Describe important visual details here.
{{< /video >}}
```

`captions` refers to a WebVTT file. The language follows the page language. `poster` supplies a still image before playback.

## External video

Hugo's built-in YouTube and Vimeo shortcodes use the article layout:

```text
{{< youtube id="VIDEO_ID" title="A descriptive video title" loading="lazy" >}}
```

Hugo's `privacy` configuration controls supported external services. Embedded services can make network requests in the reader's browser.

## Code and tables

Fenced code uses Hugo's Chroma highlighter. Code blocks include a copy control when JavaScript is available.

````text
```python {linenos=inline,hl_lines=[2]}
def double(value):
    return value * 2
```
````

Markdown tables receive a scrollable region on narrow screens. Header cells retain their column semantics and alignment.
