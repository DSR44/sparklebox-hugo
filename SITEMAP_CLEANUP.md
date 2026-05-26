# Sparklebox clean sitemap for Pinterest / BlogToPin tools

After the May 2026 cleanup, use this URL in BlogToPin (or any automation tool):

**https://www.sparklebox.blog/sitemap.xml**

## What is included (~195 URLs)

- Homepage, Start Here, FAQ, About, Contact, Privacy
- All on-brand blog posts (177 essays)
- Frequency Upgrade hub + 5 spiral pages
- Musebox, Dream Toolkit, Sparkle Bazaar, Soundbox, Hidden Work
- Five pillar category pages only

## What is excluded

- 144 legacy lifestyle posts (archived locally in `_archive/legacy-posts/`)
- 23 obsolete shop/portal pages (archived in `_archive/legacy-pages/`)
- All tag pages (taxonomy removed)
- Legacy category pages (Fashion, Food, etc.)
- Paginated archive pages (`/page/2/`)
- Search, checkout, receipt, and other dead shop pages

## Re-submit after deploy

1. Google Search Console → Sitemaps → re-submit `sitemap.xml`
2. BlogToPin → disconnect and re-add site using the sitemap URL above
3. Allow 24–48 hours for tools to refresh their crawl cache

## Local archive

Removed content lives in `hugo_site/_archive/` (not published). Delete that folder only if you are sure you will never need the old copy.
