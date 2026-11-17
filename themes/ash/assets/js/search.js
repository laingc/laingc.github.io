(() => {
  const root = document.querySelector('[data-search-index]');
  if (!root) return;
  const form = root.querySelector('form');
  const input = form.querySelector('input');
  const status = root.querySelector('[role="status"]');
  const results = root.querySelector('.search-results');
  let index;
  let timer;
  let request = 0;
  const normalise = text => String(text).normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase();

  async function search() {
    const current = ++request;
    const query = input.value.trim();
    const url = new URL(location.href);
    query ? url.searchParams.set('q', query) : url.searchParams.delete('q');
    history.replaceState(null, '', url);
    results.replaceChildren();
    if (!query) { status.textContent = root.dataset.hint; return; }
    status.textContent = root.dataset.loading;
    try {
      index ||= fetch(root.dataset.searchIndex).then(response => {
        if (!response.ok) throw new Error('Search index unavailable');
        return response.json();
      }).then(pages => pages.map(page => ({ ...page, titleText: normalise(page.title), termsText: normalise(page.terms.join(' ')), bodyText: normalise(page.text) })));
      const pages = await index;
      if (current !== request) return;
      const words = normalise(query).split(/\s+/).filter(Boolean);
      const matches = pages.map(page => {
        const all = `${page.titleText} ${page.termsText} ${page.bodyText}`;
        if (!words.every(word => all.includes(word))) return null;
        const score = words.reduce((total, word) => total + (page.titleText.includes(word) ? 10 : 0) + (page.termsText.includes(word) ? 4 : 0) + 1, 0);
        return { page, score };
      }).filter(Boolean).sort((a, b) => b.score - a.score);
      status.textContent = matches.length ? root.dataset.results.replace('{count}', String(matches.length)) : root.dataset.empty;
      for (const { page } of matches) {
        const destination = new URL(page.url, location.href);
        if (destination.origin !== location.origin || !['http:', 'https:'].includes(destination.protocol)) continue;
        const item = document.createElement('li');
        const heading = document.createElement('h2');
        const link = document.createElement('a');
        const description = document.createElement('p');
        link.href = destination.href;
        link.textContent = page.title;
        description.textContent = page.summary;
        heading.append(link);
        item.append(heading, description);
        results.append(item);
      }
    } catch {
      index = undefined;
      if (current === request) status.textContent = root.dataset.error;
    }
  }
  form.hidden = false;
  document.querySelector('.search-fallback').hidden = true;
  status.textContent = root.dataset.hint;
  input.value = new URLSearchParams(location.search).get('q') || '';
  form.addEventListener('submit', event => { event.preventDefault(); clearTimeout(timer); search(); });
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(search, 180); });
  if (input.value) search();
})();
