# KanbanThing — Agent & Answer Engine Optimization

**Date:** 2026-08-02
**Branch:** `worktree-aeo+audit` (worktree, based on `master` @ a699b15)
**Scope:** Research and strategy. No source files changed.

Companion to `SEO-AUDIT.md`. That document covers ranking in Google. This one covers two
different things that are often conflated:

- **AEO** — being *named and cited* by ChatGPT, Perplexity, Claude, AI Overviews.
- **Agent optimization** — being *invokable* by an agent, so Claude or ChatGPT can create a
  board mid-conversation rather than just mention one.

They have almost nothing in common. The first is a distribution problem. The second is an
engineering problem. KanbanThing is badly positioned on the first and unusually well
positioned on the second.

## How this was verified

Three parallel research agents (citation mechanics, agent-facing technical surface, live
competitive recon), plus direct verification of every load-bearing claim from this machine:

- Production fetched with spoofed `GPTBot`, `ClaudeBot`, `PerplexityBot`, `OAI-SearchBot`
  and `Googlebot` user-agents.
- `npm registry` and npm search API queried directly for the `kanbanthing` package.
- `git rev-list --count origin/master..master` for the deploy gap.
- Response headers inspected for the CDN topology.
- `/.well-known/*`, `/mcp`, `/openapi.json`, `/llms.txt` probed for a baseline.

Claims are labelled **[VD]** vendor-documented, **[M]** measured (study or my own test),
**[SPEC]** speculation. Anything unlabelled is my own reasoning.

---

## The one finding that reframes everything

Seer Interactive, **541,213 LLM responses, 20 brands, 6 platforms, Feb 2026** **[M]**: a
brand's citation rate is **53.1% when the brand is named in the answer, 10.6% when it is
not**. Their model — supported by six behavioral tests across 362,188 responses — is that
the model selects which brands to name *from trained memory first*, then retrieves sources
to support them. Their phrase: *citations are the bibliography, not the brainstorm*.

The authors state their own limit plainly: this is "strongly supported behavioral evidence,
not proven architecture."

<https://www.seerinteractive.com/insights/llm-ghost-citations-why-your-content-is-working-and-your-brand-isnt>

**Consequence:** on-site copy cannot make an LLM *name* KanbanThing. Nothing in
`src/app/` is the lever. Being named is an off-site problem, and KanbanThing's off-site
footprint is close to zero (§2).

Corroborating: ranked "best-of" listicles are **~21% of all citations** and the single
most-cited content *type* (arXiv:2606.20065, 100,000+ prompt responses, 100+ brands,
4 engines, Mar–May 2026) **[M]**. In the same study, **household-name brands appear in 73%
of relevant answers, mid-market 44%, niche brands 11%.**

---

## 1. Three blockers that make everything else moot

Ordered. Each is verified, and each is a prerequisite for the item after it.

### 1.1 Production is running a stale build

`master...origin/master [ahead 89]` — verified **[M]**. Eighty-nine commits, including both
SEO merges, are unpushed and undeployed.

| URL | Live | Local `master` |
|---|---|---|
| `/guides`, `/guides/*` | **404** | 4 guide pages + hub |
| `/cli` | **404** | full CLI reference |
| `sitemap.xml` | old static file, **4 URLs**, apex host | `sitemap.ts`, **10 URLs**, www host |

The entire content surface the SEO work built — the long-tail pages an answer engine would
actually draw on — does not exist on the internet. Two of the seven target query clusters
(retrospectives, CLI) are lost purely to this.

**This is the cheapest action available and it gates everything below.**

### 1.2 The npm package does not exist

`https://registry.npmjs.org/kanbanthing` → **404**. npm search → `total: 0`. Verified **[M]**.

But [`src/app/cli/page.tsx:112`](src/app/cli/page.tsx) instructs `npm i -g kanbanthing`, and
`:117` instructs `npx kanbanthing`. Both fail today. Worse,
[`src/app/api/cli/stats/route.ts`](src/app/api/cli/stats/route.ts) polls npm for download
counts on that exact name, so the `/cli` page's stats widget will render a permanent zero.

**Deploying §1.1 without fixing this ships a page whose central instruction is broken.**

Second-order risk: an unclaimed npm name on a product that AI models are being told about is
a live **slopsquatting** target. Claim the name even if the CLI is not ready to publish.

### 1.3 The production RLS gap

Project memory records that in production, anon can currently read **every board plus
`password_hash`**, with lockdown gated on shipping the RPC-only client (Block B).

This is a hard prerequisite for the MCP server in §4 and nothing else. An authless MCP
server makes a latent data-exposure issue **agent-discoverable and tool-callable**. Close
Block B first.

---

## 2. Baseline: KanbanThing is invisible off-site

The complete inventory of third-party mentions in existence. This is the whole list:

| Source | Traction | Type |
|---|---|---|
| Hacker News `id=42414302` | 3 points, 4 comments, 2024-12-14, self-submitted | Self |
| Product Hunt | 14 upvotes, 1 comment (the maker), not featured, #28 that day | Self |
| Steemit/Steemhunt repost | — | Derivative |
| techbasedirectory.com | auto-generated | Directory |
| 5× GitHub PH-scraper repos | all in `producthunt-daily-2024-12-15.md` | Derivative |

Every single one traces to launch day, 2024-12-14. There is **no organic editorial coverage
at all.**

Verified absent **[M]**: AlternativeTo (searched — "no apps was found", and absent from the
183-item Trello alternatives page), Reddit, Slant, SaaSHub, G2, Capterra, and every
editorial roundup checked — including `smallmindmap.com`, which ranks #1 for the exact
positioning and lists five no-signup boards.

**The one real asset:** the domain already surfaces on its own page strength — roughly #5
for "simple online kanban board free", #8 for "free kanban board no signup", #8 for "kanban
board without account", #9 for "share a kanban board with a link". Completely absent from
retrospective, CLI, and Trello-alternative queries.

### The competitive set is not Trello

It is a dense cluster of near-identical no-signup micro-sites, most of which did not exist in
2024: `freekanban.com` (appeared in 4 of 7 queries — the most dominant), `kanban.fit`,
`kanbanapp.io`, `jotlu.com`, `kanbanquick.com`, `dyuvo.com`, `projoodle.com`,
`simplykanban.online`, `kanban.cx`, `getanban.com`, Small Trello, KanbanTab, Excaliban,
`publicboards.com`.

**Verified *not* competitors** (did not appear in any of the seven result sets, despite being
the obvious guesses): Vikunja, Planka, Notion, Kanri.

### The defensible corner

Most of that cluster is **localStorage-only** — the board is private to one browser and
cannot be shared. Only `kanban.cx`, `getanban.com`, `publicboards.com` and freekanban's
encoded links compete on link-sharing.

So KanbanThing's differentiator is not "no signup" — that's a crowded commodity. It is
**shared without signup**: send a link, they drag the same cards, nobody makes an account.
That maps exactly onto the already-written `/guides/read-only-board-links` page.

---

## 3. What the evidence says actually works — and what doesn't

This section exists because the two research streams **disagreed**, and the disagreement is
worth preserving rather than smoothing over.

### 3.1 Formatting is not a lever. The famous number is misquoted.

The single strongest causal evidence in the field is **arXiv:2605.25517** — a factorial
experiment, **252,000 trials, 6 LLMs, 18 factors**, brand-anonymized, counterbalanced order.
Its finding: **topical relevance and list position dominate; "formatting-only edits have
little impact."** **[M]**

The critical survey **arXiv:2607.14035** decomposes
`Pr(citation) = Pr(search activated) × Pr(retrieval) × Pr(citation | retrieved)` and states
that **no reviewed technique shows a stable, longitudinal, cross-platform causal effect** on
discoverability. Its confidence rating for "white-hat intervention improves organic
discoverability" is **Low**; for "citation predicts traffic/conversion", **Very low**.

It also corrects the "+40% GEO" figure everyone quotes: that is a **relative** gain for a
document *already placed in a five-document context window*, "often recast as a general
promise of ranking highly in ChatGPT," which it is not. It further cites evidence that
body-only optimization **reduced** top-20 retrieval presence ~9% and citation ~6%.

**Optimizing for citation can make you less retrievable.**

### 3.2 Tactics with no evidence behind them

Found no measured support for any of these, despite universal recommendation:

| Tactic | Status |
|---|---|
| Schema.org / JSON-LD to increase AI citation | Google states **no special structured data is needed** for AI Overviews or AI Mode. No controlled study found. |
| FAQ / Q&A page sections | Heavily recommended, **no isolated measurement exists**. |
| "Answer-first" writing as a *causal* lever | The 44.2%-of-citations-in-first-30% figure is **descriptive**, not interventional. |
| Comparison tables, bulleted lists | Falls under "formatting-only" — see §3.1. |
| Publishing more pages / "topical authority" | Ahrefs measured page count at **ρ=0.170** — effectively nothing. |
| Press releases | **Measured negative** (BuzzStream + Citation Labs, 3,600 prompts). |
| Citation → traffic → customers | Rated **"Very low"** confidence by the critical survey. |

**Resolution of the disagreement.** The competitive-recon stream recommended adding an FAQ
block, a comparison table and JSON-LD on the grounds that no competitor has schema, so it is
an "uncontested edge." The citation-mechanics stream says there is no evidence any of it
moves AI citation. Both are right about different things:

> **Do the schema and FAQ work — but justify it as SEO, not AEO.** `WebSite`/`Organization`
> schema is Google-documented for site-name selection (already `SEO-AUDIT.md` finding 7), and
> an FAQ earns its place by *covering long-tail sub-queries*, not because the markup or the
> Q&A shape does anything for an LLM. Claiming otherwise would be selling a story the
> evidence does not support.

### 3.3 What the evidence does support

| Finding | Evidence |
|---|---|
| **Aim at ChatGPT and Perplexity, not AI Overviews.** Brand-size bias is ~4× weaker on ChatGPT (ρ 0.15) than AI Overviews (ρ 0.65). ChatGPT allots ~15 citation slots per answer vs Gemini's 3. | **[M]** Ahrefs, ~957k ChatGPT / ~953k Perplexity prompts; Semrush AI Visibility Index |
| **Target long-tail sub-queries.** 60–68% of AI-Overview-triggering keywords have ≤100 monthly searches; query fan-out means sub-query SERPs get cited, not the head SERP. | **[M]** Semrush 10M+ keyword study; Ahrefs fan-out analysis |
| **Third-party listicles are the highest-leverage surface.** ~21% of all citations; niche brands appear in only 11% of relevant answers. | **[M]** arXiv:2606.20065 |
| **Review-site profiles** show the largest step-change measured — median citation 1% (no profile) → 53.5% (1–13 reviews). | **[M]** Seer, 804,491 responses — **but observational, no controls, almost certainly confounded by selection.** Cheap to test; do not treat the number as causal. |
| **Ranking top-10 is a weak, contested proxy.** Only 12% of AI-cited URLs rank top-10 (Ahrefs, 15k queries); ChatGPT in-text just 8%. Perplexity is the exception at 28.6%. | **[M]** — and note Ahrefs and BrightEdge measured **opposite trends** on this. Magnitude is genuinely disputed. |

### 3.4 Calibrate the prize

AI-referred traffic is **0.2% of all visits** (0.3% for software), growing **+632% YoY**,
converting at 1.3% — Contentsquare, **99 billion sessions across 6,500 websites** **[M]**.

The viral "AI traffic converts 4–23×better" claims are vendor aggregates; the 23× figure is
**n=1**, and the vendor promoting them concedes "larger samples tend to show smaller lifts."

**Worth a position. Not worth displacing anything that currently works.**

---

## 4. The agent surface — where the actual leverage is

This is the half of the problem KanbanThing is unusually well positioned for, and it is
almost entirely unexploited.

### 4.1 You are not blocked — verified

All of `GPTBot`, `ClaudeBot`, `PerplexityBot`, `OAI-SearchBot` and `Googlebot` receive
**HTTP 200 with the full 39,913-byte server-rendered document**, including a real `<h1>`,
nine `<h2>`s, and valid `SoftwareApplication`/`WebApplication` JSON-LD **[M]**. The homepage
answers directly in its first paragraph. `robots.ts` is permissive.

This is the failure mode that silently kills most AEO efforts. It is not happening here.

### 4.2 AI crawlers do not execute JavaScript

Vercel/Merj, instrumented `nextjs.org` plus Vercel's network over several months,
cross-validated against two other sites **[M]**: **no major AI crawler executes JavaScript.**
GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Meta, ByteDance and Perplexity bots fetch but
never run it. Exceptions: Applebot renders, Gemini inherits Google's infrastructure.

<https://vercel.com/blog/the-rise-of-the-ai-crawler>

Two consequences specific to this codebase:

- Anything an agent must read to recommend KanbanThing — the value prop, "no signup", "free",
  the 60-day lifespan, CLI instructions, the guides — **must be in the initial HTML**. Server
  Components give you this today; the risk is a future `'use client'` refactor silently
  moving copy behind hydration. `SEO-AUDIT.md` finding 3 is the same bug in its SEO form.
- **Claude's crawler spends 35.17% of its fetches on images.** Alt text and image filenames
  are load-bearing for ClaudeBot specifically, in a way they are not for GPTBot.

Also worth knowing: ChatGPT's crawler burns **34.82%** of its fetches on 404s and 14.36% on
redirects. Don't add avoidable hops — which is exactly what the apex-host sitemap in §1.1 does.

### 4.3 The Cloudflare trap — highest-severity item in this document

Verified **[M]**: production returns `Server: cloudflare`, `CF-RAY` and `cf-cache-status`
alongside `x-vercel-id`. **Cloudflare proxies in front of Vercel.**

Cloudflare is changing AI-crawler defaults on **2026-09-15**, splitting traffic into Search /
Agent / Training **[VD]**. The documented default is scoped to *pages that display ads*;
KanbanThing serves none, so on a plain reading it is unaffected. Third-party reporting claims
the sweep also covers existing free-plan customers — **I could not confirm that in
Cloudflare's own text.** Verify in the dashboard rather than trusting either reading.

The genuinely dangerous part is vendor-documented:

> "Since the defaults will be enforced by the most restrictive applicable rules, multi-purpose
> crawlers such as Googlebot, Applebot, and BingBot will be blocked by customers who have
> selected to block Training"

<https://blog.cloudflare.com/content-independence-day-ai-options/>

**Clicking "block AI training" in Cloudflare blocks Googlebot and removes the site from
Google Search entirely** — not just from AI features. If anyone ever toggles that thinking it
is a harmless ethical stance, the site disappears.

For a free, ad-free, no-signup product whose entire growth mechanism is being recommended,
**there is no revenue being protected by blocking training crawlers.** Training data is
precisely how a model learns that a free no-signup kanban board called KanbanThing exists.
Blocking training is a publisher strategy; here it is self-harm.

Related: Vercel's own bot rulesets are **off by default** **[VD]**, and Vercel documents that
bot detection is **unreliable behind a reverse proxy** — which you have. Enforce at one layer
(Cloudflare), and leave Vercel's AI-bots ruleset alone.

### 4.4 llms.txt is cargo cult — do not write one

Google's AI optimization guide, mythbusting section **[VD]**:

> "You don't need to create new machine readable files, AI text files, markup, or Markdown to
> appear in Google Search"

— and such files "will neither harm nor help your site's visibility or rankings in Google
Search, as **Google Search ignores them**."

<https://developers.google.com/search/docs/fundamentals/ai-optimization-guide>

John Mueller, Bluesky, 2025-06-17 **[VD]**: *"FWIW no AI system currently uses llms.txt."*

Three independent measurements of actual consumption, all near-zero **[M]**:

| Study | Method | Result |
|---|---|---|
| Ahrefs, Jun 2026 | 137,210 domains, requests classified by UA | **97% of existing llms.txt files got zero requests** in May 2026. Retrieval bots: 1.1%. *"Zero requests came from AI bots for llms.txt files that don't exist. They never go looking."* |
| Otterly.ai, Feb 2026 | single site, 90 days of logs | 62,100+ AI bot visits; **84 hit `/llms.txt` — 0.1%** |
| arXiv:2604.02544v2, Jul 2026 | purpose-built portal, 9 coding agents + 6 assistants, 3 trials | **0 of 15 tools requested it** |

SE Ranking analysed ~300,000 domains against citation frequency and found no relationship —
*"when we removed the LLMs.txt factor, the model's predictions actually improved."* **[M]**

The "Anthropic and Perplexity support it" claim is false: *serving* a file is not *consuming*
one. Adoption stats are inflated because Mintlify and Shopify auto-generate it for every
hosted site — most "adopters" made no decision.

Because bots never look for a file that does not exist, **there is no penalty for absence.**
Writing one buys a staleness liability for a measured return of zero.

**The one non-cargo-cult version:** markdown content negotiation via the `Accept` header. A
tracked matrix (last updated 2026-06-22) **[M]** finds Claude Code, Copilot Chat, Copilot CLI,
Cursor, Codex CLI and OpenCode *do* request markdown — while ChatGPT browse, Claude.ai,
Gemini, Grok and Perplexity are HTML-only. So it reaches **coding agents, not the consumer
chatbots you want recommending you.** Low priority, but it uses a 27-year-old HTTP mechanism
and degrades gracefully.

### 4.5 MCP — the highest-leverage build available

An MCP server is the difference between an agent *mentioning* KanbanThing and an agent
*creating a board for the user mid-conversation*. Nobody in the competitive set from §2 has
one.

**Authless is explicitly supported**, which matters enormously for a no-signup product:

- MCP spec: *"Authorization is OPTIONAL for MCP implementations."* **[VD]**
- Anthropic lists auth type `none` — "No authentication (authless server)" — as Supported **[VD]**
- OpenAI developer mode supports "OAuth, No Authentication, and Mixed Authentication" **[VD]**

The no-signup model is not a blocker. It is an advantage: zero auth friction is what gets a
tool adopted by an agent mid-task.

**Transport:** Streamable HTTP. Current spec revision is `2026-07-28`, which is a **breaking**
change (sessions removed, `initialize` replaced by stateless `server/discover`, new mandatory
headers) while deployed clients still largely speak `2025-06-18`/`2025-11-25`. **Use a Tier-1
SDK and let it negotiate. Do not hand-roll the transport.** **[VD]**

**Design constraints that are directory-blocking if got wrong** **[VD]**:

- A catch-all `api_request(method, path, body)` tool is **rejected outright** by Anthropic.
  Ship discrete tools: `create_board`, `get_board`, `list_cards`, `create_card`, `move_card`,
  `delete_card`.
- Every tool needs a `title` plus the applicable `readOnlyHint` / `destructiveHint`.
- Board handles must be securely random and expiring. The spec is explicit: servers *"MUST NOT
  treat possession of a state handle as authentication."* This is exactly why §1.3 gates this
  work — board IDs will end up in LLM transcripts and provider-side logs.

**Distribution, ranked by real leverage:**

| Tier | Channel | Gate |
|---|---|---|
| **1** | "Connect to Claude" prefilled install link + `claude mcp add --transport http` snippet on `/cli` | **None.** Custom connectors by URL work on Free/Pro/Max. Works today. |
| **1** | ChatGPT developer mode → Plugins → HTTPS MCP URL | **None.** Full read+write. |
| **2** | Official MCP Registry as `com.kanbanthing/kanban` | Domain proof via `public/.well-known/mcp-registry-auth` (one file — currently 404 **[M]**). Registry is **preview**, warns of data resets; automate republish in CI. Not consumed by hosts directly — it feeds aggregators. |
| **3** | Anthropic Connectors Directory | **Requires a Team or Enterprise org.** Not available on Pro/Max. This is the only channel with genuine organic acquisition — directory entries are eligible for **Suggested Connectors**, where Claude recommends your connector in-chat. |
| **3-alt** | Claude Code **plugin** via `platform.claude.com/plugins/submit` | Explicit carve-out for individual authors — no Team plan needed. Public GitHub repo required. Can bundle the remote MCP endpoint. **Cheapest legitimate route into Anthropic's ecosystem for a solo maintainer.** |
| **4** | OpenAI Plugins Directory | Verified developer identity + `/.well-known/openai-apps-challenge` + ≥5 positive/≥3 negative test cases + per-annotation justifications. Highest friction. Do last. |
| **5** | Smithery, Docker MCP Catalog | Real remote support. Glama/mcp.so/PulseMCP are SEO surfaces — near-zero direct traffic. |

**Registry count is a vanity metric.** None of tiers 2–5 route users into Claude or ChatGPT.
Tier 1 is the whole game for a technical audience.

**The differentiated version [SPEC]:** MCP Apps let a server return sandboxed interactive HTML
rendered inline in the conversation, supported across Claude web/Desktop, ChatGPT, Cursor and
VS Code Copilot **[VD]**. A drag-and-drop board rendered *inside* a Claude conversation would
be a genuinely distinctive listing in a directory full of text-only API wrappers — and it
reuses UI that already exists in this repo.

### 4.6 Things not to build

| | Why |
|---|---|
| Hand-written `llms.txt` | §4.4 — zero measured consumption, Google documents ignoring it |
| `/.well-known/mcp.json`, "server cards" | **Not standardized** — SEPs 1649, 1960, 2127 all still open. No major client reads it. |
| `/.well-known/ai-plugin.json` | Dead. The 2023 ChatGPT plugin manifest, superseded by MCP. |
| A2A Agent Card | Wrong protocol layer for a consumer tool. |
| WebMCP | Chrome-only origin trial, W3C Community draft **not on the Standards Track**, API renamed mid-trial. **Watch, don't build** — this is a 2027 decision. |
| Named `Disallow` groups for AI bots | robots.txt is most-specific-group-wins: adding `User-agent: GPTBot` **replaces** the `*` group wholesale. Classic accidental-delisting bug. |

---

## 5. Recommended plan

Ordered by (evidence strength × leverage) ÷ effort. Effort estimates are rough.

### Phase 0 — unblock (hours, and nothing else matters until done)

1. **Push and deploy the 89 commits.** §1.1. Unlocks `/guides`, `/cli` and a 10-URL sitemap.
2. **Claim `kanbanthing` on npm**, and either publish the CLI or change the `/cli` install
   instructions to match reality. §1.2. Must land *with* or *before* the deploy.
3. **Close the Block B RLS gap.** §1.3. Gates all MCP work.
4. **Check Cloudflare AI Crawl Control before 2026-09-15.** Confirm Search / Agent / Training
   are all Allow. **Never enable "block Training."** §4.3.

### Phase 1 — cheap and high-confidence (a day)

5. **Fix `baseUrl` to the www host** so the sitemap and robots directive stop serving a
   redirect to every crawler. Already `SEO-AUDIT.md` recommendation 1; §4.2 gives the
   AI-specific reason (ChatGPT burns 14.36% of fetches on redirects).
6. **Set up Bing Webmaster Tools → AI Performance** (launched 2026-02-10) **[VD]**. Free, and
   currently the most granular AI-citation telemetry that exists — grounding queries,
   page-level citation counts. Note client-side analytics **cannot** see AI crawler traffic,
   since they don't run JS (§4.2), so this is not optional instrumentation.
7. **Fix the GitHub repo homepage field** — it points at `kanban-thing.vercel.app`, not the
   real domain. The project's strongest backlink aims at the wrong host, and the Vercel
   subdomain surfaces as a duplicate-content competitor.

### Phase 2 — the distribution work (the actual bottleneck, weeks, ongoing)

This is where §0's evidence says the return is, and it is the least engineering-shaped work
in this document.

8. **AlternativeTo** — confirmed absent, ranks **#1** for "free trello alternative no
   registration", and appeared twice on the no-account query. It is itself a top-cited source.
   Free, account + manual review. Highest-ROI listing available.
9. **`aviaryan/awesome-no-login-web-apps`** — the canonical, heavily-forked, heavily-scraped
   no-login list. It contains **zero kanban entries** (grepped). Free PR. Same for
   `BraveOPotato/FckSignups`, whose `productivity` category also has none.
10. **SaaSHub, NoSignupTools, nosignup.tools, Slant** — all free, all confirmed absent.
11. **Update the existing Product Hunt page** rather than relaunching — add the six themes and
    the CLI, solicit a few reviews. It already ranks for the brand.
12. **Trustpilot profile.** The Seer step-change (1% → 53.5%) is confounded and I do not
    believe the magnitude, but the downside is a few hours. Treat as a cheap experiment.

**Explicitly not realistic:** Wikipedia (fails WP:NSOFT — no independent secondary coverage
exists per §2; self-adding would be a COI edit and reverted), and G2/Capterra (built for paid
B2B SaaS with seat-holders to review; a free no-account tool has none).

### Phase 3 — the agent build (days)

13. **Ship a Streamable HTTP MCP server** at `/mcp`, authless, thin over the existing Supabase
    RPCs, discrete tools with correct annotations. §4.5. *Blocked on step 3.*
14. **Add "Connect to Claude" + ChatGPT developer-mode snippets to `/cli`.** Tier 1
    distribution, zero approval. *Blocked on steps 1 and 13.*
15. **Publish to the official MCP registry** via `public/.well-known/mcp-registry-auth`.
16. **Submit a Claude Code plugin** via Console — the individual-author route into Anthropic's
    ecosystem.

### Phase 4 — content, justified honestly (ongoing)

17. **Add an FAQ and a Trello comparison to the homepage, and `WebSite`/`Organization` schema.**
    Justified as **SEO** (site-name selection is Google-documented) and as long-tail sub-query
    coverage — **not** as an AEO lever. §3.2.
18. **Reframe the guide headings toward query language.** The current copy is the best-written
    in the competitive set, but headings like "Sixty days, then the board is deleted" and "Six
    interfaces for the same board" match zero queries. Keep the prose; make the headings
    findable.
19. **Lean into "shared without signup"**, not "no signup" — §2. It is the one positioning the
    localStorage-only competitors cannot copy, and `/guides/read-only-board-links` already
    argues it.

---

## What I would not spend time on

- **Schema markup *for AEO purposes*.** Do it for SEO; don't expect AI citations from it.
- **More content volume.** Ahrefs measured page count at ρ=0.170. The four existing guides are
  fine; a fifth changes nothing.
- **llms.txt.** §4.4.
- **Chasing AI Overviews.** Brand-size bias there is ~4× stronger than on ChatGPT. An indie
  tool with no brand footprint loses that fight; ChatGPT and Perplexity are winnable.
- **Anything premised on AI traffic being large today.** It is 0.3% of software-sector visits.
  The +632% YoY growth is the reason to take a position now — not the current volume.
