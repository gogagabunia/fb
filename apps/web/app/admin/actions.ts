'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '../lib/prisma';
import { requireCapability } from '../lib/authz';

/**
 * Admin-panel actions. Every one re-checks its capability — the /admin layout
 * also gates, but a server action is invocable by POST against any route, so
 * the layout is convenience, not security.
 */

const ASSIGNABLE_ROLES = ['ADMIN', 'SELLER', 'BUYER'] as const;
type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export async function adminListUsers() {
  const authz = await requireCapability('manage_users');
  if (authz.error) return { error: authz.error, users: [] };

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
      _count: { select: { groups: true, importedPosts: true } }
    }
  });
  return { users: users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })) };
}

export async function adminSetUserRole(targetUserId: string, role: string) {
  const authz = await requireCapability('manage_users');
  if (authz.error || !authz.userId) return { success: false, error: authz.error };

  if (!ASSIGNABLE_ROLES.includes(role as AssignableRole)) {
    return { success: false, error: 'Unknown role.' };
  }

  // An admin demoting themselves would lock everyone out of this panel — the
  // last admin especially. Promote someone else first, then have them demote.
  if (targetUserId === authz.userId && role !== 'ADMIN') {
    return { success: false, error: 'You cannot remove your own admin role.' };
  }

  try {
    await prisma.user.update({ where: { id: targetUserId }, data: { role: role as AssignableRole } });
    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to set user role:', error);
    return { success: false, error: error.message };
  }
}

export async function adminListListings() {
  const authz = await requireCapability('manage_listings');
  if (authz.error) return { error: authz.error, listings: [] };

  const listings = await prisma.listing.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      title: true,
      price: true,
      isActive: true,
      createdAt: true,
      categoryRel: { select: { name: true } },
      importedPost: { select: { user: { select: { email: true } } } }
    }
  });
  return {
    listings: listings.map(l => ({
      id: l.id,
      title: l.title,
      price: l.price,
      isActive: l.isActive,
      createdAt: l.createdAt.toISOString(),
      category: l.categoryRel?.name ?? 'Other',
      sellerEmail: l.importedPost?.user?.email ?? '—'
    }))
  };
}

export async function adminSetListingActive(listingId: string, isActive: boolean) {
  const authz = await requireCapability('manage_listings');
  if (authz.error) return { success: false, error: authz.error };

  try {
    await prisma.listing.update({ where: { id: listingId }, data: { isActive } });
    // The public pages all filter on isActive, so this takes effect on the
    // next render everywhere at once.
    revalidatePath('/marketplace');
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to set listing active state:', error);
    return { success: false, error: error.message };
  }
}

export async function adminListPendingPosts() {
  const authz = await requireCapability('moderate_all');
  if (authz.error) return { error: authz.error, posts: [] };

  const posts = await prisma.importedPost.findMany({
    where: { status: 'PENDING' },
    orderBy: { scrapedAt: 'asc' }, // oldest first — the queue, not a feed
    take: 100,
    select: {
      id: true,
      rawText: true,
      images: true,
      authorName: true,
      priceScraped: true,
      parsedCategory: true,
      scrapedAt: true,
      group: { select: { name: true } },
      user: { select: { email: true } }
    }
  });
  return {
    posts: posts.map(p => ({
      ...p,
      scrapedAt: p.scrapedAt.toISOString(),
      groupName: p.group.name,
      sellerEmail: p.user.email
    }))
  };
}
