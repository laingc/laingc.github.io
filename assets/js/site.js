const input = document.querySelector('#search-input');
const results = document.querySelector('#search-results');
const status = document.querySelector('#search-status');

if (input && results && status) {
  input.closest('.search').hidden = false;
  let index;
  let requestNumber = 0;
  input.addEventListener('input', async () => {
    const request = ++requestNumber;
    const query = input.value.trim().toLocaleLowerCase('en-NZ');
    results.replaceChildren();
    status.textContent = '';
    if (!query) return;
    try {
      index ??= fetch(input.dataset.index).then(response => {
        if (!response.ok) throw new Error('Search index unavailable');
        return response.json();
      }).catch(error => {
        index = undefined;
        throw error;
      });
      const posts = await index;
      if (request !== requestNumber) return;
      const words = query.split(/\s+/);
      const matches = posts.filter(post => {
        const text = `${post.title} ${post.content}`.toLocaleLowerCase('en-NZ');
        return words.every(word => text.includes(word));
      });
      for (const post of matches.slice(0, 10)) {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = post.url;
        link.textContent = post.title;
        item.append(link);
        results.append(item);
      }
      status.textContent = `${matches.length} ${matches.length === 1 ? 'post' : 'posts'} found`;
    } catch {
      if (request === requestNumber) status.textContent = 'Search is unavailable. Browse the Blog page instead.';
    }
  });
}
