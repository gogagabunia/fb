import { redirect } from 'next/navigation';
import { requireCapability } from '../lib/authz';

/**
 * Server-side gate for everything under /admin. Convenience only — each admin
 * action re-checks its own capability, because server actions are reachable
 * without ever rendering this layout.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authz = await requireCapability('manage_users');
  if (authz.error) {
    redirect(authz.userId ? '/' : '/login');
  }
  return <>{children}</>;
}
