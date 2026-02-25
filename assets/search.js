'use strict';

{{ $searchDataFile := printf "%s.search-data.json" .Language.Lang }}
{{ $searchData := resources.Get "search-data.json" | resources.ExecuteAsTemplate $searchDataFile . | resources.Minify | resources.Fingerprint }}
{{ $searchConfig := i18n "bookSearchConfig" | default "{}" }}

(function () {
  const searchDataURL = '{{ partial "docs/links/resource-precache" $searchData }}';
  const indexConfig = Object.assign({{ $searchConfig }}, {
    includeScore: true,
    useExtendedSearch: true,
    fieldNormWeight: 1.5,
    threshold: 0.2,
    ignoreLocation: true,
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'content', weight: 0.3 }
    ]
  });

  const input = document.querySelector('#book-search-input');
  const results = document.querySelector('#book-search-results');
  const container = input ? input.closest('.site-search, .top-search, .book-search') : null;

  if (!input || !results) return;

  function hideResults() {
    while (results.firstChild) results.removeChild(results.firstChild);
    results.classList.remove('show');
  }

  function showResults() {
    results.classList.add('show');
  }

  input.addEventListener('focus', init);
  input.addEventListener('keyup', search);

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!container) return;
    if (container.contains(e.target)) return;
    hideResults();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideResults();
      input.blur();
    }
  });

  // Hotkey focus (kept from upstream)
  document.addEventListener('keypress', focusSearchFieldOnKeyPress);
  function focusSearchFieldOnKeyPress(event) {
    if (event.target.value !== undefined) return;
    if (input === document.activeElement) return;

    const characterPressed = String.fromCharCode(event.charCode);
    const dataHotkeys = input.getAttribute('data-hotkeys') || '';
    if (dataHotkeys.indexOf(characterPressed) < 0) return;

    input.focus();
    event.preventDefault();
  }

  function init() {
    input.removeEventListener('focus', init);
    input.required = true;

    fetch(searchDataURL)
      .then(pages => pages.json())
      .then(pages => {
        window.bookSearchIndex = new Fuse(pages, indexConfig);
      })
      .then(() => (input.required = false))
      .then(search);
  }

  function search() {
    hideResults();

    const q = (input.value || '').trim();
    if (!q) return;
    if (!window.bookSearchIndex) return;

    const hits = window.bookSearchIndex.search(q).slice(0, 10);
    if (!hits.length) return;

    hits.forEach((page) => {
      const section = (page.item.section || '').trim();
      const prefix = section ? `[${section}] ` : '';

      const li = element('<li><a href></a></li>');
      const a = li.querySelector('a');

      a.href = page.item.href;
      a.textContent = prefix + page.item.title;

      results.appendChild(li);
    });

    showResults();
  }

  function element(content) {
    const div = document.createElement('div');
    div.innerHTML = content;
    return div.firstChild;
  }
})();
