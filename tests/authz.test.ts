import { describe, it, expect } from 'vitest';
import { can, normalizeRole, type AppRole, type Capability } from '../apps/web/app/lib/authz';

/**
 * The full role × capability matrix, written out literally. This table IS the
 * product's permission model — a change here should be a decision, not a
 * side effect.
 */
const MATRIX: Record<AppRole, Record<Capability, boolean>> = {
  BUYER: {
    save_favorites: true,
    sell: false,
    moderate_all: false,
    manage_users: false,
    manage_listings: false,
  },
  SELLER: {
    save_favorites: true,
    sell: true,
    moderate_all: false,
    manage_users: false,
    manage_listings: false,
  },
  ADMIN: {
    save_favorites: true,
    sell: true,
    moderate_all: true,
    manage_users: true,
    manage_listings: true,
  },
};

describe('the capability matrix', () => {
  for (const [role, caps] of Object.entries(MATRIX)) {
    for (const [capability, allowed] of Object.entries(caps)) {
      it(`${role} ${allowed ? 'can' : 'cannot'} ${capability}`, () => {
        expect(can(role, capability as Capability)).toBe(allowed);
      });
    }
  }
});

describe('normalizeRole', () => {
  it('passes real roles through', () => {
    for (const role of ['ADMIN', 'SELLER', 'BUYER'] as const) {
      expect(normalizeRole(role)).toBe(role);
    }
  });

  it('reads the legacy USER value as BUYER', () => {
    // Rows written before the migration SQL runs still hold USER. The safest
    // reading is the one with the fewest capabilities.
    expect(normalizeRole('USER')).toBe('BUYER');
  });

  it('degrades anything unexpected to BUYER, never upward', () => {
    for (const junk of [null, undefined, '', 'admin', 'root', 'SUPERUSER']) {
      expect(normalizeRole(junk), String(junk)).toBe('BUYER');
    }
  });
});

describe('capabilities through normalization', () => {
  it('a legacy USER row cannot reach the seller surface', () => {
    expect(can('USER', 'sell')).toBe(false);
    expect(can('USER', 'save_favorites')).toBe(true);
  });

  it('a lowercase "admin" is not an admin', () => {
    // Roles come from our own database, but if anything ever writes a
    // non-canonical value, it must fail closed.
    expect(can('admin', 'manage_users')).toBe(false);
  });
});
