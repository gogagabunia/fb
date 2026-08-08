# Three-role marketplace: admin, seller, buyer

**Date:** 2026-08-08
**Status:** Approved by owner (sections reviewed one by one in session)

## What this changes

GroupMarket today has one kind of registered user: everyone who signs up can
add Facebook groups, sync them, and moderate posts. The homepage is a static
marketing page. Categories are free text typed at approval time.

After this change there are three roles, the homepage is a category discovery
page, and categories are a fixed list. All existing data is deleted first —
the owner asked for a clean start.

## Decisions made with the owner

| Question | Decision |
| --- | --- |
| How does someone become a seller? | They choose Buyer or Seller on the register form. No approval step. |
| Who defines categories? | A fixed list in code. |
| Is browsing public? | Yes — no account needed to view anything. |
| Admin panel scope | Everything: users, all listings, all sellers' moderation queues. |
| Existing accounts | Deleted, along with all groups, posts, listings. Clean slate. |
| Admin account | `gabuniagoga19@gmail.com`, via `ADMIN_EMAIL` env var. |
| Flexibility | Role checks centralized so rules can change without touching call sites. |

## Roles

`Role` enum becomes `ADMIN | SELLER | BUYER` (replacing `ADMIN | USER`).

| Area | Public | BUYER | SELLER | ADMIN |
| --- | --- | --- | --- | --- |
| Homepage, category pages, listing detail | ✔ | ✔ | ✔ | ✔ |
| Favorites | — | ✔ | ✔ | ✔ |
| Dashboard, add-group, connect-facebook, moderation | — | — | own only | all |
| Admin panel (`/admin`) | — | — | — | ✔ |

- The register form gains the Buyer/Seller choice; Buyer is the default.
- A registration whose email equals `ADMIN_EMAIL` (case-insensitive) becomes
  ADMIN regardless of the chosen option.
- Role is read from the database on every protected server action and layout —
  never from the client, never from the JWT. A promoted user does not need to
  log in again. The JWT continues to carry only the user id.

## The authz module

`apps/web/app/lib/authz.ts` is the single place that maps roles to
capabilities. Everything else asks it; nothing else compares roles.

```ts
type Capability =
  | 'browse'          // public
  | 'save_favorites'  // any logged-in user
  | 'sell'            // SELLER, ADMIN — dashboard, groups, moderation of own
  | 'moderate_all'    // ADMIN — act on any seller's queue
  | 'manage_users'    // ADMIN
  | 'manage_listings' // ADMIN — deactivate/reactivate any listing

can(role, capability): boolean
requireCapability(capability): Promise<{ userId, role }>  // throws/returns error shape
```

`requireCapability` looks up the session user's role in the database and is the
only entry point protected actions use. Changing who can do what — or later
swapping the role switch for a permissions table — happens in this one file.

Server actions that operate on owned resources (a seller's own group/post)
keep their existing ownership checks **and** add the capability check;
`moderate_all` bypasses ownership only for admins.

## Clean slate

One SQL block, run by the owner in the Neon console (same as the earlier
`ALTER TABLE` they applied):

1. `TRUNCATE` (cascade) `User`, `FacebookGroup`, `ImportedPost`, `Listing`,
   `Category`, `Tag`, `SavedListing`, `AnalyticsEvent`, `ScrapingLog`.
2. Convert the `Role` enum: create the new type with
   `ADMIN | SELLER | BUYER`, alter the column (default `BUYER`), drop the old
   type. Order matters: truncate first so no row holds the old `USER` value.

The block is idempotent-safe to re-run (IF EXISTS guards) and is delivered in
the README plus a `scripts/reset-and-migrate-roles.sql` file.

## Categories

`apps/web/app/lib/categories.ts` exports the fixed list — name, slug,
Material icon name — as the single source of truth:

Vehicles, Electronics, Phones, Computers, Game Consoles, Home & Furniture,
Appliances, Clothing, Bicycles, Sports, Kids & Baby, Pets, Tools,
Books & Hobbies, Other.

- The `Category` table stays (Listing has an FK to it). Rows are find-or-created
  on demand, but **only** for slugs in the fixed list — free text is rejected.
- The approve form's category field becomes a `<select>` of this list. The AI
  parser's guessed category pre-selects the matching entry, else "Other".
- The redundant `Listing.category` string column is dropped; `categoryId` is
  the only source. (Included in the SQL block.)

## Homepage

`app/page.tsx` becomes a server component:

- **Category grid** — every category from the fixed list with its icon and live
  count of active listings (single `groupBy` query). Click →
  `/marketplace?category=<slug>`.
- **Fresh listings** — newest 8 active listings across all categories.
- **Search bar** — submits to `/marketplace?search=…`.
- **Header** — role-aware: visitor sees Log in / Register; buyer sees
  Favorites; seller sees Dashboard; admin sees Admin. One shared header
  component reads the session server-side.

The marketplace page must initialize its category and search filters **from the
URL** (`?category=`, `?search=`) — today the filter is client state only, so
those links would land on an unfiltered page.

## Admin panel

`/admin` (ADMIN only — capability-gated in the layout *and* in every action):

- **Users tab** — every user: email, role, created date, group and listing
  counts. Role dropdown per user (`manage_users`). Admin cannot demote
  themselves — prevents locking everyone out.
- **Listings tab** — every listing with active state; deactivate / reactivate
  (`manage_listings`). Deactivation flips `isActive`, which the public queries
  already respect.
- **Moderation tab** — pending `ImportedPost`s across **all** sellers
  (`moderate_all`), reusing the existing moderation form components. Approving
  as admin records the same result as the owner approving.

The current `/admin` page is a client-side copy of the seller moderation
dashboard (same actions as `/dashboard`, filtered to the logged-in user). It is
replaced by this panel; the seller-facing moderation stays in `/dashboard`.

`/settings` remains available to any logged-in user; the Facebook-connect
panel inside it renders only with the `sell` capability, since a session serves
no purpose for buyers.

## Sync

`syncGroupById` and the cron group query only process groups whose owner's
role grants `sell` (SELLER or ADMIN). Groups owned by buyers are skipped and
reported in telemetry as `skippedOwnerNotSeller` rather than silently ignored.

## Env vars

| Var | Purpose |
| --- | --- |
| `ADMIN_EMAIL` | Registration with this email (case-insensitive) gets ADMIN. |

Documented in the README env table.

## Testing

- `authz.test.ts` — the full role × capability matrix, and that unknown
  capabilities are denied.
- `categories.test.ts` — slugs unique, category validation rejects free text,
  parser-guess matching falls back to Other.
- Register-role selection and admin-email promotion logic extracted into a pure
  helper and tested.
- Existing 104 tests keep passing; CI unchanged.

## Out of scope (explicitly deferred)

- Buyer–seller messaging
- Seller public profiles
- Email verification
- Admin-managed (database-driven) category list
- Seller approval workflow (anyone can register as seller)

## Rollout order

1. Merge code (`schema.prisma` changes included: the new enum values, default
   `BUYER`, and the dropped `Listing.category` string column).
2. Owner runs `scripts/reset-and-migrate-roles.sql` in the Neon console.
3. Owner sets `ADMIN_EMAIL=gabuniagoga19@gmail.com` in Vercel and redeploys.
4. Owner registers with that email → becomes ADMIN.
5. Re-add groups, reconnect Facebook, resume syncing.

Until step 2 runs, deployed new code sees the old enum values; the authz module
treats the legacy `USER` value as `BUYER` so nothing crashes in the window
between deploy and SQL.
