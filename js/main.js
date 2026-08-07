// ================================================================
// HOMEPAGE (index.html) — Featured / Latest Reviews / category feed
// ================================================================
let currentPage = 1;
let currentCategory = '';
let currentView = '';
let HOMEPAGE_DATA = null;

async function getHomepageData() {
  if (HOMEPAGE_DATA) return HOMEPAGE_DATA;
  const res = await fetch('/data/homepage.json');
  HOMEPAGE_DATA = await res.json();
  return HOMEPAGE_DATA;
}

function renderSkeleton(count) {
  const grid = document.getElementById('cardGrid');
  let html = '';
  for (let i=0; i<count; i++) {
    html += `<div class="skel-card"><div class="skel-banner"></div><div class="skel-body">
      <div class="skel-line w40"></div><div class="skel-line w90"></div><div class="skel-line w60"></div>
    </div></div>`;
  }
  grid.innerHTML = html;
}

function renderPagination(totalPages, page) {
  if (totalPages <= 1) return '';
  let html = '<div class="pagination">';
  html += `<button data-page="${page-1}" ${page<=1?'disabled':''}>‹</button>`;
  let start = Math.max(1, page-3);
  let end = Math.min(totalPages, page+3);
  if (end-start < 6) { if (start===1) end = Math.min(totalPages, start+6); else if (end===totalPages) start = Math.max(1, end-6); }
  if (start>1) { html += `<button data-page="1">1</button>`; if (start>2) html += `<span style="padding:0 0.3rem;color:var(--text-muted);">…</span>`; }
  for (let i=start; i<=end; i++) html += `<button data-page="${i}" class="${i===page?'active':''}">${i}</button>`;
  if (end<totalPages) { if (end<totalPages-1) html += `<span style="padding:0 0.3rem;color:var(--text-muted);">…</span>`; html += `<button data-page="${totalPages}">${totalPages}</button>`; }
  html += `<button data-page="${page+1}" ${page>=totalPages?'disabled':''}>›</button></div>`;
  return html;
}

function renderHero(hero) {
  if (!hero) return;
  const badge = document.getElementById('heroBadge');
  const title = document.getElementById('heroTitle');
  const accent = document.getElementById('heroAccent');
  const subtitle = document.getElementById('heroSubtitle');
  if (badge && hero.badge) badge.textContent = hero.badge;
  if (title && hero.title) title.textContent = hero.title;
  if (accent && hero.titleAccent) accent.textContent = hero.titleAccent;
  if (subtitle && hero.subtitle) subtitle.textContent = hero.subtitle;
}

function setActiveNav(category, view) {
  document.querySelectorAll('.nav-link, .dropdown-content a').forEach(a => a.classList.remove('active'));
  if (category) {
    document.querySelectorAll(`.dropdown-content a[data-cat="${category}"], .nav-link[data-cat="${category}"]`).forEach(a => a.classList.add('active'));
  } else if (view === 'latest') {
    document.querySelector('.nav-link[data-view="latest"]')?.classList.add('active');
  } else {
    document.querySelector('.nav-link[data-cat=""][data-view="home"]')?.classList.add('active');
  }
}

function cardHTML(p) {
  const srcset = `${p.image}?w=400 400w, ${p.image}?w=800 800w`;
  const sizes = '(max-width:768px) 100vw, 33vw';
  return `
    <div class="card" data-slug="${p.slug}">
      <div class="card-banner">
        <img src="${p.image}" srcset="${srcset}" sizes="${sizes}" alt="${p.title}" loading="lazy" decoding="async" onload="this.classList.add('loaded');" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}';this.classList.add('loaded');" />
      </div>
      <div class="card-body">
        <div class="card-meta"><span class="tag">${p.categoryLabel}</span><span>${p.date}</span></div>
        <div class="card-title">${p.title}</div>
        <div class="card-desc">${p.excerpt}</div>
        <div class="card-footer"><span class="read-more">Read More <svg class="icon icon-sm"><use href="#icon-arrow-right"/></svg></span><span>${p.readingTime}</span></div>
      </div>
    </div>`;
}

function wireCardClicks(grid) {
  grid.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => navigateTo('/article.html?slug=' + card.dataset.slug));
  });
}

async function loadHomeData(page, category, view) {
  if (category) {
    const res = await fetch(`/data/categories/${category}/page-${page}.json`);
    if (!res.ok) throw new Error('Category page not found');
    const data = await res.json();
    return { posts: data.posts || [], total: data.total || 0, totalPages: data.totalPages || 1 };
  }
  if (view === 'latest') {
    const res = await fetch(`/data/latest/page-${page}.json`);
    if (!res.ok) throw new Error('Latest page not found');
    const data = await res.json();
    return { posts: data.posts || [], total: data.total || 0, totalPages: data.totalPages || 1 };
  }
  // Featured — same paginated shape as a category feed, no special-cased logic
  const res = await fetch(`/data/featured/page-${page}.json`);
  if (!res.ok) throw new Error('Featured page not found');
  const data = await res.json();
  return { posts: data.posts || [], total: data.total || 0, totalPages: data.totalPages || 1 };
}

async function renderHomePage(page, category, view) {
  const grid = document.getElementById('cardGrid');
  const paginationContainer = document.getElementById('paginationContainer');

  renderSkeleton(8);

  let data;
  try {
    data = await loadHomeData(page, category, view);
  } catch (e) {
    grid.innerHTML = `<div class="not-found"><h2>Couldn't load reviews</h2><p>Please try again later.</p><a class="btn-back" onclick="navigateTo('/')">Back to Home</a></div>`;
    paginationContainer.innerHTML = '';
    return;
  }
  let posts = data?.posts || [];
  let totalPages = data?.totalPages || 1;

  if (page < 1) page = 1;
  if (page > totalPages) page = totalPages;
  currentPage = page;

  grid.innerHTML = posts.length
    ? posts.map(cardHTML).join('')
    : `<div class="not-found"><h2>No posts found</h2><p>Try a different category.</p><a class="btn-back" onclick="navigateTo('/')">Back to Home</a></div>`;
  wireCardClicks(grid);

  paginationContainer.innerHTML = renderPagination(totalPages, page);

  setActiveNav(category, view);
}

// ================================================================
// ROUTER (this page)
// ================================================================
async function loadApp() {
  // Safety net: any link built as "/?slug=xxx" (old sitemap entries,
  // stale bookmarks/backlinks, a shared URL typed by hand) belongs on
  // the article template, not the homepage feed. index.html has no
  // concept of "slug", so without this redirect that URL silently
  // renders the homepage — the article "does nothing" when opened.
  const rawParams = new URLSearchParams(window.location.search);
  const legacySlug = rawParams.get('slug');
  if (legacySlug) {
    window.location.replace('/article.html?slug=' + encodeURIComponent(legacySlug));
    return;
  }

  // Hero copy is data-driven but not load-bearing: render the card
  // grid regardless of whether this succeeds. The static text already
  // in the HTML is the fallback if it's slow or fails.
  getHomepageData().then(data => renderHero(data.hero)).catch(() => {});

  try {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('cat') || '';
    const view = params.get('view') || '';
    const page = parseInt(params.get('page')) || 1;

    currentCategory = cat;
    currentView = view;

    // "Featured" (no cat/view), "Latest Reviews", and every category all
    // render through the same paginated feed — only the data source differs.
    await renderHomePage(page, cat, view);
  } catch (e) {
    await renderHomePage(1, '', '');
  }
}

// ================================================================
// INIT
// ================================================================
function setupUI() {
  setupSharedNav();

  document.getElementById('paginationContainer').addEventListener('click', e => {
    const btn = e.target.closest('button[data-page]');
    if (!btn) return;
    const page = parseInt(btn.dataset.page);
    if (page && page !== currentPage) {
      const qsPrefix = currentCategory ? 'cat=' + currentCategory + '&' : (currentView ? 'view=' + currentView + '&' : '');
      navigateTo('/?' + qsPrefix + 'page=' + page);
    }
  });

  window.addEventListener('popstate', loadApp);
}

setupUI();
setupSearchUI();
loadApp();
