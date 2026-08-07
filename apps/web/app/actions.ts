'use server';

import { PostStatus } from 'database';
import { revalidatePath } from 'next/cache';
import { getSession } from './lib/auth';
import { prisma } from './lib/prisma';
import { syncGroupById, type SyncResult } from './lib/sync';
import { saveFbCookies } from './lib/fb-session';

/** Build a URL-safe slug from a category name. */
function slugifyCategory(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'category';
}

/**
 * Resolve the Category row for `name`, creating it if it doesn't exist yet.
 *
 * Both `name` and `slug` are unique, so a naive find-then-create breaks in two
 * ways this handles: two approvals racing on the same new category, and two
 * different names slugifying to the same slug ("Real Estate" / "Real-Estate").
 */
async function findOrCreateCategory(name: string) {
  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) return existing;

  const base = slugifyCategory(name);
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    try {
      return await prisma.category.create({ data: { name, slug } });
    } catch (error: any) {
      if (error?.code !== 'P2002') throw error; // not a unique-constraint clash
      // Lost a race on `name` → reuse whatever the winner created.
      const raced = await prisma.category.findUnique({ where: { name } });
      if (raced) return raced;
      // Otherwise the clash was on `slug`; try the next suffix.
    }
  }
  throw new Error(`Could not allocate a unique slug for category "${name}"`);
}

/**
 * Fetch all approved listings for the public Marketplace Feed
 */
export async function getMarketplaceListings() {
  try {
    return await prisma.listing.findMany({
      where: { isActive: true },
      include: {
        categoryRel: true,
        importedPost: {
          include: {
            group: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Failed to get marketplace listings:', error);
    return [];
  }
}

/**
 * Fetch a single listing by its ID
 */
export async function getListingById(id: string) {
  try {
    return await prisma.listing.findUnique({
      where: { id },
      include: {
        categoryRel: true,
        importedPost: {
          include: {
            group: true
          }
        }
      }
    });
  } catch (error) {
    console.error(`Failed to get listing by ID ${id}:`, error);
    return null;
  }
}

/**
 * Fetch dynamic dashboard counts and historical scraping logs
 */
export async function getDashboardStats() {
  try {
    const userId = await getSession();
    if (!userId) {
      return { connectedGroups: 0, pendingPosts: 0, approvedListings: 0, rejectedPosts: 0, recentLogs: [], recentGroups: [] };
    }

    // Everything on the dashboard is scoped to the logged-in owner.
    const connectedGroups = await prisma.facebookGroup.count({ where: { isActive: true, userId } });
    const pendingPosts = await prisma.importedPost.count({ where: { status: 'PENDING', userId } });
    const approvedListings = await prisma.listing.count({ where: { isActive: true, importedPost: { userId } } });
    const rejectedPosts = await prisma.importedPost.count({ where: { status: 'REJECTED', userId } });

    const recentLogs = await prisma.scrapingLog.findMany({
      take: 6,
      where: { group: { userId } },
      include: { group: true },
      orderBy: { startedAt: 'desc' }
    });

    const recentGroups = await prisma.facebookGroup.findMany({
      take: 5,
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return {
      connectedGroups,
      pendingPosts,
      approvedListings,
      rejectedPosts,
      recentLogs: recentLogs.map(log => ({
        id: log.id,
        status: log.status,
        postsScraped: log.postsScraped,
        postsImported: log.postsImported,
        errorMessage: log.errorMessage,
        startedAt: log.startedAt.toISOString(),
        groupName: log.group.name
      })),
      recentGroups: recentGroups.map(g => ({
        id: g.id,
        name: g.name,
        url: g.url,
        isActive: g.isActive,
        isPublic: g.isPublic,
        createdAt: g.createdAt.toISOString()
      }))
    };
  } catch (error) {
    console.error('Failed to get dashboard stats:', error);
    return {
      connectedGroups: 0,
      pendingPosts: 0,
      approvedListings: 0,
      rejectedPosts: 0,
      recentLogs: [],
      recentGroups: []
    };
  }
}

/**
 * Fetch imported posts filterable by status
 */
export async function getImportedPosts(status?: PostStatus) {
  try {
    const userId = await getSession();
    if (!userId) return [];
    return await prisma.importedPost.findMany({
      where: { userId, ...(status ? { status } : {}) },
      include: { group: true },
      orderBy: { scrapedAt: 'desc' }
    });
  } catch (error) {
    console.error('Failed to get imported posts:', error);
    return [];
  }
}

/**
 * Fetch all groups connected in the platform
 */
export async function getFacebookGroups() {
  try {
    const userId = await getSession();
    if (!userId) return [];
    return await prisma.facebookGroup.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Failed to get facebook groups:', error);
    return [];
  }
}

/**
 * Connect a new Facebook Group into the platform
 */
export async function connectFacebookGroup(data: { name: string; url: string; groupId: string; keywords: string[]; isPublic?: boolean }) {
  try {
    const userId = await getSession();
    if (!userId) {
      return { success: false, error: 'You must be logged in to connect a group.' };
    }

    // Visibility is chosen by the owner in the connect form. Auto-detection is
    // unreliable with the Apify actor (it needs cookies even for public groups,
    // so a probe can't tell public from private). Private groups are gated on a
    // Facebook session at sync time; public groups sync via the shared session.
    const isPublic = data.isPublic === true;

    const group = await prisma.facebookGroup.upsert({
      where: { groupId: data.groupId },
      update: {
        name: data.name,
        url: data.url,
        keywords: data.keywords,
        isActive: true,
        isPublic,
        visibilityCheckedAt: new Date(),
      },
      create: {
        groupId: data.groupId,
        name: data.name,
        url: data.url,
        keywords: data.keywords,
        isPublic,
        isActive: true,
        visibilityCheckedAt: new Date(),
        userId
      }
    });

    revalidatePath('/dashboard');
    return { success: true, group, isPublic };
  } catch (error: any) {
    console.error('Failed to connect Facebook group:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Moderate Approved Post: Create dynamic listing and category, update status
 */
export async function approvePostAction(id: string, data: {
  title: string;
  price: number;
  description: string;
  category: string;
  location: string;
  specs: any;
}) {
  try {
    const userId = await getSession();
    if (!userId) {
      return { success: false, error: 'You must be logged in to moderate posts.' };
    }

    const importedPost = await prisma.importedPost.findUnique({
      where: { id },
      include: { group: true }
    });

    // Ownership is checked here, not in the page or the middleware: a server
    // action can be invoked by POSTing its action id to ANY route, including
    // routes the middleware matcher doesn't cover.
    if (!importedPost || importedPost.userId !== userId) {
      return { success: false, error: 'Post not found or not owned by you.' };
    }

    // 1. Update imported post status
    await prisma.importedPost.update({
      where: { id },
      data: { status: 'APPROVED', priceScraped: data.price }
    });

    // 2. Find or create the target Category
    const category = await findOrCreateCategory(data.category);

    // 3. Create the live public listing
    const listing = await prisma.listing.create({
      data: {
        title: data.title,
        price: data.price,
        description: data.description,
        images: importedPost.images,
        location: data.location || 'Unknown Location',
        category: data.category,
        specs: data.specs || {},
        originalPostUrl: importedPost.fbPostId,
        contactUrl: importedPost.authorProfile || `https://facebook.com/profile`,
        importedPostId: importedPost.id,
        categoryId: category.id
      }
    });

    revalidatePath('/marketplace');
    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { success: true, listing };
  } catch (error: any) {
    console.error(`Failed to approve post ${id}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Moderate Rejected Post: Set status to REJECTED and save rejection reasons
 */
export async function rejectPostAction(id: string, reason: string) {
  try {
    const userId = await getSession();
    if (!userId) {
      return { success: false, error: 'You must be logged in to moderate posts.' };
    }

    const existing = await prisma.importedPost.findUnique({ where: { id }, select: { userId: true } });
    if (!existing || existing.userId !== userId) {
      return { success: false, error: 'Post not found or not owned by you.' };
    }

    await prisma.importedPost.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason
      }
    });

    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to reject post ${id}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Trigger Playwright Scraping & OpenAI Parsing pipeline on the server
 */
export async function triggerScrapingAction(groupId: string): Promise<SyncResult> {
  try {
    const userId = await getSession();
    if (!userId) {
      return { success: false, error: 'You must be logged in to sync a group.' };
    }

    // Only the owner may sync their group.
    const owned = await prisma.facebookGroup.findUnique({ where: { id: groupId }, select: { userId: true } });
    if (!owned || owned.userId !== userId) {
      return { success: false, error: 'Group not found or not owned by you.' };
    }

    const result = await syncGroupById(groupId);

    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return result;
  } catch (error: any) {
    console.error(`Failed to run scraping trigger for group ${groupId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch all categories
 */
export async function getCategories() {
  try {
    return await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error('Failed to get categories:', error);
    return [];
  }
}

/**
 * Toggle listing favorite status for current user
 */
export async function toggleFavoriteAction(listingId: string) {
  try {
    const userId = await getSession();
    if (!userId) {
      return { success: false, error: 'You must be logged in to save listings.' };
    }

    const existing = await prisma.savedListing.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId
        }
      }
    });

    if (existing) {
      await prisma.savedListing.delete({
        where: {
          userId_listingId: {
            userId,
            listingId
          }
        }
      });
      revalidatePath('/marketplace');
      revalidatePath('/favorites');
      revalidatePath(`/listing-detail/${listingId}`);
      return { success: true, favorited: false };
    } else {
      await prisma.savedListing.create({
        data: {
          userId,
          listingId
        }
      });
      revalidatePath('/marketplace');
      revalidatePath('/favorites');
      revalidatePath(`/listing-detail/${listingId}`);
      return { success: true, favorited: true };
    }
  } catch (error: any) {
    console.error('Failed to toggle favorite:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch all favorited listings for the current user
 */
export async function getFavoritesAction() {
  try {
    const userId = await getSession();
    if (!userId) return [];

    const saved = await prisma.savedListing.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            categoryRel: true,
            importedPost: {
              include: {
                group: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return saved.map(s => s.listing);
  } catch (error) {
    console.error('Failed to get favorites:', error);
    return [];
  }
}

/**
 * Get all favorited listing IDs for the current user
 */
export async function getFavoritedIdsAction() {
  try {
    const userId = await getSession();
    if (!userId) return [];

    const saved = await prisma.savedListing.findMany({
      where: { userId },
      select: { listingId: true }
    });

    return saved.map(s => s.listingId);
  } catch (error) {
    console.error('Failed to get favorite IDs:', error);
    return [];
  }
}

/**
 * Update current user's profile details
 */
export async function updateProfileDetailsAction(firstName: string, lastName: string) {
  try {
    const userId = await getSession();
    if (!userId) {
      return { success: false, error: 'You must be logged in to update details.' };
    }

    if (!firstName.trim()) {
      return { success: false, error: 'First name is required.' };
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName.trim(),
        lastName: lastName?.trim() || null
      }
    });

    revalidatePath('/dashboard');
    revalidatePath('/admin');
    revalidatePath('/add-group');
    revalidatePath('/settings');
    return { success: true, user };
  } catch (error: any) {
    console.error('Failed to update profile:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Record an analytics event for a listing (VIEW, CONTACT_CLICK, FB_CLICK)
 */
export async function recordAnalyticsEventAction(listingId: string, eventType: 'VIEW' | 'CONTACT_CLICK' | 'FB_CLICK') {
  try {
    // Deliberately unauthenticated — marketplace visitors are anonymous. Guard
    // against bogus ids so a bad listingId is a no-op rather than an FK error,
    // and keep the event row and the counter in one transaction so they can't
    // drift apart. Note: this does not stop a determined client from inflating
    // counts; that needs IP-level throttling at the edge.
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, isActive: true }
    });
    if (!listing || !listing.isActive) {
      return { success: false, error: 'Listing not found.' };
    }

    await prisma.$transaction([
      prisma.analyticsEvent.create({
        data: {
          listingId,
          event: eventType
        }
      }),
      prisma.listing.update({
        where: { id: listingId },
        data: eventType === 'VIEW'
          ? { viewsCount: { increment: 1 } }
          : { clicksCount: { increment: 1 } }
      })
    ]);

    return { success: true };
  } catch (error: any) {
    console.error('Failed to record analytics event:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch aggregated analytics insights for the Seller Dashboard
 */
export async function getAnalyticsSummaryAction() {
  // Real numbers only. This used to floor every metric at a hardcoded baseline
  // (totalViews: max(n, 54)), synthesise the weekly series from fixed
  // percentages, and substitute three invented listings when the table was
  // empty — so a brand-new account was shown traffic it never had.
  const empty = {
    totalViews: 0,
    totalClicks: 0,
    contactClicks: 0,
    fbClicks: 0,
    ctr: 0,
    topListings: [] as { id: string; title: string; price: number; viewsCount: number; clicksCount: number; category: string }[],
    dailyViews: [] as { date: string; views: number }[]
  };

  try {
    const userId = await getSession();
    if (!userId) return empty;

    // Scope to the caller's own listings — this was previously a platform-wide
    // aggregate, which leaked other tenants' traffic.
    const owned = await prisma.listing.findMany({
      where: { importedPost: { userId } },
      select: { id: true }
    });
    const listingIds = owned.map(l => l.id);
    if (listingIds.length === 0) return empty;

    const [totalViews, contactClicks, fbClicks, topListings] = await Promise.all([
      prisma.analyticsEvent.count({ where: { event: 'VIEW', listingId: { in: listingIds } } }),
      prisma.analyticsEvent.count({ where: { event: 'CONTACT_CLICK', listingId: { in: listingIds } } }),
      prisma.analyticsEvent.count({ where: { event: 'FB_CLICK', listingId: { in: listingIds } } }),
      prisma.listing.findMany({
        take: 5,
        where: { id: { in: listingIds } },
        orderBy: { viewsCount: 'desc' },
        select: {
          id: true,
          title: true,
          price: true,
          viewsCount: true,
          clicksCount: true,
          category: true
        }
      })
    ]);

    const totalClicks = contactClicks + fbClicks;
    const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    // Real last-7-days view series, bucketed by calendar day (oldest first).
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - 6);

    const recentViews = await prisma.analyticsEvent.findMany({
      where: { event: 'VIEW', listingId: { in: listingIds }, createdAt: { gte: since } },
      select: { createdAt: true }
    });

    const buckets = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const day = new Date(since);
      day.setDate(since.getDate() + i);
      buckets.set(day.toDateString(), 0);
    }
    for (const event of recentViews) {
      const day = new Date(event.createdAt);
      day.setHours(0, 0, 0, 0);
      const key = day.toDateString();
      if (buckets.has(key)) buckets.set(key, buckets.get(key)! + 1);
    }

    const dailyViews = Array.from(buckets.entries()).map(([key, views]) => ({
      date: new Date(key).toLocaleDateString('en-US', { weekday: 'short' }),
      views
    }));

    return { totalViews, totalClicks, contactClicks, fbClicks, ctr, topListings, dailyViews };
  } catch (error) {
    console.error('Failed to get analytics summary:', error);
    return empty;
  }
}

/**
 * Direct Paste Ingest: Parse raw copied text directly via OpenAI / Regex and register as PENDING
 */
export async function ingestRawTextAction(groupId: string, rawText: string) {
  try {
    const userId = await getSession();
    if (!userId) {
      return { success: false, error: 'You must be logged in to ingest items.' };
    }

    const group = await prisma.facebookGroup.findUnique({
      where: { id: groupId }
    });

    // Only the owner may ingest into their own group.
    if (!group || group.userId !== userId) {
      return { success: false, error: 'Target Facebook Group not found.' };
    }

    const OpenAIParserService = require('../../api/src/parser/openai-parser.service').OpenAIParserService;
    const parser = new OpenAIParserService();
    const { sendAdminModerationAlert } = require('./lib/email');

    // Feed the raw text block directly to the AI parser
    const parsed = await parser.parseRawPost(rawText);
    
    if (!parsed.isListing) {
      return { success: false, error: 'The provided text does not contain a valid classified listing post.' };
    }

    const postUrlId = `fb-manual-${Math.random().toString(36).substring(7)}`;

    const imported = await prisma.importedPost.create({
      data: {
        fbPostId: postUrlId,
        rawText: rawText.trim(),
        images: [],
        authorName: 'Manual Ingest',
        authorProfile: null,
        priceScraped: parsed.price || null,
        status: 'PENDING',
        groupId: group.id,
        userId: userId
      }
    });

    // Send admin email notification alert (non-blocking)
    sendAdminModerationAlert({
      id: imported.id,
      authorName: imported.authorName,
      rawText: imported.rawText,
      groupName: group.name
    }).catch((err: any) => console.error('Failed to trigger email alert:', err));

    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { success: true, postId: imported.id };
  } catch (error: any) {
    console.error('Manual ingest failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update connected Facebook Group details
 */
export async function updateFacebookGroupAction(id: string, data: { name: string; url: string; keywords: string[] }) {
  try {
    const userId = await getSession();
    if (!userId) {
      return { success: false, error: 'You must be logged in.' };
    }
    // Only the owner may edit their group.
    const existing = await prisma.facebookGroup.findUnique({ where: { id }, select: { userId: true } });
    if (!existing || existing.userId !== userId) {
      return { success: false, error: 'Group not found or not owned by you.' };
    }

    const updated = await prisma.facebookGroup.update({
      where: { id },
      data: {
        name: data.name,
        url: data.url,
        keywords: data.keywords
      }
    });

    revalidatePath('/dashboard');
    revalidatePath('/add-group');
    return { success: true, group: updated };
  } catch (error: any) {
    console.error('Failed to update Facebook group:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Safely disconnect / delete Facebook Group from platform (cascades raw posts & logs)
 */
export async function disconnectFacebookGroupAction(id: string) {
  try {
    const userId = await getSession();
    if (!userId) {
      return { success: false, error: 'You must be logged in.' };
    }
    // Only the owner may delete their group (cascades raw posts & logs).
    const existing = await prisma.facebookGroup.findUnique({ where: { id }, select: { userId: true } });
    if (!existing || existing.userId !== userId) {
      return { success: false, error: 'Group not found or not owned by you.' };
    }

    await prisma.facebookGroup.delete({
      where: { id }
    });

    revalidatePath('/dashboard');
    revalidatePath('/add-group');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to disconnect Facebook group:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ── Facebook session management (private-group scraping) ─────────────────
 * Store the owner's Facebook session (encrypted) so private groups can sync.
 * cookiesJson is the raw cookie-export JSON captured client-side.
 */
export async function saveFacebookSession(cookiesJson: string) {
  try {
    const userId = await getSession();
    if (!userId) {
      return { success: false, error: 'You must be logged in.' };
    }
    const result = await saveFbCookies(userId, cookiesJson);
    if (result.success) {
      revalidatePath('/dashboard');
      revalidatePath('/settings');
    }
    return result;
  } catch (error: any) {
    console.error('Failed to save Facebook session:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Report the current user's Facebook connection status (no secrets returned).
 */
export async function getFbConnectionStatus() {
  try {
    const userId = await getSession();
    if (!userId) return { connected: false, status: 'NONE' as const, savedAt: null };
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { fbSessionStatus: true, fbSessionSavedAt: true }
    });
    return {
      connected: u?.fbSessionStatus === 'ACTIVE',
      status: (u?.fbSessionStatus as 'ACTIVE' | 'EXPIRED' | 'NONE') || 'NONE',
      savedAt: u?.fbSessionSavedAt || null
    };
  } catch (error: any) {
    console.error('Failed to read Facebook connection status:', error);
    return { connected: false, status: 'NONE' as const, savedAt: null };
  }
}

/**
 * Forget the stored Facebook session.
 */
export async function disconnectFacebookSession() {
  try {
    const userId = await getSession();
    if (!userId) {
      return { success: false, error: 'You must be logged in.' };
    }
    await prisma.user.update({
      where: { id: userId },
      data: { fbSessionCookies: null, fbSessionStatus: 'NONE', fbSessionSavedAt: null }
    });
    revalidatePath('/dashboard');
    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to disconnect Facebook session:', error);
    return { success: false, error: error.message };
  }
}

