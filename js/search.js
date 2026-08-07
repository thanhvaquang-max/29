// ================================================================
// SEARCH — shared by both index.html and article.html
// ================================================================
let searchCache = null;
let searchInitialized = false;

async function getSearchIndex() {
  if (searchCache) return searchCache;
  const res = await fetch('/data/search-index.json');
  searchCache = await res.json();
  return searchCache;
}

async function initSearch() {
  if (searchInitialized) return;
  searchInitialized = true;
  await getSearchIndex();
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');

  function doSearch(query) {
    const q = query.trim().toLowerCase();
    if (!q) { searchResults.innerHTML = ''; return; }
    const matched = searchCache.filter(p => p.title.toLowerCase().includes(q) || (p.excerpt||'').toLowerCase().includes(q) || (p.categoryLabel||'').toLowerCase().includes(q));
    if (!matched.length) { searchResults.innerHTML = `<p style="color:var(--text-muted);padding:0.5rem;font-size:0.88rem;">No results for "${query}"</p>`; return; }
    searchResults.innerHTML = matched.map(p => `<div class="search-result-item" data-slug="${p.slug}"><strong>${p.title}</strong><br><span>${p.categoryLabel}</span></div>`).join('');
  }

  let debounceTimer;
  searchInput.addEventListener('input', function() { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => doSearch(this.value), 180); });
  document.querySelectorAll('.search-suggestions span[data-term]').forEach(el => {
    el.addEventListener('click', function() { searchInput.value = this.dataset.term; doSearch(this.dataset.term); });
  });

  searchResults.addEventListener('click', function(e) {
    const item = e.target.closest('.search-result-item');
    if (item && item.dataset.slug) {
      closeSearchOverlay();
      navigateTo('/article.html?slug=' + item.dataset.slug);
    }
  });
}

function closeSearchOverlay() {
  document.getElementById('searchOverlay').classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResults').innerHTML = '';
}

function setupSearchUI() {
  const searchToggle = document.getElementById('searchToggle');
  const searchClose = document.getElementById('searchClose');
  const searchOverlay = document.getElementById('searchOverlay');
  searchToggle.addEventListener('click', () => { searchOverlay.classList.add('open'); document.body.style.overflow='hidden'; initSearch(); setTimeout(()=>document.getElementById('searchInput').focus(),150); });
  searchClose.addEventListener('click', closeSearchOverlay);
  searchOverlay.addEventListener('click', e => { if (e.target === searchOverlay) closeSearchOverlay(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSearchOverlay(); });
}
