// ================================================================
// SHARED — used by both index.html (main.js) and article.html (article.js)
// ================================================================
const PLACEHOLDER_IMG = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22350%22%3E%3Crect fill=%22%23f0f4ff%22 width=%22600%22 height=%22350%22/%3E%3Ctext x=%22300%22 y=%22180%22 font-family=%22sans-serif%22 font-size=%2218%22 fill=%22%236b7f9a%22 text-anchor=%22middle%22%3ENo image%3C/text%3E%3C/svg%3E';

// ================================================================
// ROUTER — same-document param changes use pushState (instant, no
// reload). Navigating to a different document (index.html <-> 
// article.html) is a real browser navigation; each page defines its
// own global loadApp(), so this stays generic across both pages.
// ================================================================
function navigateTo(url) {
  const target = new URL(url, window.location.origin);
  const current = window.location;

  if (target.pathname !== current.pathname) {
    window.location.href = target.pathname + target.search;
    return;
  }
  if (target.search === current.search) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  window.history.pushState({}, '', target.pathname + target.search);
  if (typeof loadApp === 'function') loadApp();
  document.getElementById('navLinks')?.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================================================================
// SEO META — updates <head> tags for client-side transitions
// (e.g. related-article clicks). functions/[[path]].js already sets
// these correctly in the initial HTML response for crawlers/first
// paint; this keeps them correct as the user navigates without a
// full reload.
// ================================================================
function updateMeta(article) {
  if (article) {
    document.title = article.title + ' – Stackora';
    setMeta('description', article.excerpt || '');
    setMeta('og:title', article.title);
    setMeta('og:description', article.excerpt || '');
    setMeta('og:image', article.image || '');
    setMeta('og:type', 'article');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', article.title);
    setMeta('twitter:description', article.excerpt || '');
    setMeta('twitter:image', article.image || '');
    setCanonical(window.location.origin + '/article.html?slug=' + encodeURIComponent(article.slug || ''));
    addJsonLdArticle(article);
  } else {
    document.title = 'Stackora – Less hype. More value.';
    setMeta('description', 'Curated insights for smarter decisions.');
    setMeta('og:title', 'Stackora – Less hype. More value.');
    setMeta('og:description', 'Curated insights for smarter decisions.');
    setMeta('og:image', '');
    setMeta('og:type', 'website');
    setMeta('twitter:card', 'summary');
    setMeta('twitter:title', 'Stackora');
    setMeta('twitter:description', 'Curated insights for smarter decisions.');
    setCanonical(window.location.origin + '/');
    document.querySelector('#jsonld-article')?.remove();
  }
}

function setMeta(name, content) {
  let meta = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    if (name.startsWith('og:')) meta.setAttribute('property', name);
    else meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content || '');
}

function setCanonical(href) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href || window.location.href;
}

function addJsonLdArticle(article) {
  document.querySelector('#jsonld-article')?.remove();
  const script = document.createElement('script');
  script.id = 'jsonld-article';
  script.type = 'application/ld+json';
  const jsonld = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.excerpt || '',
    "image": article.image || '',
    "datePublished": article.date,
    "dateModified": article.date,
    "author": { "@type": "Organization", "name": "Stackora" },
    "publisher": { "@type": "Organization", "name": "Stackora" }
  };
  script.textContent = JSON.stringify(jsonld);
  document.head.appendChild(script);
}

// ================================================================
// NAV — shared by both pages' setupUI()
// ================================================================
function setupSharedNav() {
  // Dropdown
  document.querySelectorAll('.dropbtn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const parent = this.closest('.nav-item');
      const isOpen = parent.classList.contains('open');
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('open'));
      if (!isOpen) parent.classList.add('open');
    });
  });
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.nav-item')) {
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('open'));
    }
  });

  // Mobile
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');
  mobileToggle.addEventListener('click', e => { e.stopPropagation(); navLinks.classList.toggle('open'); });
  document.addEventListener('click', e => { if (!navLinks.contains(e.target) && e.target !== mobileToggle) navLinks.classList.remove('open'); });

  // Logo
  document.getElementById('logoHome').addEventListener('click', () => navigateTo('/'));

  // Category / Featured / Latest Reviews links (nav bar + dropdowns)
  document.querySelectorAll('[data-cat]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const cat = this.dataset.cat;
      const view = this.dataset.view;
      if (cat) navigateTo('/?cat=' + cat);
      else if (view === 'latest') navigateTo('/?view=latest');
      else navigateTo('/');
    });
  });
}
