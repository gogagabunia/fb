import { NextRequest, NextResponse } from 'next/server';
import { saveFacebookSession } from '../../actions';

// Endpoint for a companion browser extension to POST the owner's Facebook
// session after a one-click capture on facebook.com. Auth is enforced by
// saveFacebookSession via the logged-in session cookie (credentials: include).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cookiesJson = typeof body?.cookies === 'string' ? body.cookies : JSON.stringify(body?.cookies ?? body);
    const result = await saveFacebookSession(cookiesJson);
    const status = result.success ? 200 : 400;
    return NextResponse.json(result, { status });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Bad request' }, { status: 400 });
  }
}
