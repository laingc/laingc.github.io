// One Ash diagram per published post, keyed by the post's file name. Each draws the post's
// central idea as a landscape: contours, ridges and routes, with one Copper element.
import { WIDTH as W, HEIGHT as H, random, noise, pathData, trace, blob } from './lib.mjs';

const dash = rand => `${2 + Math.round(rand() * 10)} ${4 + Math.round(rand() * 14)}`;
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Broken horizontal lines, like wind on water. */
function striations(d, rand, { top, bottom, step, from, spread, length }) {
  for (let y = top; y < bottom; y += step) {
    const x0 = from + rand() * spread;
    d.line(x0, y, Math.min(W, x0 + length[0] + rand() * length[1]), y, 'dg-faint', { 'stroke-dasharray': dash(rand) });
  }
}

/** A hill or island as nested contour rings. The outer ring hides what lies behind it. */
function contourHill(d, rand, spec, { rings = [1, 0.8, 0.62, 0.46, 0.31, 0.17], outer = 'dg-shape', inner = 'dg-line', drift = [10, -6] } = {}) {
  const hill = blob(rand, spec);
  rings.forEach((scale, i) => {
    d.path(pathData(hill.ring(scale, [(1 - scale) * drift[0], (1 - scale) * drift[1]]), true), i === 0 ? outer : inner);
  });
  return hill;
}

/** A ridge line that hides what lies below and behind it. */
function ridge(d, points, cls, attrs = {}) {
  d.path(pathData([...points, [points.at(-1)[0], H], [points[0][0], H]], true), 'dg-canvas');
  d.path(pathData(points), cls, attrs);
}

/** Points spread over a box, no two closer than `gap`. */
function scatter(rand, count, [x0, y0, x1, y1], gap) {
  const points = [];
  for (let tries = 0; points.length < count && tries < count * 400; tries++) {
    const point = [x0 + rand() * (x1 - x0), y0 + rand() * (y1 - y0)];
    if (points.every(other => distance(point, other) >= gap)) points.push(point);
  }
  return points;
}

const nearest = (points, point, k) => points.filter(other => other !== point).sort((a, b) => distance(a, point) - distance(b, point)).slice(0, k);

function gaussian(rand) {
  return Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
}

/** A short closed route through every stop: nearest neighbour, then 2-opt. */
function tour(stops, start) {
  const route = [start];
  const left = new Set(stops.filter(stop => stop !== start));
  while (left.size) {
    const next = [...left].sort((a, b) => distance(route.at(-1), a) - distance(route.at(-1), b))[0];
    route.push(next);
    left.delete(next);
  }
  for (let improved = true; improved;) {
    improved = false;
    for (let i = 1; i < route.length - 1; i++) {
      for (let j = i + 1; j < route.length; j++) {
        const [a, b, c, e] = [route[i - 1], route[i], route[j], route[(j + 1) % route.length]];
        if (distance(a, c) + distance(b, e) < distance(a, b) + distance(c, e) - 0.01) {
          route.splice(i, j - i + 1, ...route.slice(i, j + 1).reverse());
          improved = true;
        }
      }
    }
  }
  return route;
}

export const diagrams = {
  // Teams as sealed islands. Routes run only between ports on their shores.
  'the-memo'(d) {
    const rand = random(11);
    striations(d, rand, { top: 236, bottom: 610, step: 15, from: 540, spread: 360, length: [180, 600] });
    const islands = [
      { x: 700, y: 360, r: 84 }, { x: 925, y: 520, r: 108 }, { x: 1135, y: 320, r: 98 },
      { x: 1345, y: 505, r: 116 }, { x: 1530, y: 300, r: 90 }, { x: 1585, y: 650, r: 60 },
    ].map(spec => contourHill(d, rand, spec));
    const routes = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 4], [3, 5]];
    const copper = 3;
    routes.forEach(([a, b], i) => {
      const from = islands[a].edge([islands[b].x, islands[b].y]);
      const to = islands[b].edge([islands[a].x, islands[a].y]);
      d.line(...from, ...to, i === copper ? 'dg-accent' : 'dg-muted', i === copper ? { 'stroke-width': 2.6 } : { 'stroke-dasharray': '3 7' });
      for (const port of [from, to]) d.marker(...port, i === copper ? 'dg-node-accent' : 'dg-node');
    });
    const from = islands[2].edge([islands[3].x, islands[3].y]);
    const to = islands[3].edge([islands[2].x, islands[2].y]);
    d.label((from[0] + to[0]) / 2 - 40, (from[1] + to[1]) / 2 + 9, 'SERVICE INTERFACE', { anchor: 'end', accent: true });
  },

  // Software's cost flattens once it is built. An LLM's keeps rising with every call.
  'the-economics-and-ergonomics-of-ai'(d) {
    const rand = random(23);
    const left = 480, right = W, base = 590;
    for (let i = 0; i < 7; i++) {
      const n = noise(rand, 4);
      const ranges = trace(x => {
        const t = (x - left) / (right - left);
        return 350 + i * 30 - (64 + i * 10) * (0.5 + 0.5 * n(t * 2.6 + i * 1.7)) * Math.min(1, t * 4);
      }, left, right, 8);
      ridge(d, ranges, i < 3 ? 'dg-faint' : 'dg-line');
    }
    const built = t => 160 * (1 - Math.exp(-t * 18));
    const software = trace(x => base - built((x - left) / (right - left)) - 6 * (x - left) / (right - left), left, right, 4);
    d.path(pathData(software), 'dg-ink', { 'stroke-width': 1.8 });
    const llm = trace(x => base - built((x - left) / (right - left)) - Math.floor((x - left) / 24) * 3.9, left, right, 4);
    d.path(pathData(llm), 'dg-accent', { 'stroke-width': 2.6 });
    d.label(right - 64, 222, 'LLM · COST PER TOKEN', { anchor: 'end', accent: true });
    d.label(right - 64, 466, 'SOFTWARE · MARGINAL COST ≈ 0', { anchor: 'end' });
    d.line(left, base + 28, right, base + 28, 'dg-line');
    for (let x = left; x <= right; x += 24) d.line(x, base + 23, x, base + 28, 'dg-line');
    d.label(right - 64, base + 66, 'USAGE →', { anchor: 'end' });
  },

  // A range drawn in lines of diagram-as-code, with a cursor at the summit.
  'high-code'(d) {
    const rand = random(5);
    const n = noise(rand, 6);
    const left = 420, right = W, floor = 640;
    const height = x => {
      const t = (x - left) / (right - left);
      const peaks = 340 * Math.exp(-((t - 0.56) ** 2) / 0.018) + 210 * Math.exp(-((t - 0.86) ** 2) / 0.012) + 130 * Math.exp(-((t - 0.28) ** 2) / 0.02);
      return floor - 40 - peaks - 14 * n(t * 14);
    };
    const skyline = trace(height, left, right, 4);
    const code = [
      'flowchart LR', 'problem --> text', 'text --> completion', 'completion --> code', 'code --> result',
      'infrastructure-as-code', 'diagrams-as-code', 'policy-as-code', 'always bet on text', 'graph TD; A --> B; B --> C',
      'resource "aws_s3_bucket" "notes" {}', 'sequenceDiagram', 'author ->> model: prompt', 'model -->> author: completion',
    ];
    d.clip('range', pathData([[left, floor], ...skyline, [right, floor]], true), () => {
      for (let row = 0, y = 200; y < floor + 12; row++, y += 17) {
        let line = '';
        for (let i = row * 3; line.length < 170; i++) line += `${code[i % code.length]} · `;
        d.text(left - ((row * 37) % 120), y, line, 'dg-code', { opacity: 0.95 - 0.55 * (y - 200) / (floor - 200) });
      }
    });
    d.path(pathData(skyline), 'dg-ink', { opacity: 0.8 });
    const summit = skyline.reduce((top, point) => (point[1] < top[1] ? point : top));
    d.add(`<rect class="dg-node-accent" x="${Math.round(summit[0] + 14)}" y="${Math.round(summit[1] - 32)}" width="13" height="24"/>`);
    d.label(summit[0] + 38, summit[1] - 11, 'always bet on text', { accent: true });
    d.line(left, floor, right, floor, 'dg-line');
  },

  // Chatbots are the tip. The capabilities below the waterline are far larger.
  'the-large-language-model-iceberg'(d) {
    const rand = random(31);
    const water = 330;
    for (let y = water + 24; y < H; y += 24) {
      const x0 = 470 + rand() * 260;
      d.line(x0, y, W, y, 'dg-faint', { 'stroke-dasharray': dash(rand) });
    }
    const mass = [[1060, water], [985, 372], [905, 430], [846, 512], [838, 590], [884, 664], [978, 728], [1100, 758],
      [1236, 750], [1352, 708], [1446, 632], [1482, 540], [1452, 452], [1384, 392], [1300, 352], [1250, water]];
    d.path(pathData(mass, true), 'dg-shape-strong', { 'stroke-width': 1.6 });
    const tip = [[1060, water], [1095, 282], [1122, 290], [1150, 226], [1178, 250], [1208, 236], [1250, water]];
    d.path(pathData(tip, true), 'dg-shape-ink', { 'stroke-width': 1.6 });
    d.line(1122, 290, 1160, water, 'dg-line');
    d.line(1178, 250, 1196, water, 'dg-line');
    d.line(440, water, W, water, 'dg-strong', { 'stroke-dasharray': '10 8' });
    d.label(1272, 284, 'CHATBOTS');
    d.label(1160, 424, 'SUMMARISATION', { anchor: 'middle' });
    d.label(1000, 500, 'EXTRACTION', { anchor: 'middle' });
    d.label(1330, 500, 'SEARCH', { anchor: 'middle' });
    d.label(1160, 580, 'CONTEXT-AWARE TRANSLATION', { anchor: 'middle', accent: true });
    d.label(1060, 658, 'CLASSIFICATION', { anchor: 'middle' });
    d.label(1300, 658, 'GENERATION', { anchor: 'middle' });
  },

  // An LLM as separate capabilities, composed into one experience.
  'decomposition-of-llms'(d) {
    const rand = random(41);
    const n = noise(rand, 5);
    const centre = 1170, spread = 230;
    const height = x => 670 - 410 * Math.exp(-((x - centre) ** 2) / (2 * spread ** 2)) + 6 * n(x / 60);
    const layers = [
      { top: 0, bottom: 360, lift: 72, name: 'GENERATION' },
      { top: 360, bottom: 450, lift: 48, name: 'SYNTHESIS' },
      { top: 450, bottom: 540, lift: 24, name: 'EMBEDDING SEARCH' },
      { top: 540, bottom: 630, lift: 0, name: 'INPUT INTERPRETATION' },
    ];
    const skewer = 1290;
    const joints = [];
    for (const layer of layers) {
      const inside = [];
      for (let x = 480; x <= W; x += 4) if (height(x) < layer.bottom) inside.push(x);
      const [x0, x1] = [inside[0], inside.at(-1)];
      const outline = [...trace(x => Math.max(height(x), layer.top), x0, x1, 4), [x1, layer.bottom], [x0, layer.bottom]];
      d.path(pathData(outline.map(([x, y]) => [x, y - layer.lift]), true), 'dg-shape-strong', { 'stroke-width': 1.6 });
      const baseline = layer.bottom - 32;
      const edge = inside.find(x => height(x) < baseline - 20);
      d.label(edge + 24, baseline - layer.lift, layer.name);
      joints.push([skewer, (Math.max(height(skewer), layer.top) + layer.bottom) / 2 - layer.lift]);
    }
    d.line(skewer, Math.max(height(skewer), 0) - layers[0].lift - 18, skewer, layers.at(-1).bottom + 18, 'dg-accent', { 'stroke-width': 2.2 });
    for (const joint of joints) d.marker(...joint, 'dg-node-accent', 14);
  },

  // Three things people mean by AI: measured, practical, and imagined.
  'three-categories-of-ai'(d) {
    const rand = random(53);
    const n = noise(rand, 5);
    const ground = 600;
    const peak = ({ centre, height, width }) => trace(x => ground - height * Math.exp(-((x - centre) ** 2) / (2 * width ** 2)) + 5 * n(x / 40) * Math.exp(-((x - centre) ** 2) / (2 * width ** 2)), centre - 3 * width, centre + 3 * width, 4);
    // Future magic: dotted, dissolving into the sky.
    const magic = { centre: 1440, height: 300, width: 118 };
    const magicLine = peak(magic);
    d.path(pathData(magicLine), 'dg-muted', { 'stroke-dasharray': '2 9', 'stroke-linecap': 'round' });
    for (let i = 0; i < 90; i++) {
      const lift = rand() ** 1.8 * 230;
      const x = magic.centre + gaussian(rand) * (40 + lift * 0.5);
      d.dot(x, ground - magic.height - 10 - lift + 80 * rand(), 1.6, 'dg-dot', { opacity: 1 - lift / 260 });
    }
    d.dot(magic.centre, ground - magic.height - 70, 7, 'dg-node-accent');
    // Advanced analytics: measured in even contours.
    const analytics = { centre: 800, height: 250, width: 150 };
    const analyticsLine = peak(analytics);
    d.path(pathData([...analyticsLine, [analyticsLine.at(-1)[0], ground], [analyticsLine[0][0], ground]], true), 'dg-shape-strong');
    d.clip('analytics', pathData(analyticsLine), () => {
      for (let y = ground - 22; y > ground - analytics.height; y -= 22) d.line(analytics.centre - 460, y, analytics.centre + 460, y, 'dg-line');
    });
    // Applied machine learning: solid, layered ridges.
    const ml = { centre: 1130, height: 330, width: 140 };
    const mlLine = peak(ml);
    d.path(pathData([...mlLine, [mlLine.at(-1)[0], ground], [mlLine[0][0], ground]], true), 'dg-shape-ink', { 'stroke-width': 1.6 });
    for (const scale of [0.72, 0.46, 0.22]) d.path(pathData(peak({ ...ml, height: ml.height * scale, width: ml.width * (0.6 + scale * 0.4) })), 'dg-line');
    d.line(460, ground, W, ground, 'dg-line');
    d.label(analytics.centre, ground + 42, 'ADVANCED ANALYTICS', { anchor: 'middle' });
    d.label(ml.centre, ground + 42, 'APPLIED ML', { anchor: 'middle' });
    d.label(magic.centre, ground + 42, 'FUTURE MAGIC', { anchor: 'middle' });
  },

  // Concrete applications are mapped ground. AI is whatever lies past the edge of the map.
  'its-not-ai'(d) {
    const rand = random(61);
    const n = noise(rand, 4);
    const edge = y => 1270 + 26 * n(y / 90);
    const mapped = pathData([[0, 0], ...trace(edge, 0, H, 10).map(([y, x]) => [x, y]), [0, H]], true);
    d.clip('mapped', mapped, () => {
      const field = blob(rand, { x: 1010, y: 430, r: 600, squash: 0.6 });
      for (let scale = 0.25; scale <= 1.3; scale += 0.105) d.path(pathData(field.ring(scale, [0, 0], 72), true), 'dg-faint');
      contourHill(d, rand, { x: 700, y: 430, r: 108 }, { inner: 'dg-line' });
      contourHill(d, rand, { x: 960, y: 296, r: 92 }, { inner: 'dg-line' });
      contourHill(d, rand, { x: 1090, y: 524, r: 116 }, { inner: 'dg-line' });
    });
    d.path(pathData(trace(edge, 140, 690, 10).map(([y, x]) => [x, y])), 'dg-strong', { 'stroke-dasharray': '10 8' });
    for (let i = 0; i < 150; i++) {
      const reach = rand() ** 1.7;
      d.dot(edge(400) + 24 + reach * 320, 170 + rand() * 460, 1.6, 'dg-dot', { opacity: 0.9 - reach * 0.7 });
    }
    d.label(700, 512, 'COMPUTER VISION', { anchor: 'middle' });
    d.label(960, 392, 'NATURAL LANGUAGE', { anchor: 'middle' });
    d.label(1090, 630, 'SUMMARISATION', { anchor: 'middle' });
    d.label(1440, 424, 'AI', { anchor: 'middle', accent: true, size: 56 });
  },

  // General methods that scale with compute overtake methods built on human knowledge.
  'the-bitter-lesson-conditions'(d) {
    const rand = random(71);
    const n = noise(rand, 4);
    const left = 560, right = 1560, base = 610;
    for (let k = 0; k < 7; k++) {
      d.path(pathData(trace(x => base + 30 - k * 46 - 150 * (x - 440) / (W - 440) + 10 * n(x / 80 + k), 440, W, 8)), 'dg-faint');
    }
    const t = x => (x - left) / (right - left);
    const handCrafted = x => base - 200 * (1 - Math.exp(-t(x) * 6));
    const general = x => base - 380 * t(x) ** 1.3;
    d.path(pathData(trace(handCrafted, left, right, 4)), 'dg-ink', { 'stroke-width': 1.8 });
    d.path(pathData(trace(general, left, right, 4)), 'dg-accent', { 'stroke-width': 2.6 });
    const waypoint = share => [left + share * (right - left), general(left + share * (right - left))];
    for (const share of [0.25, 0.55, 0.85]) d.marker(...waypoint(share), 'dg-node-accent', 14);
    d.label(waypoint(0.25)[0] - 16, waypoint(0.25)[1] - 22, '1 · GENERAL', { anchor: 'end' });
    d.label(waypoint(0.55)[0] + 18, waypoint(0.55)[1] + 44, '2 · SCALABLE');
    d.label(waypoint(0.85)[0] - 16, waypoint(0.85)[1] - 20, '3 · SCALES WITH COMPUTE', { anchor: 'end' });
    d.label(right - 24, handCrafted(right) + 36, 'HAND-CRAFTED', { anchor: 'end' });
    d.line(left, base + 22, right, base + 22, 'dg-line');
    d.label(right - 24, base + 60, 'COMPUTE →', { anchor: 'end' });
  },

  // Each craft is a hand-built terrace. Frontier models rise like a tide: prompts and harnesses
  // are under, and the water is climbing the factory, whose upper floors are an org chart.
  'the-bitter-lesson-comes-for-the-factory'(d) {
    const rand = random(163);
    const ground = 600, water = 400, left = 460;
    const terrace = ({ centre, half, steps, rise, inset }) => {
      const side = [];
      for (let i = 0; i < steps; i++) {
        const x = centre - half + i * inset;
        side.push([x, ground - i * rise], [x, ground - (i + 1) * rise]);
      }
      return [...side, ...side.slice().reverse().map(([x, y]) => [2 * centre - x, y])];
    };
    const crafts = [
      { centre: 740, half: 96, steps: 2, rise: 42, inset: 30, name: 'PROMPTS' },
      { centre: 1000, half: 132, steps: 4, rise: 42, inset: 24, name: 'HARNESSES' },
      { centre: 1320, half: 176, steps: 6, rise: 56, inset: 20, name: 'FACTORIES' },
    ];
    const outlines = crafts.map(craft => pathData(terrace(craft), true));
    // Above the water, the terraces stand out. Below it, they fade under the striations.
    d.clip('above', `M0 0H${W}V${water}H0Z`, () => outlines.forEach(o => d.path(o, 'dg-shape-strong', { 'stroke-width': 1.6 })));
    d.clip('below', `M0 ${water}H${W}V${H}H0Z`, () => {
      outlines.forEach(o => d.path(o, 'dg-shape-line'));
      striations(d, rand, { top: water + 15, bottom: ground, step: 15, from: left + 20, spread: 300, length: [240, 700] });
    });
    // The factory's upper floors: a planner over an implementer, a reviewer, and a tester.
    const factory = crafts[2];
    const planner = [factory.centre, ground - 5.4 * factory.rise];
    const roles = [-56, 0, 56].map(dx => [factory.centre + dx, ground - 4.4 * factory.rise]);
    for (const role of roles) d.line(...planner, ...role, 'dg-line');
    for (const role of roles) d.marker(...role, 'dg-node', 12);
    d.marker(...planner, 'dg-node', 12);
    d.line(left, water, W, water, 'dg-accent', { 'stroke-width': 2.6 });
    d.line(1548, water + 70, 1548, water - 70, 'dg-accent', { 'stroke-width': 2 });
    d.path(pathData([[1536, water - 56], [1548, water - 70], [1560, water - 56]]), 'dg-accent', { 'stroke-width': 2 });
    d.label(1110, water - 22, 'FRONTIER MODELS', { anchor: 'end', accent: true });
    d.line(left, ground, W, ground, 'dg-line');
    for (const craft of crafts) d.label(craft.centre, ground + 42, craft.name, { anchor: 'middle' });
  },

  // A short route through every stop: the problem deep learning may start to solve.
  'business-implications-of-combinatorial-optimisation'(d) {
    const rand = random(83);
    contourHill(d, rand, { x: 860, y: 430, r: 300, squash: 0.55 }, { rings: [1, 0.8, 0.6, 0.4, 0.2], outer: 'dg-faint', inner: 'dg-faint' });
    contourHill(d, rand, { x: 1380, y: 380, r: 240, squash: 0.55 }, { rings: [1, 0.78, 0.56, 0.34, 0.14], outer: 'dg-faint', inner: 'dg-faint' });
    const stops = scatter(rand, 17, [640, 236, 1540, 600], 74);
    const seen = new Set();
    for (const stop of stops) {
      for (const other of nearest(stops, stop, 3)) {
        const key = [stops.indexOf(stop), stops.indexOf(other)].sort().join();
        if (seen.has(key)) continue;
        seen.add(key);
        d.line(...stop, ...other, 'dg-line', { 'stroke-dasharray': '2 6' });
      }
    }
    const depot = stops.reduce((best, stop) => (distance(stop, [680, 580]) < distance(best, [680, 580]) ? stop : best));
    d.path(pathData(tour(stops, depot), true), 'dg-accent', { 'stroke-width': 2.4 });
    for (const stop of stops) d.marker(...stop, stop === depot ? 'dg-node-accent' : 'dg-node', stop === depot ? 16 : 12);
    d.label(depot[0], depot[1] + 44, 'DEPOT', { anchor: 'middle' });
    d.label(1536, 200, 'VEHICLE ROUTING', { anchor: 'end' });
  },

  // Identity as a survey: a key fixed by sight lines to independent profiles.
  'keybase-keys-for-everyone-part-i'(d) {
    const rand = random(97);
    const key = [1100, 420];
    const stations = [
      { at: [720, 310], name: 'TWITTER' }, { at: [1330, 250], name: 'WEBSITE' }, { at: [1480, 520], name: 'REDDIT' },
      { at: [1110, 610], name: 'HACKER NEWS' }, { at: [830, 560], name: 'GITHUB' },
    ];
    contourHill(d, rand, { x: key[0], y: key[1] + 14, r: 130 }, { rings: [1, 0.76, 0.54, 0.32, 0.12], inner: 'dg-faint' });
    for (const { at } of stations) contourHill(d, rand, { x: at[0], y: at[1] + 12, r: 72 }, { rings: [1, 0.68, 0.38], inner: 'dg-faint' });
    stations.forEach(({ at }, i) => d.line(...at, ...stations[(i + 1) % stations.length].at, 'dg-line', { 'stroke-dasharray': '2 7' }));
    for (const { at } of stations) d.line(...key, ...at, 'dg-muted', { 'stroke-dasharray': '7 7' });
    for (const { at, name } of stations) {
      d.path(pathData([[at[0], at[1] - 10], [at[0] + 10, at[1] + 7], [at[0] - 10, at[1] + 7]], true), 'dg-node');
      d.label(at[0], at[1] - 26, name, { anchor: 'middle' });
    }
    d.marker(...key, 'dg-node-accent', 18);
    d.label(key[0] + 24, key[1] + 54, 'KEY', { accent: true });
  },

  // A Merkle tree as streams running together into one root, written into the chain.
  'keybase-keys-for-everyone-part-ii'(d) {
    const rand = random(101);
    const n = noise(rand, 4);
    for (let k = 0; k < 6; k++) d.path(pathData(trace(x => 190 + k * 86 + 18 * n(x / 120 + k * 2), 460, W, 10)), 'dg-faint');
    const leaves = Array.from({ length: 8 }, (_, i) => [740 + i * 110 + (rand() - 0.5) * 30, 220 + (rand() - 0.5) * 24]);
    const levels = [leaves];
    const heights = [330, 430, 520];
    for (const y of heights) {
      const children = levels.at(-1);
      levels.push(Array.from({ length: children.length / 2 }, (_, i) => [(children[2 * i][0] + children[2 * i + 1][0]) / 2, y]));
    }
    const stream = ([x0, y0], [x1, y1]) => `M${x0.toFixed(1)} ${y0.toFixed(1)}C${x0.toFixed(1)} ${(y0 + 48).toFixed(1)} ${x1.toFixed(1)} ${(y1 - 48).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    levels.slice(1).forEach((parents, level) => {
      parents.forEach((parent, i) => {
        for (const child of [levels[level][2 * i], levels[level][2 * i + 1]]) d.path(stream(child, parent), 'dg-muted', { 'stroke-width': 1.2 + level * 0.6 });
      });
    });
    const root = levels.at(-1)[0];
    const chain = 630;
    // The block holding the root sits directly below it, ninth in the chain.
    const blocks = Array.from({ length: 16 }, (_, k) => root[0] + (k - 9) * 72).filter(x => x < W + 40);
    d.line(blocks[0], chain, W, chain, 'dg-line');
    blocks.forEach((x, k) => d.add(`<rect class="${k === 9 ? 'dg-node-accent' : 'dg-node'}" x="${(x - 13).toFixed(1)}" y="${chain - 13}" width="26" height="26"/>`));
    d.path(stream(root, [root[0], chain - 13]), 'dg-accent', { 'stroke-width': 2.4 });
    for (const level of levels.slice(0, -1)) for (const node of level) d.marker(...node, 'dg-node', level === leaves ? 12 : 10);
    d.marker(...root, 'dg-node-accent', 16);
    d.label(root[0] + 26, root[1] + 9, 'MERKLE ROOT', { accent: true });
    d.label(1536, chain - 34, 'BLOCKCHAIN', { anchor: 'end' });
  },

  // The blog opens again: a sunrise over the ranges.
  'a-new-hope'(d) {
    const rand = random(113);
    const sun = [1180, 500];
    const arc = r => `M${sun[0] - r} ${sun[1]}A${r} ${r} 0 0 1 ${sun[0] + r} ${sun[1]}`;
    for (const r of [400, 315, 240, 175]) d.path(arc(r), 'dg-faint');
    d.path(arc(120), 'dg-line');
    d.path(arc(70), 'dg-accent', { 'stroke-width': 2.6 });
    d.line(460, sun[1], W, sun[1], 'dg-line');
    for (const [k, base, amp] of [[0, 520, 46], [1, 566, 54], [2, 620, 60]]) {
      const n = noise(rand, 4);
      ridge(d, trace(x => base - amp * (0.5 + 0.5 * n(x / 140 + k)) * Math.min(1, (x - 460) / 260), 460, W, 8), k ? 'dg-strong' : 'dg-line');
    }
    d.label(1536, 230, 'OPEN FOR BUSINESS', { anchor: 'end' });
  },

  // Relational learning: a graph of points, and one point gathering from its neighbours.
  'odds-and-ends-1'(d) {
    const rand = random(127);
    const nodes = scatter(rand, 26, [600, 200, 1560, 470], 64);
    const seen = new Set();
    for (const node of nodes) {
      for (const other of nearest(nodes, node, 2)) {
        const key = [nodes.indexOf(node), nodes.indexOf(other)].sort().join();
        if (!seen.has(key)) { seen.add(key); d.line(...node, ...other, 'dg-line'); }
      }
    }
    const focus = nodes.reduce((best, node) => (distance(node, [1150, 330]) < distance(best, [1150, 330]) ? node : best));
    const neighbours = nearest(nodes, focus, 4);
    for (const other of neighbours) d.line(...focus, ...other, 'dg-accent', { 'stroke-width': 2 });
    for (const node of nodes) d.dot(...node, 5, neighbours.includes(node) ? 'dg-shape-accent' : 'dg-node');
    d.dot(...focus, 8, 'dg-node-accent');
    for (const [k, base, amp] of [[0, 560, 40], [1, 610, 46]]) {
      const n = noise(rand, 4);
      ridge(d, trace(x => base - amp * (0.5 + 0.5 * n(x / 130 + k)) * Math.min(1, (x - 460) / 240), 460, W, 8), k ? 'dg-strong' : 'dg-line');
    }
    d.label(1536, 174, 'RELATIONAL LEARNING', { anchor: 'end' });
  },

  // The information bottleneck: flow squeezed through a narrow pass, then released.
  'odds-and-ends-2'(d) {
    const centre = 415;
    const squeeze = x => 1 - 0.8 * Math.exp(-(((x - 1060) / 210) ** 2));
    const flow = y0 => trace(x => centre + (y0 - centre) * squeeze(x), 460, W, 6);
    for (let i = 0; i < 13; i++) {
      const y0 = 236 + i * (358 / 12);
      d.path(pathData(flow(y0)), i === 6 ? 'dg-accent' : 'dg-line', i === 6 ? { 'stroke-width': 2.4 } : {});
    }
    // Each cliff keeps 18 units clear of the outermost flow line on its side.
    const cliff = sign => {
      const outermost = sign < 0 ? 200 : 630;
      const edge = trace(x => centre + (outermost - centre) * squeeze(x) + sign * 18, 820, 1300, 8);
      const far = sign < 0 ? [[1300, 150], [1180, 128], [1040, 136], [920, 150], [820, 176]] : [[1300, 680], [1180, 704], [1040, 696], [920, 684], [820, 656]];
      return [...edge, ...far];
    };
    for (const sign of [-1, 1]) {
      const outline = cliff(sign);
      const middle = [1060, sign < 0 ? 250 : 580];
      d.path(pathData(outline, true), 'dg-shape-strong', { 'stroke-width': 1.6 });
      for (const scale of [0.74, 0.5, 0.28]) {
        d.path(pathData(outline.map(([x, y]) => [middle[0] + (x - middle[0]) * scale, middle[1] + (y - middle[1]) * scale]), true), 'dg-faint');
      }
    }
    d.label(1536, 200, 'INFORMATION BOTTLENECK', { anchor: 'end' });
  },

  // Columnar storage as basalt columns.
  'odds-and-ends-3'(d) {
    const rand = random(139);
    const n = noise(rand, 3);
    const r = 40, squash = 0.5, rise = r * Math.sin(Math.PI / 3) * squash;
    const cells = [];
    for (let col = 0; col < 24; col++) {
      for (let row = 0; row < 12; row++) {
        const x = 700 + col * 1.5 * r;
        const y = 290 + row * 2 * rise + (col % 2) * rise;
        if (((x - 1150) / 400) ** 2 + ((y - 420) / 130) ** 2 > 1) continue;
        // Columns step down towards the front, unevenly, so their sides show.
        const height = 24 + 70 * (1 - (y - 290) / 260) + 14 * n(x / 90) + rand() * 50;
        cells.push({ x, y, height });
      }
    }
    cells.sort((a, b) => a.y - b.y || a.x - b.x);
    const copper = cells.reduce((best, cell) => (distance([cell.x, cell.y], [1260, 460]) < distance([best.x, best.y], [1260, 460]) ? cell : best));
    copper.height += 34;
    for (const { x, y, height } of cells) {
      const top = Array.from({ length: 6 }, (_, i) => [x + r * Math.cos((i * Math.PI) / 3), y - height + r * Math.sin((i * Math.PI) / 3) * squash]);
      const lower = top.slice(0, 4);
      d.path(pathData([...lower, ...lower.slice().reverse().map(([px, py]) => [px, py + height])], true), 'dg-shape-line');
      for (const [px, py] of lower.slice(1, 3)) d.line(px, py, px, py + height, 'dg-line');
      d.path(pathData(top, true), x === copper.x && y === copper.y ? 'dg-shape-accent' : 'dg-shape-strong', x === copper.x && y === copper.y ? { 'stroke-width': 2.4 } : {});
    }
    d.label(1536, 196, 'COLUMNAR STORAGE', { anchor: 'end' });
  },

  // Vector search: a query and its nearest neighbours among clusters of embeddings.
  'odds-and-ends-4'(d) {
    const rand = random(151);
    const clusters = [{ x: 820, y: 430, s: 66, count: 30 }, { x: 1190, y: 380, s: 80, count: 42 }, { x: 1450, y: 490, s: 58, count: 26 }];
    for (const cluster of clusters) {
      const shape = blob(rand, { x: cluster.x, y: cluster.y, r: cluster.s, squash: 0.72 });
      [2.3, 1.65, 1.05].forEach((scale, i) => d.path(pathData(shape.ring(scale), true), i === 2 ? 'dg-line' : 'dg-faint'));
    }
    const points = clusters.flatMap(c => Array.from({ length: c.count }, () => [c.x + gaussian(rand) * c.s * 0.9, c.y + gaussian(rand) * c.s * 0.62]));
    for (let i = 0; i < 24; i++) points.push([620 + rand() * 940, 200 + rand() * 420]);
    const query = [1232, 404];
    const near = nearest(points, query, 6);
    const reach = distance(query, near.at(-1)) + 14;
    d.dot(...query, reach, 'dg-accent', { 'stroke-dasharray': '4 7' });
    for (const point of near) d.line(...query, ...point, 'dg-accent', { 'stroke-width': 1.2 });
    for (const point of points) d.dot(...point, near.includes(point) ? 4.5 : 3, near.includes(point) ? 'dg-dot-ink' : 'dg-dot');
    d.dot(...query, 7, 'dg-node-accent');
    d.label(query[0] - reach - 12, query[1] - reach + 16, 'QUERY', { anchor: 'end', accent: true });
    d.label(1536, 200, 'NEAREST NEIGHBOURS', { anchor: 'end' });
  },
};
