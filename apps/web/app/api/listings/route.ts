import { NextResponse } from 'next/server';
import { PrismaClient } from 'database';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const listings = await prisma.listing.findMany({
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
