import { redirect } from 'next/navigation';
import { requireCapability } from '../lib/authz';

/** Connecting a group is seller work — same gate as the dashboard tree. */
export default async function AddGroupLayout({ children }: { children: React.ReactNode }) {
  const authz = await requireCapability('sell');
  if (authz.error) {
    redirect(authz.userId ? '/' : '/login');
  }
  return <>{children}</>;
}
