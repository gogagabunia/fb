# Implementation plan: three-role marketplace

Spec: `docs/superpowers/specs/2026-08-08-three-role-marketplace-design.md`

Each step leaves the build green (`vitest run`, `tsc --noEmit`, `next build`).

## 1. Foundations (no behaviour change yet)

- `packages/database/prisma/schema.prisma`: `Role` → `ADMIN | SELLER | BUYER`,
  `User.role` default `BUYER`, drop `Listing.category` string column.
- `scripts/reset-and-migrate-roles.sql`: truncate everything, convert the enum,
  drop the column. IF EXISTS guards throughout.
- `apps/web/app/lib/categories.ts`: the 15 fixed categories
  (name, slug, icon) + `isValidCategorySlug`, `categoryByName` (loose match for
  the AI's guess, fallback Other).
- `apps/web/app/lib/authz.ts`: `Capability`, `can(role, capability)`
  (legacy `USER` reads as `BUYER`), `requireCapability(capability)` reading the
  role from the DB via the session user id.
- Tests: authz matrix, categories. Everything else still compiles because the
  dropped column is only written in `approvePostAction` (updated in step 3).

## 2. Registration

- `resolveRegistrationRole(requested, email, adminEmail)` pure helper + tests:
  BUYER default, SELLER when requested, ADMIN when email matches (case-insens).
- `auth-actions.ts` register accepts `role: 'BUYER' | 'SELLER'`, applies helper.
- Register page: two-option choice, Buyer preselected.

## 3. Enforce capabilities in existing actions

- Seller surface (`actions.ts`): group CRUD, connect/disconnect Facebook,
  imported-post reads, approve/reject, triggerScraping, dashboard stats →
  `requireCapability('sell')`; ownership checks stay; admins pass ownership via
  `moderate_all`.
- `approvePostAction`: validate category slug against the fixed list; stop
  writing `Listing.category`; category comes from the moderation form dropdown.
- Moderation form: category `<select>` from the fixed list, AI guess
  pre-selected via `categoryByName`.
- Favorites actions → `save_favorites`.

## 4. Sync gating

- Cron group query: only groups whose owner's role grants `sell`; skipped ones
  reported as `skippedOwnerNotSeller`.
- `syncGroupById`: same check at the top (the interactive path).

## 5. Admin panel

- `/admin/layout.tsx`: server-side `requireCapability('manage_users')` gate.
- Tabs (server components + actions, each action re-checks its capability):
  - Users: list + role dropdown (`setUserRoleAction`, no self-demotion).
  - Listings: list + deactivate/reactivate (`setListingActiveAction`).
  - Moderation: all sellers' PENDING posts, reusing the existing form
    (`moderate_all` passes the ownership check in approve/reject).
- Delete the old `/admin/page.tsx` client dashboard copy.

## 6. Homepage + marketplace URL params

- `app/page.tsx` → server component: category grid with `groupBy` counts,
  newest 8 listings, search form, role-aware header (session read server-side).
- Marketplace page: initialize category/search filters from `?category=` and
  `?search=`.
- `FacebookConnect` panel renders only with `sell`.

## 7. Docs and finish

- README: roles table, `ADMIN_EMAIL`, category list pointer, rollout order.
- Full run: vitest, typecheck, build. Push branch, open PR when asked.

## Rollout (owner actions after merge)

1. Run `scripts/reset-and-migrate-roles.sql` in Neon.
2. Set `ADMIN_EMAIL=gabuniagoga19@gmail.com` in Vercel → redeploy.
3. Register with that email → ADMIN. Re-add groups, reconnect Facebook.
