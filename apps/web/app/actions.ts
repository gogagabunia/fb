'use server';

import { PrismaClient, PostStatus } from 'database';
import { PlaywrightScraperService } from '../../api/src/scrapers/playwright-scraper.service';
import { OpenAIParserService } from '../../api/src/parser/openai-parser.service';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

// Helper to ensure a mock user exists and return it
async function getOrCreateMockUser() {
  return prisma.user.upsert({
    where: { email: 'test@groupmarket.com' },
    update: {},
    create: {
      clerkId: 'user_clerk_123',
      email: 'test@groupmarket.com',
      firstName: 'Test',
      lastName: 'Admin',
      role: 'ADMIN',
    },
  });
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
    const connectedGroups = await prisma.facebookGroup.count({ where: { isActive: true } });
    const pendingPosts = await prisma.importedPost.count({ where: { status: 'PENDING' } });
    const approvedListings = await prisma.listing.count({ where: { isActive: true } });
    const rejectedPosts = await prisma.importedPost.count({ where: { status: 'REJECTED' } });

    const recentLogs = await prisma.scrapingLog.findMany({
      take: 6,
      include: { group: true },
      orderBy: { startedAt: 'desc' }
    });

    const recentGroups = await prisma.facebookGroup.findMany({
      take: 5,
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
    return await prisma.importedPost.findMany({
      where: status ? { status } : {},
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
    return await prisma.facebookGroup.findMany({
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
export async function connectFacebookGroup(data: { name: string; url: string; groupId: string; keywords: string[] }) {
  try {
    const user = await getOrCreateMockUser();
    const group = await prisma.facebookGroup.upsert({
      where: { groupId: data.groupId },
      update: {
        name: data.name,
        url: data.url,
        keywords: data.keywords,
        isActive: true,
      },
      create: {
        groupId: data.groupId,
        name: data.name,
        url: data.url,
        keywords: data.keywords,
        isPublic: true,
        isActive: true,
        userId: user.id
      }
    });

    revalidatePath('/dashboard');
    return { success: true, group };
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
    const importedPost = await prisma.importedPost.findUnique({
      where: { id },
      include: { group: true }
    });

    if (!importedPost) {
      throw new Error(`Imported post ${id} not found`);
    }

    // 1. Update imported post status
    await prisma.importedPost.update({
      where: { id },
      data: { status: 'APPROVED', priceScraped: data.price }
    });

    // 2. Find or create the target Category
    let category = await prisma.category.findUnique({
      where: { name: data.category }
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: data.category,
          slug: data.category.toLowerCase().replace(/[^a-z0-9]/g, '-')
        }
      });
    }

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
export async function triggerScrapingAction(groupId: string) {
  try {
    const group = await prisma.facebookGroup.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      throw new Error(`Group with ID ${groupId} not found`);
    }

    const scraper = new PlaywrightScraperService();
    const parser = new OpenAIParserService();
    const user = await getOrCreateMockUser();

    console.log(`Starting dynamic scrape for ${group.name}...`);
    const rawPosts = await scraper.scrapeGroup(group.id, 5);

    let importedCount = 0;

    for (const post of rawPosts) {
      const parsed = await parser.parseRawPost(post.text);
      if (parsed.isListing) {
        importedCount++;
        await prisma.importedPost.upsert({
          where: { fbPostId: post.id },
          update: {
            rawText: post.text,
            images: post.images,
            authorName: post.author,
            priceScraped: parsed.price || null,
            status: 'PENDING'
          },
          create: {
            fbPostId: post.id,
            rawText: post.text,
            images: post.images,
            authorName: post.author,
            priceScraped: parsed.price || null,
            status: 'PENDING',
            groupId: group.id,
            userId: user.id
          }
        });
      }
    }

    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { success: true, postsFound: rawPosts.length, listingsImported: importedCount };
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
