// ================================================================
// ARTICLE PAGE (article.html) — single template for every review
// ================================================================
async function renderArticlePage(slug) {
  const artTitle = document.getElementById('artTitle');
  const artCat = document.getElementById('artCat');
  const artMeta = document.getElementById('artMeta');
  const artImage = document.getElementById('artImage');
  const artBody = document.getElementById('artBody');
  const prosConsBlock = document.getElementById('prosConsBlock');
  const artAffLink = document.getElementById('artAffLink');
  const faqBlock = document.getElementById('faqBlock');
  const relatedBlock = document.getElementById('relatedBlock');
  const relatedGrid = document.getElementById('relatedGrid');

  try {
    const [metaRes, htmlRes] = await Promise.all([
      fetch(`/data/articles/meta/${slug}.json`),
      fetch(`/data/articles/html/${slug}.html`)
    ]);
    if (!metaRes.ok || !htmlRes.ok) throw new Error('Article not found');
    const article = await metaRes.json();
    article.content = await htmlRes.text();

    // Affiliate link is a nice-to-have, not load-bearing: if
    // affiliate-links.json is slow/unavailable, still show the article.
    let affLink = '#';
    try {
      const linkRes = await fetch('/data/affiliate-links.json');
      if (linkRes.ok) {
        const links = await linkRes.json();
        if (article.affiliateKey && links[article.affiliateKey]) affLink = links[article.affiliateKey];
      }
    } catch (e) { /* keep default '#', article still renders */ }

    artCat.textContent = article.categoryLabel || 'Category';
    artTitle.textContent = article.title;
    artMeta.innerHTML = `<span class="badge">${article.categoryLabel}</span><span>${article.date}</span><span><svg class="icon icon-sm"><use href="#icon-clock"/></svg> ${article.readingTime}</span>`;
    artImage.src = article.image;
    artImage.alt = article.title;
    artImage.onerror = function() { this.src = PLACEHOLDER_IMG; };
    artBody.innerHTML = article.content;

    prosConsBlock.innerHTML = ((article.pros?.length) || (article.cons?.length)) ? `<div class="pros-cons">
      ${article.pros?.length ? `<div class="pros"><h4><svg class="icon"><use href="#icon-check-circle"/></svg> Pros</h4><ul>${article.pros.map(p=>`<li>${p}</li>`).join('')}</ul></div>` : ''}
      ${article.cons?.length ? `<div class="cons"><h4><svg class="icon"><use href="#icon-times-circle"/></svg> Cons</h4><ul>${article.cons.map(c=>`<li>${c}</li>`).join('')}</ul></div>` : ''}
    </div>` : '';

    artAffLink.href = affLink;

    faqBlock.innerHTML = article.faq?.length ? `<div class="faq"><h4>FAQ</h4>${article.faq.map(qa=>`<strong>${qa.q}</strong><p>${qa.a}</p>`).join('')}</div>` : '';

    // Related posts resolve against the search index; if that fetch
    // fails, just hide the section instead of failing the whole page.
    const related = article.related || [];
    let relatedPosts = [];
    try {
      const searchIndex = related.length ? await getSearchIndex() : [];
      relatedPosts = related.map(rs => searchIndex.find(p => p.slug === rs)).filter(Boolean);
    } catch (e) { /* relatedPosts stays empty, section hides below */ }
    if (relatedPosts.length) {
      relatedBlock.style.display = 'block';
      relatedGrid.innerHTML = relatedPosts.map(r => `<div class="related-item" data-slug="${r.slug}">${r.title}</div>`).join('');
      relatedGrid.querySelectorAll('.related-item').forEach(el => {
        el.addEventListener('click', () => navigateTo('/article.html?slug=' + el.dataset.slug));
      });
    } else {
      relatedBlock.style.display = 'none';
    }

    updateMeta(article);
  } catch (e) {
    artTitle.textContent = '';
    artCat.textContent = '';
    artMeta.innerHTML = '';
    artImage.removeAttribute('src');
    artBody.innerHTML = `<div class="not-found"><h2>Article not found</h2><p>The article you're looking for doesn't exist.</p><a class="btn-back" onclick="navigateTo('/')">Back to Home</a></div>`;
    prosConsBlock.innerHTML = '';
    faqBlock.innerHTML = '';
    relatedBlock.style.display = 'none';
    updateMeta(null);
  }
}

// ================================================================
// ROUTER (this page)
// ================================================================
async function loadApp() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) {
    document.getElementById('artBody').innerHTML = `<div class="not-found"><h2>Article not found</h2><p>The article you're looking for doesn't exist.</p><a class="btn-back" onclick="navigateTo('/')">Back to Home</a></div>`;
    updateMeta(null);
    return;
  }
  await renderArticlePage(slug);
}

// ================================================================
// INIT
// ================================================================
function setupUI() {
  setupSharedNav();
  window.addEventListener('popstate', loadApp);
}

setupUI();
setupSearchUI();
loadApp();
