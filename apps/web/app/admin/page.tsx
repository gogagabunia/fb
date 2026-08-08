'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  adminListUsers,
  adminSetUserRole,
  adminListListings,
  adminSetListingActive,
  adminListPendingPosts
} from './actions';
import { approvePostAction, rejectPostAction } from '../actions';
import { CATEGORIES, matchCategoryGuess } from '../lib/categories';

type Tab = 'users' | 'listings' | 'moderation';

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  createdAt: string;
  _count: { groups: number; importedPosts: number };
}

interface AdminListing {
  id: string;
  title: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  category: string;
  sellerEmail: string;
}

interface PendingPost {
  id: string;
  rawText: string;
  images: string[];
  authorName: string;
  priceScraped: number | null;
  parsedCategory: string | null;
  scrapedAt: string;
  groupName: string;
  sellerEmail: string;
}

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [pending, setPending] = useState<PendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Approve modal state (moderation tab)
  const [editPost, setEditPost] = useState<PendingPost | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('other');
  const [editPrice, setEditPrice] = useState(0);
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');

  function say(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  }

  async function refresh() {
    setLoading(true);
    try {
      const [u, l, p] = await Promise.all([
        adminListUsers(),
        adminListListings(),
        adminListPendingPosts()
      ]);
      setUsers(u.users as AdminUser[]);
      setListings(l.listings as AdminListing[]);
      setPending(p.posts as PendingPost[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function changeRole(userId: string, role: string) {
    const res = await adminSetUserRole(userId, role);
    if (res.success) {
      say('Role updated.');
      refresh();
    } else {
      say(res.error || 'Failed to update role.');
    }
  }

  async function toggleListing(listing: AdminListing) {
    const res = await adminSetListingActive(listing.id, !listing.isActive);
    if (res.success) {
      say(listing.isActive ? 'Listing deactivated.' : 'Listing reactivated.');
      refresh();
    } else {
      say(res.error || 'Failed to update listing.');
    }
  }

  function openApprove(post: PendingPost) {
    setEditPost(post);
    const firstLine = post.rawText.split('\n')[0] || '';
    setEditTitle(firstLine.length > 50 ? firstLine.slice(0, 47) + '…' : firstLine || `Listing from ${post.authorName}`);
    setEditCategory(matchCategoryGuess(post.parsedCategory).slug);
    setEditPrice(post.priceScraped || 0);
    setEditDescription(post.rawText);
    setEditLocation('');
  }

  async function submitApprove() {
    if (!editPost) return;
    const res = await approvePostAction(editPost.id, {
      title: editTitle,
      price: editPrice,
      description: editDescription,
      category: editCategory,
      location: editLocation,
      specs: { scrapedAuthor: editPost.authorName }
    });
    if (res.success) {
      say('Approved and published.');
      setEditPost(null);
      refresh();
    } else {
      say(res.error || 'Approval failed.');
    }
  }

  async function reject(post: PendingPost) {
    const reason = window.prompt(`Reject the post from ${post.authorName}? Reason (optional):`) ?? '';
    if (reason === null) return;
    const res = await rejectPostAction(post.id, reason);
    if (res.success) {
      say('Rejected.');
      refresh();
    } else {
      say(res.error || 'Rejection failed.');
    }
  }

  const input =
    'w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none';

  return (
    <div className="min-h-screen bg-surface-container-lowest">
      <header className="bg-surface border-b border-outline-variant/30 px-lg py-md flex items-center justify-between">
        <div className="flex items-center gap-lg">
          <Link href="/" className="text-headline-sm font-bold text-primary">GroupMarket</Link>
          <span className="text-label-md font-bold text-on-surface-variant bg-surface-container-low px-md py-1 rounded-full">
            Admin
          </span>
        </div>
        <nav className="flex gap-sm">
          {(['users', 'listings', 'moderation'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-lg py-2 rounded-lg font-label-md capitalize transition-colors ${
                tab === t ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {t}
              {t === 'moderation' && pending.length > 0 && (
                <span className="ml-xs bg-error text-on-error text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-container-max mx-auto p-lg">
        {toast && (
          <div className="fixed top-4 right-4 z-50 bg-primary text-on-primary px-lg py-md rounded-lg shadow-lg text-body-sm">
            {toast}
          </div>
        )}

        {loading ? (
          <p className="text-on-surface-variant text-body-md p-xl text-center">Loading…</p>
        ) : tab === 'users' ? (
          <div className="bg-surface rounded-xl border border-outline-variant/30 overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="text-left text-label-sm text-on-surface-variant border-b border-outline-variant/30">
                  <th className="p-md">User</th>
                  <th className="p-md">Groups</th>
                  <th className="p-md">Posts</th>
                  <th className="p-md">Joined</th>
                  <th className="p-md">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-outline-variant/20 last:border-0">
                    <td className="p-md">
                      <span className="font-bold text-primary block">
                        {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                      </span>
                      <span className="text-on-surface-variant">{u.email}</span>
                    </td>
                    <td className="p-md">{u._count.groups}</td>
                    <td className="p-md">{u._count.importedPosts}</td>
                    <td className="p-md">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-md">
                      <select
                        value={u.role}
                        onChange={e => changeRole(u.id, e.target.value)}
                        className={input + ' w-auto'}
                      >
                        <option value="BUYER">Buyer</option>
                        <option value="SELLER">Seller</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <p className="p-xl text-center text-on-surface-variant">No users yet.</p>}
          </div>
        ) : tab === 'listings' ? (
          <div className="bg-surface rounded-xl border border-outline-variant/30 overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="text-left text-label-sm text-on-surface-variant border-b border-outline-variant/30">
                  <th className="p-md">Listing</th>
                  <th className="p-md">Category</th>
                  <th className="p-md">Seller</th>
                  <th className="p-md">Price</th>
                  <th className="p-md">Status</th>
                  <th className="p-md"></th>
                </tr>
              </thead>
              <tbody>
                {listings.map(l => (
                  <tr key={l.id} className="border-b border-outline-variant/20 last:border-0">
                    <td className="p-md">
                      <Link href={`/listing-detail/${l.id}`} className="font-bold text-primary hover:underline">
                        {l.title}
                      </Link>
                    </td>
                    <td className="p-md">{l.category}</td>
                    <td className="p-md text-on-surface-variant">{l.sellerEmail}</td>
                    <td className="p-md">${l.price.toLocaleString()}</td>
                    <td className="p-md">
                      <span
                        className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                          l.isActive ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
                        }`}
                      >
                        {l.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="p-md text-right">
                      <button
                        onClick={() => toggleListing(l)}
                        className="px-md py-1.5 rounded-lg font-label-sm border border-outline-variant hover:bg-surface-container-low transition-colors"
                      >
                        {l.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {listings.length === 0 && <p className="p-xl text-center text-on-surface-variant">No listings yet.</p>}
          </div>
        ) : (
          <div className="space-y-md">
            {pending.length === 0 && (
              <p className="p-xl text-center text-on-surface-variant bg-surface rounded-xl border border-outline-variant/30">
                No pending posts anywhere. All queues are clear.
              </p>
            )}
            {pending.map(post => (
              <div key={post.id} className="bg-surface rounded-xl border border-outline-variant/30 p-lg">
                <div className="flex justify-between items-start gap-md flex-wrap">
                  <div className="min-w-0">
                    <p className="text-label-sm text-on-surface-variant">
                      {post.groupName} · seller {post.sellerEmail} · {new Date(post.scrapedAt).toLocaleString()}
                    </p>
                    <p className="text-body-md text-primary mt-xs whitespace-pre-line line-clamp-4">{post.rawText}</p>
                  </div>
                  <div className="flex gap-sm shrink-0">
                    <button
                      onClick={() => openApprove(post)}
                      className="px-lg py-2 rounded-lg bg-primary text-on-primary font-label-md"
                    >
                      Approve…
                    </button>
                    <button
                      onClick={() => reject(post)}
                      className="px-lg py-2 rounded-lg border border-outline-variant text-error font-label-md"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {editPost && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-md" onClick={() => setEditPost(null)}>
          <div
            className="bg-surface rounded-xl p-lg w-full max-w-lg space-y-md max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-headline-sm font-bold text-primary">Approve on behalf of {editPost.sellerEmail}</h2>
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-xs">Title</label>
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className={input} />
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-xs">Category</label>
                <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className={input}>
                  {CATEGORIES.map(c => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-xs">Price ($)</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={e => setEditPrice(parseFloat(e.target.value) || 0)}
                  className={input}
                />
              </div>
            </div>
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-xs">Location</label>
              <input value={editLocation} onChange={e => setEditLocation(e.target.value)} className={input} />
            </div>
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-xs">Description</label>
              <textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                rows={5}
                className={input}
              />
            </div>
            <div className="flex justify-end gap-sm">
              <button onClick={() => setEditPost(null)} className="px-lg py-2 rounded-lg border border-outline-variant font-label-md">
                Cancel
              </button>
              <button onClick={submitApprove} className="px-lg py-2 rounded-lg bg-primary text-on-primary font-label-md">
                Publish listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
