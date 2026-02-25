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
  if (!input) return;

  input.addEventListener('focus', init);
  input.addEventListener('keyup', search);
  document.addEventListener('keypress', focusSearchFieldOnKeyPress);

  function focusSearchFieldOnKeyPress(event) {
    if (event.target.value !== undefined) return;
    if (input === document.activeElement) return;

    const characterPressed = String.fromCharCode(event.charCode);
    if (!isHotkey(characterPressed)) return;

    input.focus();
    event.preventDefault();
  }

  function isHotkey(character) {
    const dataHotkeys = input.getAttribute('data-hotkeys') || '';
    return dataHotkeys.indexOf(character) >= 0;
  }

  function init() {
    input.removeEventListener('focus', init);
    input.required = true;

    fetch(searchDataURL)
      .then(pages => pages.json())
      .then(pages => {
        window.bookSearchIndex = new Fuse(pages, indexConfig);
      })
      .then(() => input.required = false)
      .then(search);
  }

  function search() {
    while (results.firstChild) results.removeChild(results.firstChild);
    if (!input.value) return;

    const hits = window.bookSearchIndex.search(input.value).slice(0, 10);
    hits.forEach(function (page) {
      // Display section/ownership ONCE as a prefix, avoid duplicate suffix.
      const sec = page.item.section ? String(page.item.section) : '';
      const title = page.item.title ? String(page.item.title) : '';
      const label = sec ? `[${sec}] ` : '';

      const li = element('<li><a href></a></li>');
      const a = li.querySelector('a');
      a.href = page.item.href;
      a.textContent = label + title;
      results.appendChild(li);
    });
  }

  function element(content) {
    const div = document.createElement('div');
    div.innerHTML = content;
    return div.firstChild;
  }
})();
