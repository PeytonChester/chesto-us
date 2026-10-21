# Chesto.us

## Build every change with Google Search in mind

Peyton's standing rule: everything we do on the site should be done with Google in mind. Before you call any change done, check it against this list.

### How pages reach Google
- Every URL except `/` is served by `api/page.js`, which uses the built `index.html` as a template. `api/_seo.js` fills in that page's `<head>`, a plain-HTML copy of its main content inside `#root` (`injectContent`), and its status code. React then replaces `#root` when it starts.
- `/` is the static `index.html`. Its home tags sit in the `page-meta` block. Keep that block in step with `headTags()`.
- Sitemaps live in `api/sitemap*.js` and are rewritten to `/sitemap*.xml` in `vercel.json`. `public/robots.txt` points to the sitemap index.

### Checklist for new or changed pages
- **Server-side meta:** add the route to `pageMeta()` in `api/_seo.js` with a real title, a description and a JSON-LD type where one fits (Recipe, BlogPosting, Review). Mirror the same values in the page's `<PageMeta>`.
- **Content without JS:** if the page's main text comes from Firestore, render a plain-HTML copy of it on the server (see `recipeContent`/`postContent`). Google should see real text in the raw HTML, not just an empty `#root`.
- **Status codes:** URLs that don't exist must return a real 404 with `noindex`. A Firestore error must never turn a real page into a 404. Throw instead, and let the catch in `pageMeta()` serve a 200.
- **Sitemap:** add new public pages to the matching `api/sitemap-*.js`, and leave out hidden, draft or unlisted ones.
- **One URL per page:** use canonical, non-trailing-slash, `www` URLs everywhere (`trailingSlash: false` is set). When you move or rename a URL, 301 the old one to the new one (as with `/blog/<recipe>` → `/recipes/<recipe>`), and don't let it 404.
- **noindex** only on admin, the 404 page and deliberately unlisted pages (for example the water log).
- **Links:** use real `<a href>`/`<Link>` elements for navigation, not click handlers, so crawlers can follow them.
- **Images:** add meaningful `alt` text. Photos have their own `alt` and `title` fields, edited under Admin → Photos → Edit Details; use `photo.alt || photo.title || fallback`. Keep using the optimized `/_vercel/image` / `responsiveImage` helpers.
- **Speed:** keep Core Web Vitals in mind. Don't block the first paint, keep the home hero preload, and lazy-load heavy, below-the-fold components.
- **Verify live** after merging: `curl` the page and check the status, `<title>`, description, canonical, JSON-LD and body text, then load it in a browser.

Don't remove the `google-site-verification` meta tag from `index.html`. Search Console needs it.
