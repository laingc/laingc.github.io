(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('.theme-toggle');
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  let explicitTheme;
  try { explicitTheme = localStorage.getItem('ash-theme'); } catch {}

  function defaultTheme() {
    return root.dataset.defaultTheme === 'dark' || (root.dataset.defaultTheme === 'system' && systemTheme.matches) ? 'dark' : 'light';
  }

  function setTheme(theme) {
    root.dataset.theme = theme;
    const dark = theme === 'dark';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#171615' : '#f1ede6');
    if (themeButton) {
      themeButton.setAttribute('aria-pressed', String(dark));
      themeButton.setAttribute('aria-label', dark ? themeButton.dataset.lightLabel : themeButton.dataset.darkLabel);
      themeButton.title = themeButton.getAttribute('aria-label');
    }
  }

  if (themeButton) {
    setTheme(root.dataset.theme);
    themeButton.hidden = false;
    themeButton.addEventListener('click', () => {
      explicitTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      setTheme(explicitTheme);
      try { localStorage.setItem('ash-theme', explicitTheme); } catch {}
    });
  }
  systemTheme.addEventListener('change', () => {
    if (explicitTheme !== 'light' && explicitTheme !== 'dark') setTheme(defaultTheme());
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== 'ash-theme' && event.key !== null) return;
    explicitTheme = event.newValue;
    setTheme(explicitTheme === 'light' || explicitTheme === 'dark' ? explicitTheme : defaultTheme());
  });

  const header = document.querySelector('.site-header');
  const menu = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#main-navigation');
  function closeGroups() {
    navigation?.querySelectorAll('details[open]').forEach(group => { group.open = false; });
  }
  function setMenu(open) {
    if (!header || !menu) return;
    header.dataset.menuOpen = String(open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? menu.dataset.closeLabel : menu.dataset.openLabel);
    if (!open) closeGroups();
  }
  if (header && menu && navigation) {
    menu.hidden = false;
    header.dataset.menuReady = 'true';
    setMenu(false);
    menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
    navigation.addEventListener('click', event => {
      const link = event.target.closest('a');
      if (!link) return;
      setMenu(false);
      if (link.pathname === location.pathname && link.hash) {
        const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
        if (target) {
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const expanded = navigation.querySelector('details[open]');
      if (expanded) {
        expanded.open = false;
        expanded.querySelector('summary')?.focus();
      } else if (menu.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        menu.focus();
      }
    });
    document.addEventListener('click', event => {
      if (!header.contains(event.target)) setMenu(false);
    });
    header.addEventListener('focusout', event => {
      if (event.relatedTarget && !header.contains(event.relatedTarget)) setMenu(false);
    });
    matchMedia('(min-width: 901px)').addEventListener('change', () => setMenu(false));
  }

  document.querySelectorAll('.code-block').forEach(block => {
    const button = block.querySelector('.copy-code');
    const code = block.querySelector('code[data-lang]') || block.querySelector('code');
    const status = block.querySelector('.copy-status');
    if (!button || !code || !status) return;
    button.hidden = false;
    const pre = code.closest('pre');
    if (pre) pre.tabIndex = 0;
    button.addEventListener('click', async () => {
      const copy = code.cloneNode(true);
      copy.querySelectorAll('.ln, .lnt').forEach(number => number.remove());
      try {
        await navigator.clipboard.writeText(copy.textContent);
        status.textContent = button.dataset.copied;
        button.textContent = button.dataset.copied;
      } catch {
        const range = document.createRange();
        range.selectNodeContents(code);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        status.textContent = button.dataset.error;
      }
      setTimeout(() => { button.textContent = button.dataset.copy; status.textContent = ''; }, 2400);
    });
  });
})();
