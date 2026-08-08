import { getSession } from './auth';
import { prisma } from './prisma';

/**
 * The single place that maps roles to what they may do. Nothing outside this
 * file compares roles — actions and layouts ask for a capability. Changing who
 * can do what is an edit to CAPABILITIES; replacing the role switch with a
 * permissions table later would change only this file's internals.
 */

export type AppRole = 'ADMIN' | 'SELLER' | 'BUYER';

export type Capability =
  /** Save/unsave favorites — any signed-in account. */
  | 'save_favorites'
  /** The seller surface: groups, syncing, connect Facebook, own moderation. */
  | 'sell'
  /** Act on ANY seller's queue and resources, not just your own. */
  | 'moderate_all'
  /** See every user and change roles. */
  | 'manage_users'
  /** Deactivate/reactivate any listing. */
  | 'manage_listings';

const CAPABILITIES: Record<AppRole, ReadonlySet<Capability>> = {
  BUYER: new Set<Capability>(['save_favorites']),
  SELLER: new Set<Capability>(['save_favorites', 'sell']),
  ADMIN: new Set<Capability>([
    'save_favorites',
    'sell',
    'moderate_all',
    'manage_users',
    'manage_listings',
  ]),
};

/**
 * Normalize whatever the database holds into an AppRole. The legacy value
 * `USER` (pre-migration rows) reads as BUYER, and anything unexpected
 * degrades to BUYER too — the safest failure is fewer capabilities, never more.
 */
export function normalizeRole(role: string | null | undefined): AppRole {
  if (role === 'ADMIN' || role === 'SELLER' || role === 'BUYER') return role;
  return 'BUYER';
}

export function can(role: string | null | undefined, capability: Capability): boolean {
  return CAPABILITIES[normalizeRole(role)].has(capability);
}

export interface AuthzResult {
  userId: string | null;
  role: AppRole | null;
  /** Set when the check failed; the shape server actions already return. */
  error?: string;
}

/**
 * The one entry point protected server actions use.
 *
 * Reads the role from the database on every call rather than trusting the
 * client or baking it into the JWT — a promoted user gains access without
 * logging out, a demoted one loses it just as fast. One indexed primary-key
 * lookup per protected action.
 */
/**
 * Who is looking, for role-aware rendering (header links, panel visibility).
 * No capability requirement — null just means a signed-out visitor.
 */
export async function getViewer(): Promise<{ userId: string; role: AppRole } | null> {
  const userId = await getSession();
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return null;
  return { userId, role: normalizeRole(user.role) };
}

export async function requireCapability(capability: Capability): Promise<AuthzResult> {
  const userId = await getSession();
  if (!userId) {
    return { userId: null, role: null, error: 'You must be logged in.' };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    // A JWT for a deleted account — treat as signed out, not as an error page.
    return { userId: null, role: null, error: 'You must be logged in.' };
  }

  const role = normalizeRole(user.role);
  if (!can(role, capability)) {
    return { userId, role, error: 'You do not have permission to do this.' };
  }
  return { userId, role };
}
