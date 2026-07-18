import { prisma } from './prisma';
import { encrypt } from './crypto';

/**
 * Validate a Facebook cookie export and store it (encrypted) for a user.
 * Shared by the in-app "Connect Facebook" action and the browser extension's
 * /api/fb-session endpoint.
 */
export async function saveFbCookies(userId: string, cookiesJson: string) {
  let parsed: any;
  try {
    parsed = JSON.parse(cookiesJson);
  } catch {
    return { success: false, error: 'Invalid cookie data — expected a JSON array of cookies.' };
  }
  const cookies = Array.isArray(parsed) ? parsed : parsed?.cookies;
  if (
    !Array.isArray(cookies) ||
    !cookies.some((c: any) => c?.name === 'c_user') ||
    !cookies.some((c: any) => c?.name === 'xs')
  ) {
    return { success: false, error: 'These cookies do not contain a Facebook login session (missing c_user / xs).' };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      fbSessionCookies: encrypt(JSON.stringify(cookies)),
      fbSessionStatus: 'ACTIVE',
      fbSessionSavedAt: new Date(),
    },
  });

  return { success: true, cookieCount: cookies.length };
}
