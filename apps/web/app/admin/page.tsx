'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getImportedPosts,
  approvePostAction,
  rejectPostAction,
  getDashboardStats,
  triggerScrapingAction,
  getFacebookGroups
} from '../actions';
import { getCurrentUser, logoutAction } from '../auth-actions';

interface ImportedPost {
  id: string;
  fbPostId: string;
  rawText: string;
  images: string[];
  authorName: string;
  authorProfile: string | null;
  priceScraped: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  scrapedAt: any;
  group: {
    id: string;
    name: string;
  };
}

export default function AdminPage() {
  const [posts, setPosts] = useState<ImportedPost[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');

  // Stats
  const [stats, setStats] = useState({
    connectedGroups: 0,
    pendingPosts: 0,
    approvedListings: 0,
    rejectedPosts: 0,
  });

  // Modal States
  const [editPost, setEditPost] = useState<ImportedPost | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Vehicles');
  const [editPrice, setEditPrice] = useState(0);
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('Scottsdale, AZ');

  const [rejectPost, setRejectPost] = useState<ImportedPost | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [user, setUser] = useState<{ firstName: string | null; lastName: string | null; email: string } | null>(null);

  // Load everything
  async function loadData() {
    setLoading(true);
    try {
      const allPosts = await getImportedPosts();
      setPosts(allPosts as any[]);
      
      const dbStats = await getDashboardStats();
      setStats({
        connectedGroups: dbStats.connectedGroups,
        pendingPosts: dbStats.pendingPosts,
        approvedListings: dbStats.approvedListings,
        rejectedPosts: dbStats.rejectedPosts,
      });

      const dbGroups = await getFacebookGroups();
      setGroups(dbGroups);

      const currentUser = await getCurrentUser();
      setUser(currentUser as any);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      showToast('Failed to load data from database.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }

  // Action: Trigger Scraping Ingestion
  async function handleSync() {
    if (groups.length === 0) {
      showToast('No active Facebook groups connected. Please add one first!', 'info');
      return;
    }
    setSyncing(true);
    showToast('Starting ingestion and AI parsing...', 'info');
    try {
      let totalFound = 0;
      let totalImported = 0;
      // Sync first group for demo/test purposes
      const targetGroup = groups[0];
      const result = await triggerScrapingAction(targetGroup.id);
      if (result.success) {
        totalFound = result.postsFound || 0;
        totalImported = result.listingsImported || 0;
        showToast(`Sync Complete! Found ${totalFound} posts, imported ${totalImported} listings into PENDING queue.`, 'success');
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Scraping failed:', error);
      showToast(`Scraping failed: ${error.message || 'Unknown error'}. Preserving existing entries.`, 'error');
    } finally {
      setSyncing(false);
      loadData();
    }
  }

  // Modal handlers
  function openApproveModal(post: ImportedPost) {
    setEditPost(post);
    // Guess a title by stripping some characters
    const firstLine = post.rawText.split('\n')[0] || '';
    const guessedTitle = firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine || `Listing from ${post.authorName}`;
    setEditTitle(guessedTitle);
    setEditCategory('Vehicles'); // Default or parsed
    setEditPrice(post.priceScraped || 0);
    setEditDescription(post.rawText);
    setEditLocation('Scottsdale, AZ');
  }

  async function handleApproveSubmit() {
    if (!editPost) return;
    try {
      const response = await approvePostAction(editPost.id, {
        title: editTitle,
        price: editPrice,
        description: editDescription,
        category: editCategory,
        location: editLocation,
        specs: {
          scrapedPrice: editPost.priceScraped,
          scrapedAuthor: editPost.authorName
        }
      });

      if (response.success) {
        showToast('Listing successfully approved and published live!', 'success');
        setEditPost(null);
        loadData();
      } else {
        showToast(`Approval failed: ${response.error}`, 'error');
      }
    } catch (error: any) {
      showToast(`Error: ${error.message}`, 'error');
    }
  }

  async function handleRejectSubmit() {
    if (!rejectPost) return;
    try {
      const response = await rejectPostAction(rejectPost.id, rejectReason);
      if (response.success) {
        showToast('Listing rejected and marked in queue.', 'info');
        setRejectPost(null);
        setRejectReason('');
        loadData();
      } else {
        showToast(`Rejection failed: ${response.error}`, 'error');
      }
    } catch (error: any) {
      showToast(`Error: ${error.message}`, 'error');
    }
  }

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    if (post.status !== activeTab) return false;
    if (!search) return true;
    return (
      post.rawText.toLowerCase().includes(search.toLowerCase()) ||
      post.authorName.toLowerCase().includes(search.toLowerCase()) ||
      post.group.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans selection:bg-secondary-container">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-lg right-lg flex flex-col gap-sm z-50 animate-bounce">
          <div
            className={`px-md py-sm rounded-lg shadow-lg flex items-center gap-sm text-white ${
              toast.type === 'success' ? 'bg-secondary' : toast.type === 'error' ? 'bg-error' : 'bg-primary'
            }`}
          >
            <span className="material-symbols-outlined">
              {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'cancel' : 'info'}
            </span>
            <span className="text-label-md font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-64 bg-surface border-r border-outline-variant/30 flex flex-col p-md gap-xs shrink-0 h-full">
          <div className="mb-xl px-xs py-sm">
            <h1 className="text-headline-sm font-bold text-primary">GroupMarket</h1>
            <p className="text-body-sm text-on-surface-variant font-medium truncate">
              {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Moderator Portal'}
            </p>
          </div>
          <nav className="flex-grow flex flex-col gap-xs">
            <Link
              className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary rounded-lg transition-all"
              href="/dashboard"
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span className="text-label-md font-medium">Dashboard</span>
            </Link>
            <Link
              className="flex items-center gap-md px-md py-sm bg-secondary-container text-on-secondary-container font-bold rounded-lg transition-all"
              href="/admin"
            >
              <span className="material-symbols-outlined">gavel</span>
              <span className="text-label-md">Moderation Queue</span>
            </Link>
            <Link
              className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary rounded-lg transition-all"
              href="/add-group"
            >
              <span className="material-symbols-outlined">groups</span>
              <span className="text-label-md font-medium">Connected Groups</span>
            </Link>
            <Link
              className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary rounded-lg transition-all"
              href="/marketplace"
            >
              <span className="material-symbols-outlined">storefront</span>
              <span className="text-label-md font-medium">View Marketplace</span>
            </Link>
          </nav>

          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`mt-lg mb-md w-full py-md bg-primary text-on-primary rounded-lg text-label-md font-bold shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-xs ${
              syncing ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
            }`}
          >
            <span className={`material-symbols-outlined ${syncing ? 'animate-spin' : ''}`}>sync</span>
            {syncing ? 'Parsing Posts...' : 'Sync New Posts'}
          </button>

          <div className="border-t border-outline-variant/30 pt-md flex flex-col gap-xs">
            <span className="text-[11px] text-slate-400 font-semibold uppercase px-md mb-xs">Environment</span>
            <div className="flex items-center gap-sm px-md py-xs text-xs text-emerald-600 font-bold bg-emerald-50 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              Live Serverless DB
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="mt-sm w-full py-sm text-on-surface-variant hover:bg-error-container hover:text-on-error-container rounded-lg text-label-md font-medium transition-all flex items-center justify-center gap-xs"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        {/* Content Canvas */}
        <main className="flex-grow p-xl overflow-y-auto max-w-container-max h-full">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md mb-xl">
            <div>
              <h2 className="text-display-lg font-bold text-primary">Approval Queue</h2>
              <p className="text-body-lg text-on-surface-variant mt-xs">
                Review and moderate raw posts scraped from connected Facebook groups.
              </p>
            </div>
            <div className="flex gap-md w-full md:w-auto">
              <div className="relative flex-grow md:flex-grow-0">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">
                  search
                </span>
                <input
                  className="pl-xl pr-md py-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all w-full md:w-64 outline-none"
                  placeholder="Search imports..."
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </header>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-lg mb-xl">
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-sm">
              <span className="text-label-sm text-on-surface-variant/70 font-semibold uppercase">Pending In Queue</span>
              <div className="text-headline-lg font-bold text-primary mt-xs">{stats.pendingPosts}</div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-sm">
              <span className="text-label-sm text-on-surface-variant/70 font-semibold uppercase">Live Listings</span>
              <div className="text-headline-lg font-bold text-secondary mt-xs">{stats.approvedListings}</div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-sm">
              <span className="text-label-sm text-on-surface-variant/70 font-semibold uppercase">Rejected Posts</span>
              <div className="text-headline-lg font-bold text-error mt-xs">{stats.rejectedPosts}</div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-sm">
              <span className="text-label-sm text-on-surface-variant/70 font-semibold uppercase">Facebook Groups</span>
              <div className="text-headline-lg font-bold text-primary mt-xs">{stats.connectedGroups}</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-outline-variant/30 mb-lg flex gap-lg">
            {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-md px-xs font-label-md text-label-md transition-all relative ${
                  activeTab === tab
                    ? 'text-primary font-bold border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {tab} review ({posts.filter((p) => p.status === tab).length})
              </button>
            ))}
          </div>

          {/* Table Container */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden mb-xxl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/30">
                    <th className="px-lg py-md text-label-sm font-bold text-on-surface-variant uppercase">Post Details</th>
                    <th className="px-lg py-md text-label-sm font-bold text-on-surface-variant uppercase">Group</th>
                    <th className="px-lg py-md text-label-sm font-bold text-on-surface-variant uppercase">Date Scraped</th>
                    <th className="px-lg py-md text-label-sm font-bold text-on-surface-variant uppercase text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-lg py-xl text-center text-slate-400">
                        <span className="material-symbols-outlined animate-spin mr-sm">sync</span> Loading imported posts...
                      </td>
                    </tr>
                  ) : filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-lg py-xl text-center text-on-surface-variant/60">
                        <div className="flex flex-col items-center gap-sm">
                          <span className="material-symbols-outlined text-[48px] text-outline">inbox</span>
                          <p className="text-body-md font-bold">No entries in {activeTab}</p>
                          <p className="text-body-sm text-on-surface-variant/80">
                            {activeTab === 'PENDING'
                              ? 'Scraped and classified items will appear here for review.'
                              : 'No matching records.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPosts.map((post) => (
                      <tr key={post.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-lg py-md align-top">
                          <div className="flex gap-md max-w-lg">
                            <img
                              src={
                                post.images[0] ||
                                'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=500'
                              }
                              className="w-16 h-16 object-cover rounded-lg border border-outline-variant/30 shadow-sm shrink-0"
                              alt=""
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-label-md font-bold text-primary line-clamp-1">
                                By {post.authorName}
                              </span>
                              <span className="text-body-sm text-on-surface-variant font-medium mt-xs">
                                Classified Price:{' '}
                                <span className="font-bold text-secondary">
                                  {post.priceScraped ? `$${post.priceScraped.toLocaleString()}` : 'Not Scraped'}
                                </span>
                              </span>
                              <p className="text-body-sm text-on-surface-variant/80 mt-sm line-clamp-2 italic">
                                "{post.rawText}"
                              </p>
                              {post.rejectionReason && (
                                <div className="mt-sm p-sm bg-red-50 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-xs">
                                  <span className="material-symbols-outlined text-sm">error</span>
                                  Reason: {post.rejectionReason}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-lg py-md align-middle text-body-sm text-on-surface-variant font-bold">
                          {post.group.name}
                        </td>
                        <td className="px-lg py-md align-middle text-body-sm text-on-surface-variant/80">
                          {new Date(post.scrapedAt).toLocaleDateString()}
                        </td>
                        <td className="px-lg py-md align-middle text-right">
                          <div className="flex justify-end gap-sm">
                            {post.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => openApproveModal(post)}
                                  className="p-md text-on-secondary-container hover:bg-secondary-container/50 bg-secondary-container/20 rounded-lg transition-all flex items-center justify-center"
                                  title="Approve & Format"
                                >
                                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                </button>
                                <button
                                  onClick={() => setRejectPost(post)}
                                  className="p-md text-error hover:bg-error-container bg-error-container/20 rounded-lg transition-all flex items-center justify-center"
                                  title="Reject Post"
                                >
                                  <span className="material-symbols-outlined text-[20px]">cancel</span>
                                </button>
                              </>
                            )}
                            <a
                              href={post.fbPostId}
                              target="_blank"
                              rel="noreferrer"
                              className="p-md text-primary hover:bg-surface-container-high rounded-lg transition-all flex items-center justify-center"
                              title="View original on Facebook"
                            >
                              <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Moderation & Approve Edit Modal */}
      {editPost && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-md overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-2xl p-lg max-w-lg w-full border border-outline-variant/30 shadow-2xl relative">
            <div className="flex justify-between items-center mb-lg">
              <h3 className="text-headline-md font-bold text-primary flex items-center gap-xs">
                <span className="material-symbols-outlined text-secondary">verified</span> Approve & Format Listing
              </h3>
              <button
                onClick={() => setEditPost(null)}
                className="p-sm text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-md mb-lg">
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-xs">Item Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-md bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block text-label-sm font-bold text-on-surface-variant mb-xs">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full p-md bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  >
                    <option value="Vehicles">Vehicles</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-label-sm font-bold text-on-surface-variant mb-xs">Price ($)</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-md bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-xs">Location</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full p-md bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-xs">Description</label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-md bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-sm border-t border-outline-variant/20 pt-lg">
              <button
                onClick={() => setEditPost(null)}
                className="px-lg py-md text-on-surface-variant hover:bg-surface-container-low rounded-lg font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveSubmit}
                className="px-lg py-md bg-secondary text-on-secondary hover:bg-secondary/95 rounded-lg font-bold shadow-lg transition-all"
              >
                Publish Live Listing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectPost && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-md">
          <div className="bg-surface-container-lowest rounded-2xl p-lg max-w-md w-full border border-outline-variant/30 shadow-2xl relative">
            <div className="flex justify-between items-center mb-md">
              <h3 className="text-headline-sm font-bold text-primary flex items-center gap-xs">
                <span className="material-symbols-outlined text-error">cancel</span> Reject Listing
              </h3>
              <button
                onClick={() => setRejectPost(null)}
                className="p-xs text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-body-sm text-on-surface-variant mb-md">
              Please provide a reason for rejecting this imported post. This reason will be logged for reference.
            </p>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-md bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none mb-lg"
              placeholder="e.g. Missing vehicle mileage details or pricing is unverified..."
            ></textarea>
            <div className="flex justify-end gap-sm">
              <button
                onClick={() => setRejectPost(null)}
                className="px-md py-sm text-on-surface-variant hover:bg-surface-container-low rounded-lg font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-md py-sm bg-error text-on-error hover:bg-error/90 rounded-lg font-bold shadow-md transition-all animate-pulse"
              >
                Reject Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
