(() => {
  const root = document.documentElement;
  let theme;
  try { theme = localStorage.getItem('ash-theme'); } catch {}
  if (theme !== 'light' && theme !== 'dark') {
    const preference = root.dataset.defaultTheme;
    theme = preference === 'dark' || (preference === 'system' && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#171615' : '#f1ede6');
})();
