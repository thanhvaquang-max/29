// ================================================================
// STATIC PAGES — About / Contact / Privacy Policy / Terms of Service /
// Affiliate Disclosure. These pages have no feed/category/pagination
// to render, so they don't load main.js or article.js — but the
// header (dropdowns, mobile menu, Featured/category/Latest Reviews
// links, logo) and the search overlay are wired up inside those
// files' setupUI(), not in utils.js/search.js themselves. This just
// calls the same two setup functions so the header and search work
// here too.
// ================================================================
setupSharedNav();
setupSearchUI();
