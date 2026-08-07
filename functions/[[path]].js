// Rewrites SEO tags on article.html — the single template every review
// uses. The homepage (index.html) is fully static now, so it needs no
// edge processing at all (see _routes.json, which excludes it from
// ever invoking this function).

export async function onRequest(context) {
  const { env } = context;
  const url = new URL(context.request.url);

  if (url.pathname !== '/article.html') return context.next();

  const slug = url.searchParams.get('slug');
  if (!slug || slug.includes('..')) return context.next();

  let articleRes;
  try { articleRes = await env.ASSETS.fetch(new URL(`/data/articles/meta/${slug}.json`, url.origin)); }
  catch { return context.next(); }

  if (!articleRes.ok) return render404(env, url.origin);

  let article;
  try { article = await articleRes.json(); }
  catch { return render404(env, url.origin); }

  const pageRes = await env.ASSETS.fetch(new URL('/article.html', url.origin));
  if (!pageRes.ok) return context.next();

  return rewriteHTML(pageRes, article, url);
}

async function render404(env, origin) {
  const res = await env.ASSETS.fetch(new URL('/404.html', origin));
  const body = res.ok ? await res.text() : '<h1>404</h1>';
  return new Response(body, { status: 404, headers: { 'content-type': 'text/html;charset=UTF-8' } });
}

function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function rewriteHTML(res, article, url) {
  const canonical = `${url.origin}/article.html?slug=${encodeURIComponent(article.slug || '')}`;
  const title = `${article.title} – Stackora`;
  const desc = article.excerpt || '';
  const image = article.image || `${url.origin}/assets/og-default.jpg`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: desc,
    image,
    url: canonical,
    datePublished: article.date,
    dateModified: article.updated || article.date,
    author: { '@type': 'Organization', name: 'Stackora' },
    publisher: { '@type': 'Organization', name: 'Stackora' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical }
  };

  return new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(title); } })
    .on('meta[name="description"]', { element(el) { el.setAttribute('content', esc(desc)); } })
    .on('link[rel="canonical"]', { element(el) { el.setAttribute('href', canonical); } })
    .on('meta[property="og:title"]', { element(el) { el.setAttribute('content', esc(title)); } })
    .on('meta[property="og:description"]', { element(el) { el.setAttribute('content', esc(desc)); } })
    .on('meta[property="og:image"]', { element(el) { el.setAttribute('content', image); } })
    .on('meta[property="og:type"]', { element(el) { el.setAttribute('content', 'article'); } })
    .on('meta[name="twitter:title"]', { element(el) { el.setAttribute('content', esc(title)); } })
    .on('meta[name="twitter:description"]', { element(el) { el.setAttribute('content', esc(desc)); } })
    .on('meta[name="twitter:image"]', { element(el) { el.setAttribute('content', image); } })
    .on('head', {
      element(el) {
        el.append(`<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`, { html: true });
      }
    })
    .transform(res);
}
