// Drawing helpers for Ash diagrams: line drawings of each post's argument, set in the site's
// type and colours. Shapes carry `dg-*` classes rather than colours, so the theme's CSS colours
// them for the current colour mode (see `.ash-diagram` in themes/ash/assets/css/ash.css).
//
// Every diagram is 1600 × 800. The left of the frame stays quiet, because the homepage fades
// that side into the page, and the key detail stays between y = 170 and y = 630, the band a
// short homepage row shows.

export const WIDTH = 1600;
export const HEIGHT = 800;

const round = value => Math.round(value * 10) / 10;
const escape = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** A repeatable pseudo-random sequence, so each build draws the same diagram. */
export function random(seed) {
  let state = seed % 2147483647 || 1;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

/** A smooth one-dimensional noise function from summed sine waves. */
export function noise(rand, octaves = 4) {
  const waves = Array.from({ length: octaves }, (_, i) => ({ f: (i + 1) * (1.7 + rand()), p: rand() * 6.28, a: 1 / (i + 1.4) }));
  return x => waves.reduce((sum, w) => sum + w.a * Math.sin(x * w.f + w.p), 0);
}

/** An SVG path through points, optionally closed. */
export function pathData(points, close = false) {
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${round(x)} ${round(y)}`).join('') + (close ? 'Z' : '');
}

/** Points along a function of x. */
export function trace(f, from, to, step = 6) {
  const points = [];
  for (let x = from; x < to; x += step) points.push([x, f(x)]);
  points.push([to, f(to)]);
  return points;
}

/** A closed, irregular outline around a centre: an island, a hill, or a contour ring. */
export function blob(rand, { x, y, r, squash = 0.62, roughness = 1 }) {
  const harmonics = [2, 3, 5, 7].map(k => ({ k, a: roughness * (0.05 + rand() * 0.11) / Math.sqrt(k / 2), p: rand() * 6.28 }));
  const radius = (angle, scale = 1) => r * scale * (1 + harmonics.reduce((sum, h) => sum + h.a * Math.sin(h.k * angle + h.p + scale * 0.8), 0));
  const ring = (scale = 1, drift = [0, 0], steps = 48) => {
    const points = [];
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const length = radius(angle, scale);
      points.push([x + drift[0] + Math.cos(angle) * length, y + drift[1] + Math.sin(angle) * length * squash]);
    }
    return points;
  };
  // The point on the outline facing another point.
  const edge = ([tx, ty]) => {
    const angle = Math.atan2((ty - y) / squash, tx - x);
    const length = radius(angle);
    return [x + Math.cos(angle) * length, y + Math.sin(angle) * length * squash];
  };
  return { x, y, r, ring, edge };
}

export class Drawing {
  constructor(id) {
    this.id = id;
    this.parts = [];
    this.defs = [];
  }

  add(markup) {
    this.parts.push(markup);
    return this;
  }

  /** A unique id within the page, since several diagrams can share one document. */
  ref(name) {
    return `${this.id}-${name}`;
  }

  path(d, cls, attrs = {}) {
    return this.add(`<path class="${cls}" d="${d}"${attributes(attrs)}/>`);
  }

  line(x1, y1, x2, y2, cls, attrs = {}) {
    return this.add(`<line class="${cls}" x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}"${attributes(attrs)}/>`);
  }

  /** A square marker centred on a point: a port, a stop, a node. */
  marker(x, y, cls = 'dg-node', size = 12) {
    return this.add(`<rect class="${cls}" x="${round(x - size / 2)}" y="${round(y - size / 2)}" width="${size}" height="${size}"/>`);
  }

  dot(x, y, r, cls, attrs = {}) {
    return this.add(`<circle class="${cls}" cx="${round(x)}" cy="${round(y)}" r="${round(r)}"${attributes(attrs)}/>`);
  }

  /** A mono label. `accent` sets it in Copper. A size goes in `style`, because the theme's
      class rule would override a `font-size` attribute. */
  label(x, y, text, { anchor = 'start', accent = false, size } = {}) {
    const attrs = {};
    if (anchor !== 'start') attrs['text-anchor'] = anchor;
    if (size) attrs.style = `font-size:${size}px`;
    return this.text(x, y, text, accent ? 'dg-label dg-label-accent' : 'dg-label', attrs);
  }

  text(x, y, text, cls, attrs = {}) {
    return this.add(`<text class="${cls}" x="${round(x)}" y="${round(y)}"${attributes(attrs)}>${escape(text)}</text>`);
  }

  /** Draws the shapes added inside `fn` clipped to a path. */
  clip(name, d, fn) {
    const id = this.ref(name);
    this.defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`);
    this.add(`<g clip-path="url(#${id})">`);
    fn();
    return this.add('</g>');
  }

  group(attrs, fn) {
    this.add(`<g${attributes(attrs)}>`);
    fn();
    return this.add('</g>');
  }

  toString() {
    const defs = this.defs.length ? `<defs>${this.defs.join('')}</defs>` : '';
    // A frame narrower than the diagram crops its quiet left side; a wider one crops top and bottom.
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMaxYMid slice">${defs}${this.parts.join('')}</svg>\n`;
  }
}

function attributes(attrs) {
  return Object.entries(attrs).map(([key, value]) => ` ${key}="${typeof value === 'number' ? round(value) : escape(value)}"`).join('');
}
