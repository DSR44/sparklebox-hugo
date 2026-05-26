# Sparklebox Okara SEO Audit — Cursor Agent Instructions

**Read first:** `../OKARA_SEO_AUDIT_PLAYBOOK.md` (full playbook)  
**Also read:** `../SPARKLEBOX_AGENT_MEMORY.md` (brand voice — do not dilute to generic wellness SEO)

**Site:** https://www.sparklebox.blog/  
**This repo:** `hugo_site/` (LIVE — push to `DSR44/sparklebox-hugo`)

---

## Your job

Run an Okara-style SEO audit. **Find mistakes, fix them in code, build, push to GitHub.** Do not stop at a list. Do not break the sanctuary homepage or indigo brand CSS.

---

## Phase 1 — Infrastructure (do this session)

1. **Live check** — CSS loads on www; note apex → www redirect
2. **Create hub pages:** `/start-here/`, `/faq/`, enrich `/posts/`, `/categories/`, `/tags/` `_index.md`
3. **Port SEO partials** from `open_claw/qi-check/layouts/partials/` — adapt for Sparklebox Person schema + dark brand
4. **Update `config.toml`:** `baseURL` www, `homeTitle`, clean description (no ✨), `sameAs`, `ogImage`
5. **Add FAQPage** — 8 Q&As targeting perception/frequency citation gaps (see playbook)
6. **Schema:** `["BlogPosting", "Article"]` on all posts
7. **Menu:** add Start Here + FAQ
8. **`hugo --minify`** → commit → `git push origin main`

---

## Phase 2 — Cornerstones (same session if time)

Fix 5 cornerstone posts (descriptions, keywords, no duplicate H1): see playbook list.

---

## Phase 3 — defer unless asked

- 238 posts missing covers
- 181 posts missing descriptions  
Batch in follow-up sessions; hub + schema matters more for Okara-style wins.

---

## Do NOT

- Touch `hugo_site_new/`
- Replace sanctuary `_index.md` with NCR/QI homepage templates
- Copy NCR/QI `head.html` without preserving Sparklebox fonts/CSS
- Remove or truncate `assets/css/extended/custom.css`
- Use emoji in meta descriptions

---

## Push

```bash
cd ~/Desktop/Moving_sparklebox_blog/hugo_site
hugo --minify
git add -A
git commit -m "SEO: Okara hub pages, FAQPage, Article schema, config"
git push origin main
```

---

## Report

Use the template at the bottom of `../OKARA_SEO_AUDIT_PLAYBOOK.md`.
