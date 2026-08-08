-- Three-role migration + full data reset for GroupMarket.
--
-- Run this in the Neon SQL console against the app's database, immediately
-- after the three-role code deploy finishes. The owner asked for a clean
-- slate: every user, group, imported post, listing and log is deleted.
--
-- Safe to re-run: every statement guards with IF EXISTS / duplicate checks.

BEGIN;

-- ── 1. Wipe all data ────────────────────────────────────────────────────────
-- TRUNCATE ... CASCADE follows every foreign key, so the order here does not
-- matter; listing them all keeps the intent explicit.
TRUNCATE TABLE
  "AnalyticsEvent",
  "SavedListing",
  "Listing",
  "Tag",
  "Category",
  "ScrapingLog",
  "ImportedPost",
  "FacebookGroup",
  "User"
CASCADE;

-- ── 2. Convert the Role enum: USER/ADMIN → ADMIN/SELLER/BUYER ───────────────
-- The table is empty, so no row holds the legacy USER value and the column can
-- be retyped freely.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role_new') THEN
    DROP TYPE "Role_new";
  END IF;
END $$;

CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'SELLER', 'BUYER');

ALTER TABLE "User"
  ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "Role_new"
  USING (
    CASE "role"::text
      WHEN 'ADMIN' THEN 'ADMIN'
      ELSE 'BUYER'   -- legacy USER (and anything unexpected) reads as BUYER
    END
  )::"Role_new";

DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

ALTER TABLE "User"
  ALTER COLUMN "role" SET DEFAULT 'BUYER';

-- ── 3. Drop the redundant Listing.category string ───────────────────────────
-- categoryId (FK to Category) is the single source of truth now.
ALTER TABLE "Listing" DROP COLUMN IF EXISTS "category";

COMMIT;

-- Verify:
--   SELECT enum_range(NULL::"Role");          → {ADMIN,SELLER,BUYER}
--   SELECT count(*) FROM "User";              → 0
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name = 'Listing' AND column_name = 'category';  → no rows
