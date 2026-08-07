import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

// Public read-only feed. Capped so a single request can't pull the whole table.
const MAX_LISTINGS = 100;

export async function GET() {
  try {
    const listings = await prisma.listing.findMany({
      take: MAX_LISTINGS,
      where: { isActive: true },
      include: {
        categoryRel: true,
        importedPost: {
          select: {
            group: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(listings);
  } catch (error: any) {
    console.error('REST API failed to fetch listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings', details: error.message },
      { status: 500 }
    );
  }
}
