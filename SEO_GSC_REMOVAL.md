# Google Search Console — Remove legacy Sparklebox URLs

After the May 2026 SEO cleanup, **118+ legacy lifestyle posts** are marked `noindex`. Google will drop them over weeks. To speed this up, use Search Console.

## 1. Verify the property

1. Open [Google Search Console](https://search.google.com/search-console)
2. Confirm **https://www.sparklebox.blog/** is verified (meta tag is already in `extend_head.html`)

## 2. Removals (fastest for worst offenders)

**Removals → New request → Temporarily remove URL**

Use prefix removal for legacy patterns (temporary ~6 months, helps while noindex is processed):

- `https://www.sparklebox.blog/posts/2024/` — all Dec 2024 Pinterest spam
- `https://www.sparklebox.blog/posts/2025/01/` — early 2025 lifestyle batch
- `https://www.sparklebox.blog/posts/2025/02/` — fashion/wellness trends

Or remove individual URLs you see ranking for off-brand queries (fashion, food, nails, thrift, etc.).

## 3. Validate noindex

1. **URL Inspection** → paste a legacy URL (e.g. a fashion post)
2. Confirm response includes `noindex` in robots meta
3. Click **Request indexing** only for **on-brand** URLs (Frequency Upgrade posts, Start Here, FAQ)

## 4. Submit updated sitemap

Sitemap: `https://www.sparklebox.blog/sitemap.xml`

After deploy, ping in GSC: **Sitemaps → Add** `sitemap.xml`

## 5. Monitor (monthly)

- **Performance → Pages** — filter queries containing: fashion, recipe, nail, thrift, wedding
- **Coverage** — watch "Excluded by noindex" count rise (good)
- **Enhancements** — FAQ and Article rich results on `/faq/` and cornerstone posts

## What stays indexed

Five pillar categories only:

1. The Sparklebox Method
2. The Frequency Upgrade
3. Sparklebox Realm
4. Mystical Wisdom Series
5. Dream and Muse Tools

Everything else is either noindex or consolidated into these pillars.
