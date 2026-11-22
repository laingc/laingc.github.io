/* chrislaing.net motion layer. assets/css/custom.css holds the matching styles.
   Each effect enhances a page that is already complete. The script hides no content
   that is visible when it starts. When the reader prefers reduced motion, the script
   draws one still frame of the ROC plot and does nothing else. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const pageIsNew = () => performance.now() < 900;
  const byDocumentOrder = (a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
  const clamp = (value, low = 0, high = 1) => Math.min(Math.max(value, low), high);

  /* Decoder text. A monospace label starts as random glyphs and resolves from the start
     of the line. Screen readers get the real text from a visually hidden copy. */
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#*+';
  const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

  function createDecoder(element) {
    const text = element.textContent;
    if (!text.trim() || element.childElementCount) return null;
    const chars = Array.from(text);
    const label = document.createElement('span');
    label.className = 'sr-only';
    label.textContent = text;
    const display = document.createElement('span');
    display.setAttribute('aria-hidden', 'true');
    const glyphs = chars.map(randomGlyph);
    let frame = 0;

    function paint(resolved) {
      const nodes = [];
      let run = '';
      let runIsGlyph = false;
      const flush = () => {
        if (!run) return;
        if (runIsGlyph) {
          const span = document.createElement('span');
          span.className = 'fx-glyph';
          span.textContent = run;
          nodes.push(span);
        } else {
          nodes.push(document.createTextNode(run));
        }
        run = '';
      };
      chars.forEach((char, index) => {
        const glyph = !resolved[index] && !/\s/.test(char);
        if (glyph !== runIsGlyph) { flush(); runIsGlyph = glyph; }
        run += glyph ? glyphs[index] : char;
      });
      flush();
      display.replaceChildren(...nodes);
    }

    function finish() {
      cancelAnimationFrame(frame);
      element.textContent = text;
    }

    element.replaceChildren(label, display);
    paint(chars.map(() => false));

    return {
      finish,
      run(delay = 0) {
        const duration = Math.min(Math.max(500 + chars.length * 18, 700), 1400);
        const resolveAt = chars.map((_, index) => delay + (index / chars.length) * duration * 0.75 + Math.random() * duration * 0.25);
        const end = Math.max(...resolveAt);
        let start = 0;
        let lastSwap = 0;
        const step = now => {
          if (!start) start = now;
          const elapsed = now - start;
          if (elapsed >= end || reducedMotion.matches) { finish(); return; }
          if (now - lastSwap > 55) {
            lastSwap = now;
            glyphs.forEach((_, index) => { glyphs[index] = randomGlyph(); });
            paint(resolveAt.map(time => elapsed >= time));
          }
          frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
      },
    };
  }

  /* Scroll reveals. Only content below the fold receives a hidden starting state, so
     nothing that the reader can already see disappears. */
  const REVEALS = [
    ['.home-content, .home-section .editorial-grid > *, .section-heading, .term-list > li, .closing-copy', 'fx-reveal'],
    ['.post-list > .post-card, .archive-year', 'fx-reveal fx-rule'],
    ['.home-section, .writing-section', 'fx-rule'],
    ['.home-section figure img', 'fx-wipe'],
  ];
  const DECODERS = 'main .accent-label, main .hero-location, main .page-heading .breadcrumb, main .post-card-meta time';

  // Runs a callback once for each element, when the element first scrolls into view.
  // Elements that arrive together share a short stagger.
  function createWatcher() {
    const pending = new Map();
    const observer = new IntersectionObserver(entries => {
      entries
        .filter(entry => entry.isIntersecting)
        .map(entry => entry.target)
        .sort(byDocumentOrder)
        .forEach((element, index) => {
          element.style.setProperty('--fx-delay', `${Math.min(index, 5) * 90}ms`);
          pending.get(element)?.forEach(run => run());
          pending.delete(element);
          observer.unobserve(element);
        });
    }, { rootMargin: '0px 0px -10% 0px' });
    reducedMotion.addEventListener('change', () => {
      if (!reducedMotion.matches) return;
      pending.forEach(runs => runs.forEach(run => run()));
      pending.clear();
      observer.disconnect();
    });
    // An element can carry several callbacks, such as a reveal and a decoder.
    return (element, run) => { pending.set(element, [...(pending.get(element) ?? []), run]); observer.observe(element); };
  }

  function revealLater(watch, element, classes) {
    element.classList.add(...classes.split(' '));
    watch(element, () => element.classList.add('is-visible'));
  }

  function decode(element, watch) {
    const decoder = createDecoder(element);
    if (!decoder) return;
    if (watch) watch(element, () => decoder.run());
    else decoder.run(element.closest('.hero, .page-heading') ? 250 : 0);
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) decoder.finish(); }, { once: true });
  }

  function setupScroll(watch) {
    const fold = innerHeight * 0.9;
    const belowFold = element => element.getBoundingClientRect().top > fold;
    for (const [selector, classes] of REVEALS) {
      for (const element of document.querySelectorAll(selector)) {
        if (belowFold(element)) revealLater(watch, element, classes);
      }
    }
    for (const element of document.querySelectorAll(DECODERS)) {
      if (belowFold(element)) decode(element, watch);
      else if (pageIsNew()) decode(element, null);
    }
  }

  /* Article lists. The page carries every card in an inert template (extend-footer.html).
     As the reader nears the end of the list, the next cards join it, so the list continues
     until every article is shown. The back button returns to the same depth. A cadence strip
     above the list marks each article on a time axis, and a Copper square follows the
     article that the reader is on. */
  function setupWriting(watch) {
    const template = document.getElementById('fx-writing');
    const list = document.querySelector('.list-content > .post-list');
    if (!template || !list || !('IntersectionObserver' in window)) return;
    const hrefOf = card => card?.querySelector('h3 a')?.getAttribute('href');
    const all = [...template.content.querySelectorAll('.post-card')];
    const shownAtLoad = [...list.querySelectorAll(':scope > .post-card')];
    let next = all.findIndex(card => hrefOf(card) === hrefOf(shownAtLoad.at(-1))) + 1;
    if (next <= 0) return;
    const firstShown = next - shownAtLoad.length;

    const status = document.createElement('p');
    status.className = 'sr-only';
    status.setAttribute('role', 'status');
    const sentinel = document.createElement('div');
    sentinel.className = 'fx-writing-sentinel';
    list.after(sentinel, status);

    // Previous pages stay reachable. The next-page link and page count are no longer needed.
    const pagination = list.parentElement.querySelector('.pagination');
    if (pagination) {
      if (pagination.querySelector('[rel="prev"]')) {
        pagination.querySelector('[rel="next"]')?.remove();
        pagination.querySelector(':scope > span:not(:empty)')?.remove();
      } else {
        pagination.hidden = true;
      }
    }

    const cards = () => [...list.querySelectorAll(':scope > .post-card')];
    let announce = 0;

    function append(count, animate) {
      const added = [];
      for (; count > 0 && next < all.length; count--, next++) added.push(document.importNode(all[next], true));
      if (!added.length) return;
      list.append(...added);
      for (const card of added) {
        if (animate && watch) {
          revealLater(watch, card, 'fx-reveal fx-rule');
          const date = card.querySelector('.post-card-meta time');
          if (date) decode(date, watch);
        }
      }
      try { history.replaceState({ ...(history.state || {}), fxShown: next }, ''); } catch {}
      clearTimeout(announce);
      announce = setTimeout(() => { status.textContent = `Showing ${next - firstShown} of ${all.length - firstShown} articles.`; }, 400);
      if (next >= all.length) finish();
      cadence?.refresh();
    }

    function finish() {
      observer.disconnect();
      sentinel.remove();
      const dates = all.map(card => card.querySelector('time')?.getAttribute('datetime')?.slice(0, 4)).filter(Boolean).sort();
      const end = document.createElement('p');
      end.className = 'fx-writing-end';
      end.textContent = dates.length ? `${all.length} articles, ${dates[0]} to ${dates.at(-1)}` : `${all.length} articles`;
      list.after(end);
      if (watch) { revealLater(watch, end, 'fx-reveal'); decode(end, watch); }
    }

    // Load more while the end of the list is within about a screen of the viewport.
    function fill() {
      let guard = 0;
      while (next < all.length && sentinel.isConnected && sentinel.getBoundingClientRect().top < innerHeight * 2 && guard++ < 6) append(3, true);
    }
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) fill(); }, { rootMargin: '0px 0px 100% 0px' });

    const restore = history.state?.fxShown;
    const cadence = setupCadence(all, list, cards, index => {
      if (index < firstShown) { location.href = hrefOf(all[index]); return null; }
      if (index >= next) append(index - next + 1, false);
      return cards().find(card => hrefOf(card) === hrefOf(all[index]));
    });
    if (restore > next) append(restore - next, false);
    observer.observe(sentinel);
  }

  function setupCadence(all, list, cards, find) {
    const items = all.map(card => {
      const time = card.querySelector('time');
      return { href: card.querySelector('h3 a')?.getAttribute('href'), title: card.querySelector('h3 a')?.textContent.trim() ?? '', label: time?.textContent.trim() ?? '', date: Date.parse(time?.getAttribute('datetime') ?? '') };
    });
    if (items.length < 2 || items.some(item => Number.isNaN(item.date))) return null;
    const years = items.map(item => new Date(item.date).getUTCFullYear());
    const first = Math.min(...years);
    const last = Math.max(...years) + 1;
    const start = Date.UTC(first, 0, 1);
    const span = Date.UTC(last, 0, 1) - start;
    const position = date => (date - start) / span;

    const strip = document.createElement('div');
    strip.className = 'fx-cadence';
    strip.setAttribute('aria-hidden', 'true');
    const readout = document.createElement('p');
    readout.className = 'fx-cadence-readout';
    const title = document.createElement('span');
    title.className = 'fx-cadence-title';
    const when = document.createElement('span');
    when.className = 'fx-cadence-date';
    readout.append(title, when);
    const track = document.createElement('div');
    track.className = 'fx-cadence-track';
    for (let year = first; year <= last; year++) {
      const mark = document.createElement('span');
      mark.className = 'fx-cadence-year';
      mark.style.setProperty('--x', position(Date.UTC(year, 0, 1)));
      if (year < last) mark.textContent = year;
      track.append(mark);
    }
    const ticks = items.map((item, index) => {
      const tick = document.createElement('span');
      tick.className = 'fx-cadence-tick';
      tick.style.setProperty('--x', position(item.date));
      tick.style.setProperty('--i', items.length - 1 - index);
      tick.addEventListener('pointerenter', () => show(index, true));
      tick.addEventListener('pointerleave', () => show(current, false));
      tick.addEventListener('click', () => {
        const card = find(index);
        if (card) card.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
      });
      track.append(tick);
      return tick;
    });
    const marker = document.createElement('span');
    marker.className = 'fx-cadence-marker';
    track.append(marker);
    strip.append(readout, track);
    list.before(strip);

    // A one-pixel probe above the strip shows when the strip has stuck to the top.
    const probe = document.createElement('div');
    probe.className = 'fx-cadence-probe';
    strip.before(probe);
    new IntersectionObserver(([entry]) => strip.classList.toggle('is-stuck', !entry.isIntersecting)).observe(probe);

    let current = 0;
    let hovering = -1;
    let shownX = position(items[0].date);
    let targetX = shownX;
    let frame = 0;
    marker.style.setProperty('--x', shownX);

    function show(index, hover) {
      hovering = hover ? index : -1;
      ticks.forEach((tick, i) => tick.classList.toggle('is-active', i === index));
      title.textContent = items[index].title;
      when.textContent = items[index].label;
    }

    function glide() {
      frame = 0;
      shownX += (targetX - shownX) * (reducedMotion.matches ? 1 : 0.14);
      if (Math.abs(targetX - shownX) < 0.0005) shownX = targetX;
      marker.style.setProperty('--x', shownX);
      if (shownX !== targetX) frame = requestAnimationFrame(glide);
    }

    // The current article is the first card, or the last card whose top has passed the
    // reading line, a little below the strip.
    const hrefs = items.map(item => item.href);
    function refresh() {
      const line = strip.getBoundingClientRect().bottom + innerHeight * 0.2;
      let index = -1;
      for (const card of cards()) {
        if (index >= 0 && card.getBoundingClientRect().top > line) break;
        index = hrefs.indexOf(card.querySelector('h3 a')?.getAttribute('href'));
      }
      if (index < 0) return;
      current = index;
      targetX = position(items[index].date);
      if (hovering < 0) show(index, false);
      if (!frame) frame = requestAnimationFrame(glide);
    }

    let pending = false;
    window.addEventListener('scroll', () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; refresh(); });
    }, { passive: true });
    window.addEventListener('resize', refresh, { passive: true });
    refresh();
    return { refresh };
  }

  /* ROC plot. The Integrated cadence logo is an ROC curve with a Copper operating point.
     Behind the homepage masthead, the same curve is drawn as a faint plot of complexity
     against accuracy. The operating point starts where it is in the logo, drifts slowly,
     and follows a fine pointer along the curve. The plot pauses off screen and in
     background tabs. */

  // The logo's curve, M0,100 C21,19 59,9 112,6, scaled so both rates run from 0 to 1.
  const P1 = [21 / 112, 81 / 94];
  const P2 = [59 / 112, 91 / 94];
  const LOGO_FPR = 0.334;
  // Axis labels: accuracy runs across, complexity runs up.
  const AXES = { across: 'ACCURACY', up: 'COMPLEXITY' };
  // Variant under review: end the plot just past the name, with the introduction on the grid.
  const PLOT_ENDS_AT_NAME = true;
  // Variant under review: how much of the grid's strength fades where it passes behind the
  // name, from 0 (none) to 1 (gone).
  const NAME_GRID_FADE = 0.5;
  const bezier = (t, a, b) => 3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t;
  const curveAt = t => [bezier(t, P1[0], P2[0]), bezier(t, P1[1], P2[1])];
  function curveAtRate(fpr) {
    let low = 0;
    let high = 1;
    for (let i = 0; i < 24; i++) {
      const middle = (low + high) / 2;
      if (curveAt(middle)[0] < fpr) low = middle; else high = middle;
    }
    return curveAt((low + high) / 2);
  }
  const CURVE = Array.from({ length: 121 }, (_, i) => curveAt(i / 120));

  // Line strengths on the masthead's dark band.
  const STRENGTH = { minor: 0.08, major: 0.15, axis: 0.5, curve: 0.68, fill: 0.055, guide: 0.4, text: 0.85 };

  function rgba(hex, alpha) {
    const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
    if (!match) return `rgba(196, 82, 30, ${alpha})`;
    const n = parseInt(match[1], 16);
    return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }
  const crisp = value => Math.round(value) + 0.5;
  const easeInOut = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  function setupPlot() {
    const hero = document.querySelector('main .hero');
    if (!hero) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'fx-roc';
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    hero.prepend(canvas);

    let width = 0;
    let height = 0;
    let plot = null;
    let colours = null;
    let frame = 0;
    let onScreen = true;
    let fpr = LOGO_FPR;
    let obstacles = [];
    let placement = 0;
    const pointer = { x: 0, active: false };
    const start = performance.now();

    // Boxes around each line of masthead text, in canvas coordinates. The readout avoids them.
    function measureText() {
      const top = hero.getBoundingClientRect().top;
      const range = document.createRange();
      obstacles = [];
      for (const element of hero.querySelectorAll('.eyebrow, h1, .hero-lead, .hero-description, .hero-actions, figure')) {
        range.selectNodeContents(element);
        for (const box of range.getClientRects()) {
          if (box.width && box.height) obstacles.push({ x0: box.left - 8, x1: box.right + 8, y0: box.top - top - 6, y1: box.bottom - top + 6 });
        }
      }
    }

    function readColours() {
      const style = getComputedStyle(hero);
      colours = { copper: style.getPropertyValue('--accent'), muted: style.getPropertyValue('--muted'), strength: STRENGTH };
    }

    // The canvas spans the window, so its coordinates match the pointer's clientX.
    function measure() {
      const rect = hero.getBoundingClientRect();
      const style = getComputedStyle(hero);
      const scale = Math.min(devicePixelRatio || 1, 2);
      width = root.clientWidth;
      height = Math.ceil(rect.height);
      canvas.style.left = `${-rect.left}px`;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      // The grid sits just outside the text column and inside the masthead padding. It has
      // ten columns. Its rows divide the plot's height into ten and carry on down the masthead.
      const gap = Math.min(40, rect.left * 0.4);
      const x0 = Math.max(12, rect.left - gap);
      const gridRight = Math.min(width - 12, rect.right + gap);
      const gridBottom = height - clamp(parseFloat(style.paddingBottom) / 2, 24, 48);
      plot = {
        x0,
        x1: gridRight,
        y0: gridBottom,
        y1: clamp(parseFloat(style.paddingTop) * 0.35, 20, 40),
        gridRight,
        gridBottom,
        cell: (gridRight - x0) / 10,
        lift: 0,
      };
      plot.labels = plot.x0 >= 36;
      // The plot ends just past the name. When the introduction sits beside the name, the plot
      // ends at the first grid column after it. When the introduction sits below, the plot ends
      // just under the name. Either way the introduction sits on the open grid beyond the plot.
      const name = hero.querySelector('h1');
      const intro = hero.querySelector('.hero-introduction');
      const range = document.createRange();
      if (name) range.selectNodeContents(name);
      const lines = name ? [...range.getClientRects()].filter(box => box.width) : [];
      if (PLOT_ENDS_AT_NAME && lines.length && intro) {
        const introBox = intro.getBoundingClientRect();
        const right = Math.max(...lines.map(box => box.right));
        const bottom = Math.max(...lines.map(box => box.bottom));
        if (introBox.left > right) {
          plot.x1 = x0 + plot.cell * clamp(Math.ceil((right + 8 - x0) / plot.cell), 3, 10);
        } else if (introBox.top >= bottom - 1) {
          plot.y0 = Math.min(gridBottom, bottom - rect.top + 16);
        }
        // The stylesheet places the name under the curve. If a screen's proportions still leave
        // a line above it, the curve starts that little way up its axis. The curve rises from
        // left to right, so each line's left end is where it sits lowest.
        let lift = 0;
        for (const box of lines) {
          const rise = curveAtRate(clamp((box.left - x0) / (plot.x1 - x0), 0.001, 1))[1];
          const needed = (plot.y0 - (box.top - rect.top)) / (plot.y0 - plot.y1) + 0.03;
          lift = Math.max(lift, (needed - rise) / (1 - rise));
        }
        plot.lift = clamp(lift, 0, 0.85);
      }
      plot.row = (plot.y0 - plot.y1) / 10;
      plot.nameBoxes = lines.map(box => ({ x: box.left, y: box.top - rect.top, w: box.width, h: box.height }));
      measureText();
      draw(performance.now());
    }

    // Grid rows: ten above the plot's horizontal axis, then on down the masthead.
    function gridRows() {
      const rows = [];
      for (let j = 0; j < 10; j++) rows.push(plot.y1 + j * plot.row);
      for (let y = plot.y0 + plot.row; y <= plot.gridBottom + 0.5; y += plot.row) rows.push(y);
      return rows;
    }

    const X = rate => plot.x0 + (plot.x1 - plot.x0) * rate;
    const Y = rate => plot.y0 - (plot.y0 - plot.y1) * rate;

    function line(x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }

    // On wide windows the grid carries on past its edges and fades out towards the window.
    function drawMargins(a) {
      const { cell } = plot;
      for (const side of [-1, 1]) {
        const edge = side < 0 ? plot.x0 : plot.gridRight;
        const room = side < 0 ? plot.x0 : width - plot.gridRight;
        const reach = Math.min(room, Math.max(240, cell * 3));
        if (room < 48) continue;
        const fade = ctx.createLinearGradient(edge, 0, edge + side * reach, 0);
        fade.addColorStop(0, rgba(colours.copper, a.minor));
        fade.addColorStop(1, rgba(colours.copper, 0));
        ctx.strokeStyle = fade;
        for (const y of gridRows()) line(edge, crisp(y), edge + side * reach, crisp(y));
        for (let x = edge + side * cell; Math.abs(x - edge) < reach; x += side * cell) line(crisp(x), plot.gridBottom, crisp(x), plot.y1);
      }
    }

    function drawFrame(a) {
      ctx.lineWidth = 1;
      drawMargins(a);
      // The backing grid. A full plot marks its middle column. A narrower plot marks its end.
      const partial = plot.x1 < plot.gridRight - 0.5;
      for (let k = 1; k <= 10; k++) {
        const x = plot.x0 + k * plot.cell;
        ctx.strokeStyle = rgba(colours.copper, (partial ? Math.abs(x - plot.x1) < 0.5 : k === 5) ? a.major : a.minor);
        line(crisp(x), plot.gridBottom, crisp(x), plot.y1);
      }
      for (const [j, y] of gridRows().entries()) {
        ctx.strokeStyle = rgba(colours.copper, j === 5 ? a.major : a.minor);
        line(plot.x0, crisp(y), plot.gridRight, crisp(y));
      }
      // A shorter plot leaves the grid's left edge open below its axis.
      if (plot.y0 < plot.gridBottom - 0.5) {
        ctx.strokeStyle = rgba(colours.copper, a.minor);
        line(crisp(plot.x0), plot.y0 + 8, crisp(plot.x0), plot.gridBottom);
      }
      if (partial) {
        ctx.strokeStyle = rgba(colours.copper, a.minor);
        line(plot.x1 + 8, crisp(plot.y0), plot.gridRight, crisp(plot.y0));
      }
      ctx.strokeStyle = rgba(colours.copper, a.guide * 0.6);
      ctx.setLineDash([3, 6]);
      line(plot.x0, plot.y0, plot.x1, plot.y1);
      ctx.setLineDash([]);
      // Axes with open arrowheads: complexity rises up the page, accuracy runs to the right.
      ctx.strokeStyle = rgba(colours.copper, a.axis);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(plot.x0, plot.y1 - 6);
      ctx.lineTo(plot.x0, plot.y0);
      ctx.lineTo(plot.x1 + 6, plot.y0);
      ctx.moveTo(plot.x0 - 4, plot.y1 - 1);
      ctx.lineTo(plot.x0, plot.y1 - 6);
      ctx.lineTo(plot.x0 + 4, plot.y1 - 1);
      ctx.moveTo(plot.x1 + 1, plot.y0 - 4);
      ctx.lineTo(plot.x1 + 6, plot.y0);
      ctx.lineTo(plot.x1 + 1, plot.y0 + 4);
      ctx.stroke();

      ctx.fillStyle = rgba(colours.muted, a.text);
      ctx.font = '400 10px "IBM Plex Mono", monospace';
      if (plot.labels) {
        ctx.textBaseline = 'top';
        ctx.textAlign = 'right';
        ctx.fillText(AXES.across, plot.x1, plot.y0 + 9);
        ctx.save();
        ctx.translate(plot.x0 - 9, plot.y1);
        ctx.rotate(-Math.PI / 2);
        ctx.textBaseline = 'bottom';
        ctx.fillText(AXES.up, 0, 0);
        ctx.restore();
      } else {
        // Narrow screens have no room outside the axes, so the labels sit just inside them.
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(AXES.up, plot.x0 + 8, plot.y1 - 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(AXES.across, plot.x1 - 2, plot.y0 - 6);
      }
    }

    // The grid quietens where it passes behind the name. A soft-edged area around the name's
    // lines erases part of what is drawn so far: the grid and the chance line. The shading
    // and the curve come later, so they keep their full strength. The area is drawn as the
    // blurred shadow of a shape placed far off the canvas, because a canvas shadow blurs the
    // same way in every browser.
    function fadeBehindName() {
      if (!NAME_GRID_FADE || !plot.nameBoxes?.length) return;
      const ratio = canvas.width / width;
      const pad = 12;
      const away = 100000;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.shadowColor = `rgba(0, 0, 0, ${NAME_GRID_FADE})`;
      ctx.shadowBlur = 20 * ratio;
      ctx.shadowOffsetX = away * ratio;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      for (const box of plot.nameBoxes) ctx.rect(box.x - pad - away, box.y - pad, box.w + pad * 2, box.h + pad * 2);
      ctx.fill();
      ctx.restore();
    }

    function draw(now) {
      if (!plot) return;
      const still = reducedMotion.matches;
      const a = colours.strength;
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, width, height);
      drawFrame(a);
      canvas.classList.add('is-ready');
      const raise = value => plot.lift + (1 - plot.lift) * value;

      // The operating point appears when the curve is complete. Its dashed guides belong with
      // the grid, so they are drawn before the fade and quieten behind the name with it.
      const appear = still ? 1 : clamp((t - 2.3) / 0.5);
      let across = 0;
      let up = 0;
      let x = 0;
      let y = 0;
      if (appear > 0) {
        const target = pointer.active && !still
          ? clamp((pointer.x - plot.x0) / (plot.x1 - plot.x0), 0.01, 0.99)
          : LOGO_FPR + (still ? 0 : 0.12 * Math.sin((t - 2.3) * 0.3));
        fpr += (target - fpr) * (still ? 1 : 0.08);
        const [rate, rise] = curveAtRate(fpr);
        across = rate;
        up = raise(rise);
        x = X(across);
        y = Y(up);
        ctx.strokeStyle = rgba(colours.copper, a.guide * appear);
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        line(crisp(x), y, crisp(x), plot.y0);
        line(plot.x0, crisp(y), x, crisp(y));
        ctx.setLineDash([]);
      }
      fadeBehindName();

      // The curve draws itself once, after the masthead entrance. A lifted curve starts part
      // of the way up its axis and keeps its shape over the remaining height.
      const progress = still ? 1 : easeInOut(clamp((t - 0.4) / 1.8));
      const count = Math.round(progress * (CURVE.length - 1));
      const trace = () => {
        ctx.beginPath();
        for (let i = 0; i <= count; i++) {
          const [x, y] = CURVE[i];
          if (i) ctx.lineTo(X(x), Y(raise(y))); else ctx.moveTo(X(x), Y(raise(y)));
        }
      };
      if (progress >= 1) {
        trace();
        ctx.lineTo(X(1), Y(0));
        ctx.lineTo(X(0), Y(0));
        ctx.closePath();
        ctx.fillStyle = rgba(colours.copper, a.fill);
        ctx.fill();
      }
      trace();
      ctx.strokeStyle = rgba(colours.copper, a.curve);
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (appear <= 0) return;
      ctx.fillStyle = rgba(colours.copper, 0.92 * appear);
      ctx.fillRect(Math.round(x - 5), Math.round(y - 5), 10, 10);

      // The readout sits beside the point where the masthead text leaves room. Otherwise it
      // waits in the top corner of the plot, and it is left out when there is no clear space.
      const readout = `${AXES.across} ${across.toFixed(2)}  ${AXES.up} ${up.toFixed(2)}`;
      ctx.font = '400 10px "IBM Plex Mono", monospace';
      const w = ctx.measureText(readout).width;
      const h = 12;
      const spots = [
        [x + 14, y + 10], [x + 14, y - 10 - h], [x - 14 - w, y + 10], [x - 14 - w, y - 10 - h],
        [plot.x1 - w - 4, plot.labels ? plot.y1 + 6 : plot.y1 - 2],
      ];
      const blocked = plot.labels ? obstacles : [...obstacles, { x0: plot.x0, x1: plot.x0 + 20 + ctx.measureText(AXES.up).width, y0: plot.y1 - 4, y1: plot.y1 + 12 }];
      const clear = ([sx, sy]) => sx >= 4 && sx + w <= width - 4 && sy >= 2 && sy + h <= height - 2
        && !blocked.some(box => sx < box.x1 && sx + w > box.x0 && sy < box.y1 && sy + h > box.y0);
      if (placement < 0 || placement === 4 || !clear(spots[placement])) {
        const near = spots.slice(0, 4).findIndex(clear);
        placement = near >= 0 ? near : clear(spots[4]) ? 4 : -1;
      }
      if (placement < 0) return;
      ctx.fillStyle = rgba(colours.muted, a.text * appear);
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText(readout, spots[placement][0], spots[placement][1]);
    }

    const animating = () => onScreen && !document.hidden && !reducedMotion.matches;
    let last = 0;
    function tick(now) {
      frame = 0;
      if (!animating()) return;
      if (now - last >= 33) { last = now; draw(now); }
      frame = requestAnimationFrame(tick);
    }
    function update() {
      if (animating() && !frame) frame = requestAnimationFrame(tick);
      if (!animating()) draw(performance.now());
    }

    readColours();
    measure();
    new ResizeObserver(measure).observe(hero);
    window.addEventListener('resize', measure, { passive: true });
    new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; update(); }).observe(hero);
    document.addEventListener('visibilitychange', update);
    reducedMotion.addEventListener('change', update);
    // Text moves while the entrance plays and when web fonts arrive, so measure it again then.
    document.fonts?.ready.then(measure);
    setTimeout(measure, 2000);

    window.addEventListener('pointermove', event => {
      if (!finePointer.matches) return;
      const rect = hero.getBoundingClientRect();
      pointer.active = event.clientY >= rect.top && event.clientY <= rect.bottom;
      pointer.x = event.clientX;
    }, { passive: true });
    root.addEventListener('pointerleave', () => { pointer.active = false; });

    update();
  }

  /* Link decoder. When a mouse pointer arrives on a link, its text runs through random
     letters and digits for a moment, then settles. The link's own text never changes. Its
     letters turn transparent, and the scrambled letters appear on a layer laid over each
     line of the link, in the same font and clipped to that line. Nothing reflows, wrapped
     links scramble line by line, and screen readers only ever meet the real text. */
  function setupLinkDecoder() {
    const busy = new WeakSet();
    const pick = set => set[Math.floor(Math.random() * set.length)];
    const LOWER = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const scramble = char => (/\d/.test(char) ? pick('0123456789') : /[a-z]/.test(char) ? pick(LOWER) : /[A-Z]/.test(char) ? pick(UPPER) : char);
    const visibleText = node => node.data.trim() && !node.parentElement.closest('[aria-hidden="true"], svg, .sr-only');

    // Every rendered character of the link, grouped into the lines it occupies on screen.
    function measureLines(link) {
      const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT, { acceptNode: node => (visibleText(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
      const range = document.createRange();
      const lines = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        for (let i = 0; i < node.data.length; i++) {
          range.setStart(node, i);
          range.setEnd(node, i + 1);
          const box = range.getBoundingClientRect();
          if (!box.width && !box.height) continue;
          const current = lines.at(-1);
          if (!current || box.top >= current.bottom - box.height / 2 || box.left < current.right - 1) {
            lines.push({ chars: [], left: box.left, right: box.right, top: box.top, bottom: box.bottom });
          }
          const line = lines.at(-1);
          line.chars.push(node.data[i]);
          line.right = Math.max(line.right, box.right);
          line.top = Math.min(line.top, box.top);
          line.bottom = Math.max(line.bottom, box.bottom);
        }
      }
      return lines.filter(line => line.chars.some(char => !/\s/.test(char)));
    }

    document.addEventListener('pointerover', event => {
      if (event.pointerType !== 'mouse' || reducedMotion.matches) return;
      const link = event.target.closest?.('a[href]');
      if (!link || busy.has(link) || (event.relatedTarget && link.contains(event.relatedTarget))) return;
      const lines = measureLines(link);
      if (!lines.length) return;
      busy.add(link);

      const total = lines.reduce((sum, line) => sum + line.chars.length, 0);
      const duration = Math.min(Math.max(220 + total * 12, 300), 600);
      let position = 0;
      const resolveAt = lines.map(line => line.chars.map(() => (position++ / total) * duration * 0.7 + Math.random() * duration * 0.3));
      const paint = elapsed => rows.forEach((row, i) => {
        row.textContent = lines[i].chars.map((char, j) => (elapsed >= resolveAt[i][j] ? char : scramble(char))).join('');
      });

      const style = getComputedStyle(link);
      const layer = document.createElement('div');
      layer.className = 'fx-scramble';
      layer.setAttribute('aria-hidden', 'true');
      const rows = lines.map(line => {
        const row = document.createElement('span');
        row.className = 'fx-scramble-line';
        const height = line.bottom - line.top;
        Object.assign(row.style, {
          left: `${line.left + scrollX}px`,
          top: `${line.top + scrollY}px`,
          width: `${Math.ceil(line.right - line.left) + 1}px`,
          height: `${height}px`,
          lineHeight: `${height}px`,
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          fontStyle: style.fontStyle,
          fontVariationSettings: style.fontVariationSettings,
          letterSpacing: style.letterSpacing,
          textTransform: style.textTransform,
          color: style.color,
        });
        layer.append(row);
        return row;
      });
      paint(0);
      document.body.append(layer);
      // Hide the real letters only. The underline keeps its colour, which Chromium would
      // otherwise take from the hidden text, and icons keep their own colours.
      const inline = link.getAttribute('style');
      link.style.textDecorationColor = style.textDecorationColor;
      link.style.setProperty('-webkit-text-fill-color', 'transparent');

      let start = 0;
      let last = 0;
      function finish() {
        layer.remove();
        if (inline === null) link.removeAttribute('style'); else link.setAttribute('style', inline);
        busy.delete(link);
      }
      function step(now) {
        if (!start) start = now;
        const elapsed = now - start;
        if (elapsed >= duration || reducedMotion.matches) { finish(); return; }
        if (now - last > 40) { last = now; paint(elapsed); }
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  /* Colour mode wipe. The theme toggle in main.js changes the theme. This listener runs
     first, then replays the click inside a view transition so that the new mode
     spreads in a circle from the button. */
  function setupThemeWipe() {
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle || typeof document.startViewTransition !== 'function') return;
    let replaying = false;

    document.addEventListener('click', event => {
      if (replaying || reducedMotion.matches || !event.target.closest?.('.theme-toggle')) return;
      event.stopImmediatePropagation();
      const rect = toggle.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      root.classList.add('fx-theme-wipe');
      const transition = document.startViewTransition(() => {
        replaying = true;
        try { toggle.click(); } finally { replaying = false; }
      });
      transition.ready.then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 650, easing: 'cubic-bezier(.65, 0, .35, 1)', pseudoElement: '::view-transition-new(root)' },
        );
      }).catch(() => {});
      transition.finished.catch(() => {}).finally(() => root.classList.remove('fx-theme-wipe'));
    }, true);
  }

  setupPlot();
  const watch = !reducedMotion.matches && 'IntersectionObserver' in window ? createWatcher() : null;
  if (watch) setupScroll(watch);
  // The endless list is a feature, not decoration, so it also runs for reduced motion.
  setupWriting(watch);
  if (!reducedMotion.matches) {
    setupThemeWipe();
    setupLinkDecoder();
  }
})();
