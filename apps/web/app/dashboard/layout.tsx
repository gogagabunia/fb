import { redirect } from 'next/navigation';
import { requireCapability } from '../lib/authz';

/**
 * The dashboard tree is the seller surface — moderation, groups, analytics,
 * the Facebook connection panel. Buyers land on the homepage instead; the
 * server actions behind these pages all re-check the capability themselves.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const authz = await requireCapability('sell');
  if (authz.error) {
    redirect(authz.userId ? '/' : '/login');
  }
  return <>{children}</>;
}
