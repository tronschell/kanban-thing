# KanbanThing SEO Audit

**Date:** 2026-08-02
**Branch:** `seo/audit` (worktree, based on `rebuild/opus5-overhaul`)
**Scope:** Analysis only. No source files were changed.

## How this was verified

- Every route's source read directly in this worktree.
- Live HTML pulled from production with `curl` (raw HTML, no JS execution) for `/`, `/about`, `/onboarding`, `/terms`, `/robots.txt`, `/sitemap.xml`, plus header-only requests to check status codes and redirects on the apex host, the `www` host, `/board`, a trailing-slash URL, and a nonexistent URL.
- Homepage JS payload measured by extracting every `_next/static/chunks` URL from the shipped HTML and downloading each with `Accept-Encoding: identity`.
- `npx next build` was attempted and **failed in the worktree** with a Turbopack workspace-root error (`next/package.json` not resolvable from `src/app`, because `node_modules` lives in the parent repo and `next.config.ts:6` pins `turbopack.root` to `__dirname`). This is a worktree artifact, not a production bug — production builds fine. Static/dynamic classification below is inferred from source, not from build output.

### One correction to the audit brief

The brief states that `'use client'` at the top of a route means "content may not be in the initial HTML." That is not true in the App Router: client components are still server-rendered on the initial request. Verified — `https://www.kanbanthing.com/` ships the `<h1>`, all five `<h2>`s, and 609 words of body text in the raw HTML despite `src/app/page.tsx:1` being `"use client"`. The landing page's *content* is fine.

The real cost of `"use client"` on `src/app/page.tsx` is different and worse: **a client component cannot export `metadata`**, so the homepage silently loses its canonical tag and `og:url`. See Finding 2.

---

## Findings

| # | Issue | Where | Why it matters | Evidence |
|---|---|---|---|---|
| 1 | **Every canonical tag and every sitemap URL points at a host that 308-redirects.** Production's real host is `https://www.kanbanthing.com`; `https://kanbanthing.com/` returns `308 → https://www.kanbanthing.com/`. But `baseUrl` is hardcoded to the apex. | `src/lib/metadata.ts:3`, `src/app/layout.tsx:25`, `public/sitemap.xml:4,9,14,19`, `public/robots.txt:5` | Redirects and `rel=canonical` are *both* strong canonicalization signals, and here they point in opposite directions. Google resolves it, but the site is spending every canonical signal it has arguing against its own server config. Sitemap URLs are also all non-canonical. | [Consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) — "Redirects are a strong signal that the target of the redirect should become canonical, and rel="canonical" link annotations are a strong signal that the specified URL should become canonical… Pick a canonical URL for each of your pages and submit them in a sitemap." |
| 2 | **The homepage has no canonical tag and no `og:url` at all.** Verified live: zero occurrences of `canonical` in the www homepage HTML. Cause: `page.tsx` is a client component, so it cannot export `metadata`, and the root layout (`layout.tsx:18-37`) never sets `alternates.canonical`. | `src/app/page.tsx:1`, `src/app/layout.tsx:18-37` | The homepage is the single most valuable URL on the site and the only one with no canonical declaration. Combined with Finding 1 (both hosts serving, apex redirecting) this is where a canonicalization mistake costs the most. | Same doc as above; canonical is "A strong signal that the specified URL should become canonical." |
| 3 | **`/onboarding` is indexable, canonicalized, linked from every CTA on the site — and ships a completely empty `<body>`.** Measured: 14,480 bytes of HTML, **0 words** of body text. `UserOnboarding` is client-only inside `<Suspense>` whose fallback is a `<Spinner>`, which renders no text. No `<h1>`. | `src/app/onboarding/page.tsx:7-12` (index/follow + canonical), `:16-20` (Suspense/Spinner) | This is a soft-404 candidate: 200 status, indexable, zero server-rendered content. It is also the destination of the primary CTA on the landing page (`page.tsx:126,148,443`). Google queues it for rendering, but an empty pre-render page competing for "create kanban board" queries is the weakest possible entry point. | [Fix search-related JavaScript problems](https://developers.google.com/search/docs/crawling-indexing/javascript/fix-search-javascript) — "If the rendered page is blank, nearly blank, or the content has an error message… it could be that your page references many resources that can't be loaded." |
| 4 | **Brand name appears twice in every non-homepage title.** The root template is `'%s \| KanbanThing'` but each page's own title already ends in `- KanbanThing`. Live titles: `About KanbanThing - Simple Kanban Board Tool \| KanbanThing`, `Create a Board - KanbanThing \| KanbanThing`, `Terms of Service - KanbanThing \| KanbanThing`, `Privacy Policy - KanbanThing \| KanbanThing`. | `src/app/layout.tsx:21` (template) vs `about/page.tsx:7`, `onboarding/page.tsx:8`, `terms/page.tsx:7`, `privacy/page.tsx:7` | Wastes title-link pixels on a duplicated brand token, and pushes the descriptive part past the SERP truncation point. Google explicitly calls out boilerplate/repeated branding. | [Influencing your title links](https://developers.google.com/search/docs/appearance/title-link) — recommends the site name "only at the beginning or end of titles with a delimiter… rather than repeating it," and warns "Long text in the `<title>` element that varies by only a single piece of information ('boilerplate' titles) is also bad." |
| 5 | **No Open Graph or Twitter image exists anywhere on the site.** `public/` contains only `robots.txt`, `sitemap.xml` and four unused Next.js starter SVGs. `src/app/Screenshot.png` exists but is referenced by nothing (`grep -rn "Screenshot" src/` → no hits). Meanwhile `metadata.ts:35` declares `twitter: { card: 'summary_large_image' }` with no image to fill it. | `src/lib/metadata.ts:27-38`, `src/app/layout.tsx:26-29`, `public/` | The product's entire growth model is "send the link to anyone." Every one of those shares — Slack, X, Bluesky, Discord, LinkedIn — renders as a bare text card. `summary_large_image` with no image is a declared-but-unfulfilled card. | Mechanism is certain (OG image is what social unfurlers render); **no published effect size verified** — see Unverified section. |
| 6 | **`SoftwareApplication` JSON-LD is ineligible for the Software App rich result** — it has no `aggregateRating` and no `review`, which Google lists as required. | `src/app/page.tsx:20-50` | The structured data is currently doing nothing for search appearance. Worth knowing before investing more in it. **Do not fabricate a rating to fix this** (see Recommendation 6). | [Software App structured data](https://developers.google.com/search/docs/appearance/structured-data/software-app) — required properties are `name`, `offers.price`, and one of `aggregateRating` / `review`. |
| 7 | **No `WebSite` or `Organization` structured data on the homepage**, so Google's site-name selection is entirely inferred. | `src/app/page.tsx:20-50` | Site name is what appears above the title link on every SERP result for the domain. Google names `WebSite` structured data as the primary lever. | [Site names in Google Search](https://developers.google.com/search/docs/appearance/site-names) — "`WebSite` structured data is most important, if you want to specify a preference." |
| 8 | **Sitemap is stale and uses ignored fields.** Missing `/onboarding` (indexable, canonicalized, no `noindex`). Uses `<priority>` and `<changefreq>` on all four entries. No `<lastmod>` anywhere. | `public/sitemap.xml:1-24` | Two of the three tags used are discarded by Google; the one that is actually read is absent. Combined with Finding 1, all four listed URLs also redirect. | [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) — "Google ignores `<priority>` and `<changefreq>` values." Google "uses the `<lastmod>` value if it's consistently and verifiably… accurate." |
| 9 | **The marketing homepage ships ~943 KB of raw JS (~300 KB compressed) across 13 chunks**, before AdSense and GA. Measured chunk contents include dnd-kit (138 KB raw) and Radix UI (116 KB raw) — Radix arrives only because `src/components/ui/index.ts` is a barrel that re-exports `Modal`, `DropdownMenu`, `Select`, `Sheet` and `Tooltip`, while the landing page imports just `Button` and `Badge` from it. | `src/components/ui/index.ts:1-18`, `src/app/page.tsx:15-16`, `src/components/demo-board.tsx:26` | INP and LCP are ranking-relevant, and third-party + framework JS on the main thread is the dominant cause of poor INP. This is a static marketing page whose only genuinely interactive element is the demo board. | [Core Web Vitals thresholds](https://web.dev/articles/vitals) — LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, at the 75th percentile. [Page experience](https://developers.google.com/search/docs/appearance/page-experience) — "Core Web Vitals are used by our ranking systems," though "There is no single signal." |
| 10 | **AdSense loader is a synchronous tag in `<head>`, plus an `admaven-placement` meta.** It is `async` so it does not block parsing, but it executes on the main thread during load and injects ad slots with no reserved space. | `src/app/layout.tsx:51-53` | Ad injection without reserved dimensions is the classic CLS cause, and third-party script execution is the classic INP cause. Both are Core Web Vitals. | [Core Web Vitals](https://web.dev/articles/vitals) for thresholds; [Web Almanac 2024 – Third Parties](https://almanac.httparchive.org/en/2024/third-parties). **No site-specific field measurement** — see Unverified. |
| 11 | **Only 4 indexable pages exist** (`/`, `/about`, `/terms`, `/privacy` — plus `/onboarding`, which is indexable but empty). `/boards` is correctly `noindex` (`boards/page.tsx:13`). | `public/sitemap.xml`, route tree | There is essentially no surface area to rank for anything except brand and one head term. This is the ceiling on impressions, and no amount of metadata fixing raises it. | [Crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable) — Google discovers pages via `<a href>` links; [sitemaps doc](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) for the secondary discovery path. |
| 12 | **`/board` is `Disallow`ed in robots.txt but serves `<meta name="robots" content="index, follow">`** and the generic homepage title. | `public/robots.txt:3`, `src/app/(main)/board/page.tsx:1-19` (client-only, inherits root metadata) | A robots.txt-blocked URL can still be indexed URL-only if something links to it, and the blocking prevents Google from ever reading the `index, follow` meta. Low practical risk here (boards are unlisted and password-gated), but the two signals contradict each other. | [Consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) — "Don't use the robots.txt file for canonicalization purposes." |
| 13 | **Invalid schema.org types on `/privacy` and `/terms`.** `PrivacyPolicy` and `TermsAndConditions` are not schema.org types — both `https://schema.org/PrivacyPolicy` and `https://schema.org/TermsAndConditions` return HTTP 404. | `src/app/privacy/page.tsx:17`, `src/app/terms/page.tsx:17` | Undefined `@type` values are ignored. Harmless, but it is dead markup on pages that will never earn a rich result anyway. | Verified directly: both URLs return 404 from schema.org. |
| 14 | **`keywords` meta tag is emitted.** | `src/app/layout.tsx:19` | No effect on Google ranking or indexing. Not harmful — listed only so it is not mistaken for working SEO. | [Google does not use the keywords meta tag in web ranking](https://developers.google.com/search/blog/2009/09/google-does-not-use-keywords-meta-tag) |

---

## Recommendations, ranked by expected impact

### 1. Fix the host mismatch — pick `www` and make every signal agree
**Effort: 30 minutes.**

Production serves `https://www.kanbanthing.com`; the apex 308-redirects to it. Either move the redirect (www → apex) or, far simpler, accept www as canonical and update the code to match.

Files:
- `src/lib/metadata.ts:3` — `baseUrl` → `https://www.kanbanthing.com`
- `src/app/layout.tsx:25` — `metadataBase` fallback → same
- `public/sitemap.xml:4,9,14,19` — all four `<loc>` values
- `public/robots.txt:5` — `Sitemap:` line
- `NEXT_PUBLIC_BASE_URL` env var in the deployment, if set

**Why first:** it is the cheapest fix on the list and it is currently making four separate systems (canonicals, OG URLs, sitemap, robots) all point at redirecting URLs. Evidence: [Consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) — redirects and `rel=canonical` are both described as strong signals, and the doc's explicit instruction is to submit *canonical* URLs in the sitemap.

### 2. Give the homepage a canonical tag
**Effort: 20 minutes.**

`src/app/page.tsx` is `"use client"` and therefore cannot export `metadata`. Two options:

- **Preferred:** split the file — keep a server `page.tsx` that exports `metadata` (with `alternates.canonical`, `openGraph.url`) and renders a `"use client"` `landing.tsx` containing the current component tree. The JSON-LD block (`page.tsx:55-58`) should move to the server component too.
- **Minimum:** add `alternates: { canonical: '/' }` to the root `metadata` in `src/app/layout.tsx:18-37`. This is one line but it applies the canonical to every route that doesn't override it — acceptable here only because every other route already sets its own via `generateMetadata`. Verify `/board` and `not-found` behavior if you take this path.

Files: `src/app/page.tsx`, possibly a new `src/app/landing.tsx`, or `src/app/layout.tsx`.

**Why:** the homepage is the only URL on the site with no canonical declaration, on a domain that resolves on two hosts. Evidence as above.

### 3. Make `/onboarding` render real content server-side — or de-index it
**Effort: 1–3 hours depending on route taken.**

Right now it is a 200-status, indexable, canonicalized page with a literally empty `<body>`.

Pick one:
- **If it should rank** (it targets "create a kanban board", a genuine query): server-render a real `<h1>` and a short paragraph of copy above the client form. The heading and intro text can live in the server `page.tsx`; only the interactive form needs `"use client"`. Also add it to `sitemap.xml`.
- **If it shouldn't rank** (defensible — it's a form, not content): add `robots: { index: false, follow: true }` to `src/app/onboarding/page.tsx:7`, matching what `boards/page.tsx:13` already does.

Files: `src/app/onboarding/page.tsx`, `src/components/user-onboarding.tsx`, `public/sitemap.xml`.

**Why:** Google's own troubleshooting guidance flags blank/near-blank rendered pages as a soft-404 signal. A page with zero pre-rendered content is the worst possible landing target for the CTA that every other page funnels into. Evidence: [Fix search-related JavaScript problems](https://developers.google.com/search/docs/crawling-indexing/javascript/fix-search-javascript).

### 4. Build 4–6 real content pages, discoverable without touching the footer
**Effort: the largest item — roughly a day of writing per page, plus ~2 hours of routing.**

This is the only recommendation that raises the impression ceiling. With four indexable pages the site can rank for brand plus approximately one head term; there is nothing to match long-tail intent against.

Candidate pages, all of which describe things the product genuinely does (so no thin-content risk):
- Kanban board for a specific workflow (e.g. sprint planning, content calendar, personal to-do) — the demo board data in `src/components/demo-board.tsx:44-60` is already written around real card examples
- "Kanban board without sign-up" — the actual differentiator, and the exact phrasing of the H1
- Board sharing / collaboration without accounts
- Export your board (JSON/CSV) — a real feature mentioned at `src/app/page.tsx:417`

#### Crawl-discovery path (the footer constraint)

The owner's constraint is no footer link pile. Here is the full discovery path with **zero new footer links**:

1. **One hub page**, `/guides` (or `/kanban`), listing all the new pages with descriptive anchor text. This is the only new navigational surface.
2. **The hub is linked exactly once from a non-footer location** — the header `<nav>` in `src/app/page.tsx:109-128`, alongside the existing About link. One link, one word, in the nav that already exists.
3. **Contextual in-content links** from copy that already exists:
   - `src/app/page.tsx:341-364` — the `Feature` cards. "Share by link", "Columns and a backlog", "Calendar and timeline" each map onto a guide; wrap the relevant phrase in a `<Link>`.
   - `src/app/about/page.tsx:67-83` — the "What it does" `<ul>`. Each bullet already names a feature; link the ones with a corresponding guide.
   - `src/app/page.tsx:414-419` — the export sentence in the Lifespan section links naturally to an export guide.
4. **Every new URL added to `public/sitemap.xml`** with an accurate `<lastmod>`.
5. **Breadcrumbs on each guide** — a crawlable `<a>` back to `/guides` and `/`, plus `BreadcrumbList` JSON-LD. This gives each leaf page a second inbound internal link and a return path.

Nothing needs to go in the footer. Google discovers pages through `<a href>` links and through sitemaps, and both paths are fully covered by steps 1–5. Evidence: [Crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable) — "Google can only crawl your link if it's an `<a>` HTML element with an `href` attribute," and anchor text "tells people and Google something about the page you're linking to." [Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) for the secondary path.

**Do not add `FAQPage` schema to these.** In August 2023 Google restricted FAQ rich results to "well-known, authoritative government and health websites"; for every other site the rich result is no longer shown. Adding it would be effort with no search-appearance payoff. Evidence: [Changes to HowTo and FAQ rich results](https://developers.google.com/search/blog/2023/08/howto-faq-changes) (Aug 8, 2023).

**Effect size: mechanism-only, no published effect size.** More indexable pages targeting distinct queries can only produce more impressions than four pages can, but I found no credible study quantifying it for a site of this profile, and I am not going to invent one.

### 5. Ship an OG image
**Effort: 2 hours.**

The product's distribution *is* link sharing, and every shared link currently unfurls as plain text. `metadata.ts:35` already promises `summary_large_image` with nothing behind it.

Files:
- Add `src/app/opengraph-image.tsx` (Next's file convention — generates at build time, applies site-wide) or a static `public/og.png` at 1200×630
- `src/lib/metadata.ts:27-38` — add `images` to the `openGraph` block, or delete the manual `twitter.card` line and let the file convention populate both
- `src/app/layout.tsx:26-29` — add `images` so the homepage inherits it

The demo board at `src/components/demo-board.tsx` is the obvious visual — and note the site currently has **no images at all** (`grep` for `next/image` and `<img>` across `src/` returns nothing), so this is also the only image asset decision to make.

**Effect size: mechanism-only, no published effect size verified.** OG images are unambiguously what social unfurlers render, and this affects no Google ranking signal. I did not find a methodologically sound public study quantifying CTR lift, so I am not quoting one.

### 6. Fix the titles; add `WebSite` schema; leave `SoftwareApplication` alone
**Effort: 45 minutes.**

- **Titles:** strip the redundant brand from each page's own title so the root template supplies it exactly once. Change `about/page.tsx:7` to `"About"`, `onboarding/page.tsx:8` to `"Create a board"`, `terms/page.tsx:7` to `"Terms of Service"`, `privacy/page.tsx:7` to `"Privacy Policy"`. The template at `layout.tsx:21` then produces `About | KanbanThing` instead of `About KanbanThing - Simple Kanban Board Tool | KanbanThing`. Evidence: [Influencing your title links](https://developers.google.com/search/docs/appearance/title-link).
- **`WebSite` schema:** add a `WebSite` object (`name`, `url`) to the homepage JSON-LD at `src/app/page.tsx:20-50`. Evidence: [Site names](https://developers.google.com/search/docs/appearance/site-names) — "`WebSite` structured data is most important, if you want to specify a preference."
- **`SoftwareApplication`:** it is currently ineligible for the rich result because it has no `aggregateRating` or `review`. **Do not add a self-authored rating.** Google's structured data policies state that "reviews or ratings not by actual users may result in manual action." Either collect genuine user reviews first, or accept that this block is informational-only and leave it. Evidence: [Structured data general guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies), [Software App](https://developers.google.com/search/docs/appearance/structured-data/software-app).

### 7. Trim the landing page's JS
**Effort: 2–4 hours.**

Measured: ~943 KB raw / ~300 KB compressed across 13 chunks on a static marketing page.

- **Cheapest win:** stop importing from the `src/components/ui/index.ts` barrel on the landing page. `src/app/page.tsx:15` imports `{ Button }` and `src/components/demo-board.tsx:26` imports `{ Badge }`; both should import from `./ui/button` and `./ui/badge` directly. That alone should drop the ~116 KB Radix chunk (Modal/DropdownMenu/Select/Sheet/Tooltip) off the landing page. Verify with a build before and after.
- **Bigger win:** `next/dynamic` the `DemoBoard` (`src/app/page.tsx:157`) so the ~138 KB dnd-kit bundle loads below the fold instead of on first paint.
- **Optional:** the `Reveal` wrapper (`page.tsx:73-93`) pulls framer-motion in for a 12px fade. A CSS `@keyframes` with `animation-timeline` or an `IntersectionObserver` would remove the dependency from this route entirely.
- **Ad script:** reserve explicit height for ad slots to avoid CLS from injection.

Evidence: [Core Web Vitals](https://web.dev/articles/vitals) — LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at p75. [Page experience](https://developers.google.com/search/docs/appearance/page-experience) — "Core Web Vitals are used by our ranking systems." Ranked 7th deliberately: Google is explicit that "There is no single signal" and that page experience does not override relevance, so this is worth less than having pages to rank in the first place.

### 8. Sitemap hygiene
**Effort: 15 minutes.**

In `public/sitemap.xml`: drop `<changefreq>` and `<priority>` (both ignored by Google), add accurate `<lastmod>` values, add `/onboarding` if Recommendation 3 makes it indexable, and switch all `<loc>` values to the canonical host per Recommendation 1. Evidence: [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

### Deliberately not recommended

- **Alt text as a headline item** — there are no images in the codebase at all. Nothing to fix.
- **`FAQPage` schema** — dead for non-government/health sites since Aug 2023 ([source](https://developers.google.com/search/blog/2023/08/howto-faq-changes)).
- **Removing the `keywords` meta** (`layout.tsx:19`) — it does nothing, but it also costs nothing. Delete it if you're in the file anyway.
- **Fixing the invalid `PrivacyPolicy` / `TermsAndConditions` schema types** (Findings 13) — genuinely invalid, but on two pages that will never earn a rich result. Delete the blocks rather than fixing them, whenever those files are next touched.
- **Adding a `noindex` to `/board`** — robots.txt already blocks crawling, boards are unlisted and password-gated, and nothing links to them. The contradictory signal (Finding 12) is cosmetic here.

---

## Could not verify / no evidence found

Listing these explicitly rather than filling the gaps with plausible-sounding numbers.

1. **No Core Web Vitals field data for this site.** The PageSpeed Insights API returned `Quota exceeded for quota metric 'Queries'` without an API key, so I have **no CrUX field data and no Lighthouse lab run** for kanbanthing.com. The ~943 KB JS figure in Finding 9 is a direct measurement I made and is reliable; the *consequence* for LCP/INP/CLS on real devices is inferred, not measured. **Run PageSpeed Insights manually before treating Recommendation 7 as urgent** — if the site already passes CWV at p75, that recommendation drops several places.

2. **No effect size for OG images on share CTR.** The mechanism is certain; I found no methodologically sound public study quantifying the lift, and vendor blog numbers are not citable. Labeled mechanism-only in Recommendation 5.

3. **No effect size for "add N content pages."** Recommendation 4 is grounded in Google's crawl/discovery documentation, not in a published study of impression growth for utility sites. Labeled mechanism-only.

4. **No Search Console data.** I have no impressions, clicks, average position, indexed-page count, or Coverage report. That means I cannot confirm whether `/onboarding` is *actually* flagged as a soft 404, whether both hosts are actually indexed, or which queries the site currently earns impressions on. **All prioritization here is based on code and shipped HTML only.** Fifteen minutes in Search Console would either confirm or reorder this list, particularly Findings 1, 2 and 3.

5. **Build output not obtained.** `npx next build` fails in this worktree with a Turbopack workspace-root error (see "How this was verified"). Static vs. dynamic rendering per route is inferred from source. The one thing this would have settled definitively is which routes are prerendered at build time; the live HTML checks cover the SEO-relevant part of that question.

6. **Third-party script impact not isolated.** Finding 10 asserts AdSense affects CWV via known mechanisms (unreserved ad injection → CLS; main-thread execution → INP). I did not measure the ad script's actual contribution on this site, and the Web Almanac citation is a general-population finding, not a KanbanThing measurement.

7. **FAQ rich results — current status as of Aug 2026 not re-confirmed.** The August 2023 restriction is verified from Google's own blog. Search results surfaced third-party claims of a further FAQ deprecation in 2026 that I did not confirm against a primary Google source. Either way the recommendation is unchanged: don't add FAQ schema.

8. **`aggregateRating` feasibility.** Recommendation 6 says collect genuine reviews. Whether KanbanThing has any mechanism to do that, or any reviews to collect, I have no way to assess from the codebase.
