# Welcome Page Redesign — Design Spec

**Date:** 2026-08-09
**Status:** Approved pending user review
**Scope:** `apps/web/app/page.tsx` and supporting files; app-wide price display; no schema changes.

## Context

The owner dislikes the current welcome page (category-tile grid with a large hero) and wants a
complete redesign modeled on **mymarket.ge**, Georgia's dominant classifieds site. The page must
serve buyers and sellers equally, be bilingual (Georgian default, English via switcher), and ship
to production (Vercel) for review.

Chosen direction (Option B of three mocked up): **mymarket-style, no sidebar** — header search,
horizontal category chips, dense listing grid, full-width seller band.

## Decisions

| Decision | Choice |
|---|---|
| Layout | mymarket-style, listings-first, no category sidebar |
| Audience | Buyers and sellers equally |
| Language | Georgian default, English via header switcher (ქარ \| EN), cookie-persisted |
| Translation scope | Welcome page only; rest of app stays English for now |
| Currency | **₾ everywhere** in the app (display only — no data change) |
| Deployment | Push to `main` → Vercel auto-deploy, owner checks production |

## Page structure (top to bottom)

1. **Header** — logo; rounded search input (form GET → `/marketplace?q=<term>`); green
   **+ Sell** button (→ `/register?role=seller` when logged out, `/dashboard` when logged in,
   same gating as the current "Start selling" CTA); language switcher; Log in / account link
   (preserve current logged-in header behavior).
2. **Category chip row** — all 15 fixed categories from `apps/web/app/lib/categories.ts` as
   horizontally scrollable icon chips. Chip shows Material Symbols icon + name + live count
   badge (badge hidden when count is 0). Click → `/marketplace?category=<slug>`. Reuses the
   existing `groupBy` count query from the current homepage.
3. **Listing grid** — "Fresh from the groups": newest active listings, up to 12, in a dense
   grid (4 per row desktop, 2 mobile). Card: image (existing placeholder fallback when no
   image), title (2-line clamp), bold price in ₾, `category · location` line, save-heart
   wired to the existing `toggleFavoriteAction` server action (same behavior as marketplace
   cards, including its current not-logged-in handling; the heart lives in a small client
   component since the page itself is a server component). "See all →" → `/marketplace`.
4. **Seller band** — full-width dark navy (`primary` token) rounded band: heading "Own a
   Facebook selling group?", one-line explanation, inline 3-step strip (1 Connect → 2 Approve
   → 3 Sold), mint (`secondary-container`) **Start selling** button with the same target as
   **+ Sell**.
5. **Footer** — slim single line: product description + copyright. Replaces the current footer
   block on this page.

Removed relative to today: the big hero ("Find it in your community" + centered search), the
15-tile category grid, the standalone "Sell from your Facebook group" text block.

## Internationalization (welcome page only)

- **Dictionary module** `apps/web/app/lib/i18n.ts`: `type Lang = 'ka' | 'en'`, a `strings`
  object with every welcome-page string in both languages, and `getLang(cookieValue)` that
  validates and defaults to `'ka'`.
- **Cookie** `lang` (`ka` | `en`), 1-year max-age, path `/`. The server component reads it via
  `cookies()` — the page is already `force-dynamic`, so per-request rendering is fine.
- **Switcher** — small client component in the header: two buttons (ქარ / EN); on click sets
  the cookie (`document.cookie`) and calls `router.refresh()`. Active language bolded.
- Category names: the fixed list in `categories.ts` gains an optional `nameKa` per entry, used
  when lang is `ka` (single source of truth stays in that file).
- Listing titles/descriptions render as stored — user content is not translated.
- No i18n framework, no locale routing, no middleware changes. When the rest of the app needs
  translation later, this dictionary is the seed.

## Currency (app-wide)

- **Helper** `apps/web/app/lib/format-price.ts`: `formatPrice(n: number): string` returning
  `"12,500 ₾"` (`n.toLocaleString('en-US')` + non-breaking space + `₾`, matching mymarket's
  number-then-symbol convention).
- Replace every `$…toLocaleString()` render site with the helper: `page.tsx` (new),
  `marketplace/page.tsx` (3 sites), `favorites/FavoritesClient.tsx`, `admin/page.tsx`,
  `dashboard/analytics/page.tsx`, `dashboard/moderation/page.tsx` (2 sites),
  `listing-detail/[id]/page.tsx` + `ListingDetailClient.tsx` (`formattedPrice`).
- Display-only: DB stores bare numbers; no migration. The AI parser's price extraction is
  untouched.

## Components & files

| File | Change |
|---|---|
| `apps/web/app/page.tsx` | Rewritten: new layout, reads lang cookie, uses dictionary |
| `apps/web/app/components/lang-switcher.tsx` | New client component |
| `apps/web/app/lib/i18n.ts` | New: Lang type, strings, getLang |
| `apps/web/app/lib/format-price.ts` | New: formatPrice |
| `apps/web/app/lib/categories.ts` | Add `nameKa` to each entry |
| Price render sites listed above | Swap to `formatPrice` |

Data flow is unchanged from the current homepage: one server component fetches category counts
and fresh listings via Prisma (`force-dynamic`), everything renders server-side except the
switcher and any existing client widgets.

## Error handling

- Unknown/tampered `lang` cookie → falls back to `ka`.
- Empty listing set → grid shows the existing "nothing here yet" empty state (translated).
- Count query failure behaves as today (page errors surface via the existing error boundary).

## Testing

- `tests/i18n.test.ts` — every key present in both languages; `getLang` fallback behavior.
- `tests/format-price.test.ts` — grouping, zero, large values, ₾ suffix.
- Existing test suite must stay green (`vitest`).
- Local smoke before deploy: run app via run-groupmarket skill, verify homepage renders in
  Georgian by default, switcher flips to English, prices show ₾ on homepage, marketplace, and
  listing detail.

## Deployment

Commit to `main`, push to GitHub → Vercel auto-deploys `fb-two-rho.vercel.app`. Owner reviews
production. (Direct-to-main is this repo's existing practice.)

## Out of scope

- Translating any page other than the welcome page.
- Currency conversion or storing currency in the DB.
- Locale-prefixed URLs (`/ka/…`), i18n middleware, or a framework.
- Redesign of marketplace/dashboard/admin pages.
