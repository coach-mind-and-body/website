# Search Performance Action Plan  
**Source:** GSC export 2026-08-10 (last 28 days)  
**Site:** mindandbodyresetcoach.com

## Snapshot (brutal honesty)

| Metric | Last 28 days |
|--------|----------------|
| Clicks | **0** |
| Impressions | ~60–70 total |
| Average position | mostly **20–50** |
| Top page | `/unicity` (32 imp) |
| Top query | `feel great system` (22 imp, pos ~33) |
| Brand-ish queries | `mind body coach`, `mind reset`, `body mind reset` (pos **2–4**, 1 imp each) |
| Content query | `how to calm food noise` (pos **97**, 1 imp) |

**Diagnosis:** This is not a “tweak a meta tag” problem alone. The domain has almost **no search footprint**. Google barely knows you exist for midlife health topics. Product keyword “feel great system” is the only real wedge. Brand phrases rank well when they appear but almost nobody searches them yet.

Technical SEO is already decent (sitemap, robots, canonicals, schema on key pages, 301s for legacy URLs). Ranking growth now depends on **(1) authority, (2) topical content depth, (3) external demand signals**.

---

## What we shipped in code (this session)

1. **`/unicity`** — Retitled/metadata for **“Feel Great System”** (your only volume query). Expanded on-page FAQ + educational copy + internal links to food noise, insulin, reclaim.
2. **Homepage** — Title/description target **mind body coach / women over 40**; hero support line with keywords.
3. **`/reclaim`** — Title/description toward **1:1 health coaching for women over 40** (intent > acronym).
4. **Blog index** — Metadata mentions food noise, cravings, insulin (query clusters you want).
5. **Food noise post** — SEO title/description aligned to **how to calm food noise**.
6. **Organization schema** — YouTube (+ Facebook if valid) on `sameAs`.
7. **Sitemap lastmod** refreshed for money pages.

Deploy these changes, then in GSC: **URL Inspection → Request indexing** for:

- `https://mindandbodyresetcoach.com/unicity`
- `https://mindandbodyresetcoach.com/`
- `https://mindandbodyresetcoach.com/health-wellness-blog/calming-food-noise-drop-the-food-courtroom`
- `https://mindandbodyresetcoach.com/why-am-i-gaining-weight-after-40-even-when-i-eat-less` (blog path under `/health-wellness-blog/...`)
- `https://mindandbodyresetcoach.com/insulin-resistance-after-40`
- `https://mindandbodyresetcoach.com/sitemap.xml` (resubmit sitemap if needed)

---

## Priority ranking opportunities (next 90 days)

### P0 — Double down on what already gets impressions

| Query / page | Action |
|--------------|--------|
| **feel great system** → `/unicity` | Keep content expanding: comparisons, how-to, FAQs, midlife angle. Earn reviews/testimonials on-page. Link from Instagram/YouTube descriptions. Goal: pos 33 → top 15. |
| **Brand variants** (mind body coach, mind reset) | Consistent NAP + Google Business Profile. YouTube channel name, IG bio, podcast titles all match **Mind and Body Reset**. |

### P1 — Content that can win mid-tail (women 40+)

Publish / refresh **one strong article every week** aimed at questions, not brand:

1. How to calm food noise after 40 *(exists — expand to 2,000+ words, FAQ, video embed)*  
2. Why am I gaining weight after 40 even when I eat less? *(exists — promote)*  
3. How to stop sugar cravings at night after 40 *(exists — promote)*  
4. Insulin resistance symptoms women over 40 *(hub exists — add FAQ + more internal links)*  
5. Exercise snacks / afternoon snacking after 40 *(exists)*  
6. Life after GLP-1 food noise *(page exists — expand)*  
7. Perimenopause belly / menopause belly patterns *(new angle from podcast)*  
8. Is it anxiety or perimenopause? *(exists)*  

**Format rule:** Question title → direct answer in first 100 words → H2s that match People Also Ask → FAQ schema → CTA to quiz or clarity call → internal links to reclaim + insulin + related posts.

### P2 — Distribution (this moves SEO more than another plugin)

Without links and brand searches, positions stay stuck.

| Channel | Weekly minimum |
|---------|----------------|
| **YouTube** | Full episode + chapters; description links to blog + show notes URL |
| **Email** | Every blog → list; one CTA |
| **Instagram** | 3–5 posts/reels pointing to one URL (not just “link in bio”) |
| **Pinterest** | Pin every blog cover with keyword title (midlife women search here) |
| **Podcast directories** | Apple/Spotify if not fully distributed — each episode is a searchable asset |
| **Google Business Profile** | If serving Utah / remote coaching: categories Health coach, Life coach; weekly posts; website link |
| **Guest / collab** | 1 midlife health podcast appearance per month |

### P3 — Technical hygiene (ongoing)

- Keep **legacy 301s** (already in `next.config.mjs` + middleware).  
- Do **not** noindex money pages.  
- Fix soft 404s / junk (`/$`, encoded disclaimer) — already addressed.  
- Prefer **one URL** per topic (canonical).  
- OG images: use 1200×630 unique images per money page when possible (logo square is weak for social CTR).  
- Core Web Vitals: watch LCP on blog images (use CDN, proper `width`/`height`, lazy mid-article).

---

## What will *not* fix this

- Buying random backlinks  
- Stuffing more keywords into the footer  
- Publishing 30 thin AI posts in a week  
- Obsessing over GSC “indexed” count while producing no external demand  

---

## 30 / 60 / 90 day targets

| Window | Target |
|--------|--------|
| **30 days** | 200+ impressions/week; `/unicity` average position ≤ 20; food-noise post ≤ 40 |
| **60 days** | First organic clicks (not zero); 3 pages with 50+ impressions |
| **90 days** | 500+ impressions/week; ranking top 10 for 1–2 mid-tail queries (food noise, night cravings, or feel great system + coach) |

Measure only **clicks + impressions + position** in GSC (Web, last 28 days). Ignore vanity tools until you clear 100 clicks/month.

---

## Owner checklist (this week)

- [ ] Deploy site SEO changes  
- [ ] Request indexing for top 5 URLs in GSC  
- [ ] Update YouTube video descriptions with full URLs  
- [ ] Claim/optimize Google Business Profile  
- [ ] Expand food-noise article + re-promote  
- [ ] Schedule next 4 question-title blog posts from P1 list  
- [ ] Add unique OG image for `/unicity` and homepage if design bandwidth allows  
