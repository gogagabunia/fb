import { NextRequest, NextResponse } from 'next/server';
import { getSession, verifySessionToken } from '../../lib/auth';
import { saveFbCookies } from '../../lib/fb-session';

// The browser extension posts from a chrome-extension:// origin, so allow CORS.
// Auth is carried in the Authorization header (the app session token), not a
// cookie, so a wildcard origin is safe here.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(request: NextRequest) {
  try {
    // Auth: the extension sends `Authorization: Bearer <app session token>`;
    // the in-app fetch relies on the session cookie.
    const authHeader = request.headers.get('authorization') || '';
    let userId: string | null = null;
    if (authHeader.startsWith('Bearer ')) {
      userId = await verifySessionToken(authHeader.slice(7).trim());
    }
    if (!userId) {
      userId = await getSession();
    }
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not signed in to GroupMarket. Open the app and log in first.' },
        { status: 401, headers: CORS }
      );
    }

    const body = await request.json();
    const cookiesJson =
      typeof body?.cookies === 'string' ? body.cookies : JSON.stringify(body?.cookies ?? body);
    const result = await saveFbCookies(userId, cookiesJson);
    return NextResponse.json(result, { status: result.success ? 200 : 400, headers: CORS });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Bad request' },
      { status: 400, headers: CORS }
    );
  }
}
