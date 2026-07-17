import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { syncGroupById } from '../../../lib/sync';

export async function POST(req: Request) {
  try {
    // 1. Verify cron authorization signature
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // In production, we strictly require the cron secret to match
    if (process.env.NODE_ENV === 'production' && (!authHeader || authHeader !== `Bearer ${cronSecret}`)) {
      return NextResponse.json({ error: 'Unauthorized cron signature' }, { status: 401 });
    }

    console.log('[Cron Scrape] Initializing scheduled group indexing loop...');
    
    // 2. Query all active facebook groups
    const activeGroups = await prisma.facebookGroup.findMany({
      where: { isActive: true }
    });

    if (activeGroups.length === 0) {
      return NextResponse.json({ success: true, message: 'No active groups identified for ingestion.' });
    }

    const telemetry: any[] = [];

    // 3. Process each active group. syncGroupById never throws for expected
    //    conditions (private group without an active session returns
    //    needsFacebook), so one blocked group doesn't stop the others.
    for (const group of activeGroups) {
      console.log(`[Cron Scrape] Synchronizing group "${group.name}"...`);
      let result;
      try {
        result = await syncGroupById(group.id);
      } catch (err: any) {
        result = { success: false, error: err?.message || String(err) };
      }

      telemetry.push({
        groupId: group.id,
        groupName: group.name,
        success: result.success,
        skipped: result.needsFacebook || false,
        postsFound: result.postsFound || 0,
        listingsImported: result.listingsImported || 0,
        error: result.error || null
      });
    }

    const totalImported = telemetry.reduce((sum, item) => sum + item.listingsImported, 0);
    console.log(`[Cron Scrape] Scheduled synchronization completed. Imported ${totalImported} new listings.`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      groupsProcessed: activeGroups.length,
      newListingsImported: totalImported,
      details: telemetry
    });
  } catch (error: any) {
    console.error('[Cron Scrape] Scheduled cron process aborted due to error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Support GET for testing in development easily
export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
  }
  return POST(req);
}
