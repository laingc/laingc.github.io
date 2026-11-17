+++
title = 'A notebook with sound and movement'
date = 2025-10-20T09:00:00+13:00
description = 'Local audio and video, a transcript, captions, and a standard Hugo video embed.'
tags = ['media', 'writing']
categories = ['Field notes']
+++
Media works best when its role is clear. This page demonstrates the native controls and the text that accompanies them.

## A short audio sample

{{< audio src="media/tone.wav" type="audio/wav" title="Example audio tone" caption="A one-second synthetic tone created for this example." >}}
**Transcript:** A single steady tone. There is no speech.
{{< /audio >}}

## A local video

{{< video src="media/sample.mp4" type="video/mp4" poster="images/landscape.jpg" captions="media/sample.vtt" title="Example colour field" caption="A two-second colour field, created for this example." >}}
**Description:** A warm graphite field remains still for two seconds. The clip has no audio.
{{< /video >}}

## A standard Hugo embed

This example uses Hugo’s built-in YouTube shortcode. The video comes from an external service.

{{< youtube id="bLqJHjXihK8" title="Information theory and deep learning" loading="lazy" >}}
