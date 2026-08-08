import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { syncGroupById } from '../../../lib/sync';

// Scrapes are slow (Apify sync run) — give the cron the Hobby max budget.
export const maxDuration = 60;

/**
 * Hard cutoff for the whole request, comfortably inside maxDuration.
 *
 * Vercel kills the function at 60s with FUNCTION_INVOCATION_TIMEOUT and the
 * caller sees a 504 with no telemetry — every group's work is lost, including
 * groups that had already finished. Stopping ourselves means the run always
 * returns what it managed to do, and the rest is picked up next time.
 */
const REQUEST_BUDGET_MS = 50_000;

/**
 * Don't start a group unless there is a realistic chance of finishing it.
 *
 * Measured against production: an Apify run takes roughly 28s even when it
 * returns nothing. Starting a group with 12s left, as this used to, only
 * produced "Apify run exceeded the budget" and burned an actor run for nothing.
 */
const MIN_TIME_PER_GROUP_MS = 30_000;

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
    
    // 2. Active groups, least-recently-synced first.
    //
    // Order used to be whatever Postgres returned, so the same groups were
    // always synced and the same ones always starved — a run reported
    // groupsNotAttempted: ["car","asd","asd"] every single time. Rotating means
    // a group missed by one run is first in the next.
    const activeGroups = await prisma.facebookGroup.findMany({
      where: { isActive: true },
      orderBy: { lastSyncedAt: { sort: 'asc', nulls: 'first' } }
    });

    if (activeGroups.length === 0) {
      return NextResponse.json({ success: true, message: 'No active groups identified for ingestion.' });
    }

    const deadline = Date.now() + REQUEST_BUDGET_MS;
    const telemetry: any[] = [];
    const notAttempted: string[] = [];

    // 3. Process each active group. syncGroupById never throws for expected
    //    conditions (private group without an active session returns
    //    needsFacebook), so one blocked group doesn't stop the others.
    for (const group of activeGroups) {
      if (Date.now() > deadline - MIN_TIME_PER_GROUP_MS) {
        // Never silently drop a group — report it so a chronically starved
        // group is visible rather than looking like it had nothing to import.
        notAttempted.push(group.name);
        continue;
      }

      console.log(`[Cron Scrape] Synchronizing group "${group.name}"...`);

      // Stamp the attempt before doing any work, so a group that fails — or
      // times out mid-sync — still moves to the back of the queue. Stamping on
      // success only would let a permanently broken group monopolise every run.
      await prisma.facebookGroup
        .update({ where: { id: group.id }, data: { lastSyncedAt: new Date() } })
        .catch(err => console.error(`Failed to stamp lastSyncedAt for ${group.name}:`, err));

      let result;
      try {
        result = await syncGroupById(group.id, { deadline });
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
        // Posts left unparsed because the per-group time budget ran out. Never
        // let truncation look like "nothing more to import".
        postsUnparsed: result.postsSkipped || 0,
        // Posts the run deliberately did not import. Without these a run that
        // scrapes 5 and imports 0 looks broken when it is working exactly as
        // configured.
        postsDuplicate: result.postsDuplicate || 0,
        postsWithoutImages: result.postsWithoutImages || 0,
        error: result.error || null,
        // Surfaced so a zero-post run explains itself in the telemetry rather
        // than needing someone to go and reproduce it.
        diagnostics: result.diagnostics || null
      });
    }

    const totalImported = telemetry.reduce((sum, item) => sum + item.listingsImported, 0);
    const totalUnparsed = telemetry.reduce((sum, item) => sum + item.postsUnparsed, 0);
    console.log(
      `[Cron Scrape] Completed ${telemetry.length}/${activeGroups.length} group(s). ` +
        `Imported ${totalImported} new listings` +
        (totalUnparsed > 0 ? `, ${totalUnparsed} post(s) left for the next run` : '') +
        (notAttempted.length > 0 ? `, not reached: ${notAttempted.join(', ')}` : '') +
        '.'
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      groupsProcessed: telemetry.length,
      groupsNotAttempted: notAttempted,
      newListingsImported: totalImported,
      postsUnparsed: totalUnparsed,
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
