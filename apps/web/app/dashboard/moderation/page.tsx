'use client';

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { formatPrice } from '../../lib/format-price';
import {
  getImportedPosts,
  approvePostAction,
  rejectPostAction,
  getDashboardStats,
  triggerScrapingAction,
  getFacebookGroups
} from '../../actions';
import { getCurrentUser, logoutAction } from '../../auth-actions';
import Sidebar from '../../components/sidebar';
import { CATEGORIES, FALLBACK_CATEGORY, matchCategoryGuess } from '../../lib/categories';
import { makeT } from '../../lib/i18n';
import { moderationStrings } from '../../lib/i18n/moderation';
import { useLang } from '../../components/lang-provider';

interface ImportedPost {
  id: string;
  fbPostId: string;
  rawText: string;
  images: string[];
  authorName: string;
  authorProfile: string | null;
  priceScraped: number | null;
  parsedCategory: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  scrapedAt: any;
  group: {
    id: string;
    name: string;
  };
}

export default function AdminPage() {
  const lang = useLang();
  const tr = makeT(moderationStrings, lang);
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
  // Holds the fixed-list slug — the value approvePostAction validates.
  const [editCategory, setEditCategory] = useState(FALLBACK_CATEGORY.slug);
  const [editPrice, setEditPrice] = useState(0);
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('Scottsdale, AZ');

  const [rejectPost, setRejectPost] = useState<ImportedPost | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      showToast(tr('loadFailed'), 'error');
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
      showToast(tr('noGroupsConnected'), 'info');
      return;
    }
    setSyncing(true);
    showToast(tr('syncStarting').replace('{n}', String(groups.length)), 'info');
    try {
      let totalFound = 0;
      let totalImported = 0;
      const failures: string[] = [];

      // Every connected group, not just the first. This used to sync groups[0]
      // only ("for demo/test purposes"), so anyone with more than one group had
      // the rest silently skipped on every manual sync.
      for (const group of groups) {
        // One group failing (an expired Facebook session, say) must not stop
        // the others, so each is handled on its own.
        try {
          const result = await triggerScrapingAction(group.id);
          if (result.success) {
            totalFound += result.postsFound || 0;
            totalImported += result.listingsImported || 0;
          } else {
            failures.push(`${group.name}: ${result.error || tr('unknownError')}`);
          }
        } catch (err: any) {
          failures.push(`${group.name}: ${err?.message || tr('unknownError')}`);
        }
      }

      if (failures.length === groups.length) {
        showToast(tr('syncFailed').replace('{err}', failures[0]), 'error');
      } else if (failures.length > 0) {
        showToast(
          tr('syncPartial')
            .replace('{ok}', String(groups.length - failures.length))
            .replace('{total}', String(groups.length))
            .replace('{found}', String(totalFound))
            .replace('{imported}', String(totalImported))
            .replace('{failures}', failures.join('; ')),
          'info'
        );
      } else {
        showToast(
          tr('syncComplete')
            .replace('{found}', String(totalFound))
            .replace('{imported}', String(totalImported)),
          'success'
        );
      }
    } catch (error: any) {
      console.error('Scraping failed:', error);
      showToast(tr('scrapingFailed').replace('{err}', error.message || tr('unknownError')), 'error');
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
    const guessedTitle = firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine || tr('listingFrom').replace('{name}', post.authorName);
    setEditTitle(guessedTitle);
    // Pre-select the AI's guess where it maps onto the fixed list; Other otherwise.
    setEditCategory(matchCategoryGuess(post.parsedCategory).slug);
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
        showToast(tr('approveSuccess'), 'success');
        setEditPost(null);
        loadData();
      } else {
        showToast(tr('approveFailed').replace('{err}', response.error ?? ''), 'error');
      }
    } catch (error: any) {
      showToast(tr('errorGeneric').replace('{err}', error.message), 'error');
    }
  }

  async function handleRejectSubmit() {
    if (!rejectPost) return;
    try {
      const response = await rejectPostAction(rejectPost.id, rejectReason);
      if (response.success) {
        showToast(tr('rejectSuccess'), 'info');
        setRejectPost(null);
        setRejectReason('');
        loadData();
      } else {
        showToast(tr('rejectFailed').replace('{err}', response.error ?? ''), 'error');
      }
    } catch (error: any) {
      showToast(tr('errorGeneric').replace('{err}', error.message), 'error');
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

      <div className="flex flex-col md:flex-row h-screen overflow-hidden">
        {/* Shared Sidebar */}
        <Sidebar activePage="moderation" user={user} onSync={handleSync} syncing={syncing} />

        {/* Content Canvas */}
        <main className="flex-grow p-md md:p-xl overflow-y-auto max-w-container-max h-full">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md mb-xl">
            <div>
              <h2 className="text-display-lg font-bold text-primary">{tr('pageTitle')}</h2>
              <p className="text-body-lg text-on-surface-variant mt-xs">
                {tr('pageSubtitle')}
              </p>
            </div>
            <div className="flex gap-md w-full md:w-auto">
              <div className="relative flex-grow md:flex-grow-0">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">
                  search
                </span>
                <input
                  className="pl-xl pr-md py-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all w-full md:w-64 outline-none"
                  placeholder={tr('searchPlaceholder')}
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
              <span className="text-label-sm text-on-surface-variant/70 font-semibold uppercase">{tr('statPending')}</span>
              <div className="text-headline-lg font-bold text-primary mt-xs">{stats.pendingPosts}</div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-sm">
              <span className="text-label-sm text-on-surface-variant/70 font-semibold uppercase">{tr('statLive')}</span>
              <div className="text-headline-lg font-bold text-secondary mt-xs">{stats.approvedListings}</div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-sm">
              <span className="text-label-sm text-on-surface-variant/70 font-semibold uppercase">{tr('statRejected')}</span>
              <div className="text-headline-lg font-bold text-error mt-xs">{stats.rejectedPosts}</div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-sm">
              <span className="text-label-sm text-on-surface-variant/70 font-semibold uppercase">{tr('statGroups')}</span>
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
                {tr(`tab${tab}`)} ({posts.filter((p) => p.status === tab).length})
              </button>
            ))}
          </div>

          {/* Table Container */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden mb-xxl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/30">
                    <th className="px-lg py-md text-label-sm font-bold text-on-surface-variant uppercase">{tr('thPost')}</th>
                    <th className="px-lg py-md text-label-sm font-bold text-on-surface-variant uppercase">{tr('thGroup')}</th>
                    <th className="px-lg py-md text-label-sm font-bold text-on-surface-variant uppercase">{tr('thDate')}</th>
                    <th className="px-lg py-md text-label-sm font-bold text-on-surface-variant uppercase text-right">
                      {tr('thActions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {loading ? (
                    [1, 2, 3].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-lg py-md align-top">
                          <div className="flex gap-md">
                            <div className="w-20 h-16 bg-slate-100 rounded-lg shrink-0"></div>
                            <div className="space-y-2 w-2/3">
                              <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                              <div className="h-4 bg-slate-100 rounded w-full"></div>
                              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-lg py-md align-middle">
                          <div className="h-4 bg-slate-100 rounded w-20"></div>
                        </td>
                        <td className="px-lg py-md align-middle">
                          <div className="h-4 bg-slate-100 rounded w-16"></div>
                        </td>
                        <td className="px-lg py-md align-middle text-right">
                          <div className="h-8 bg-slate-100 rounded w-24 ml-auto"></div>
                        </td>
                      </tr>
                    ))
                  ) : filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-lg py-xl text-center text-on-surface-variant/60">
                        <div className="flex flex-col items-center gap-sm">
                          <span className="material-symbols-outlined text-[48px] text-outline">inbox</span>
                          <p className="text-body-md font-bold">{tr('emptyTitle').replace('{tab}', tr(`status${activeTab}`))}</p>
                          <p className="text-body-sm text-on-surface-variant/80">
                            {activeTab === 'PENDING'
                              ? tr('emptyPendingHint')
                              : tr('emptyOtherHint')}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPosts.map((post) => (
                    <Fragment key={post.id}>
                      <tr className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-lg py-md align-top">
                          <div
                            className="flex gap-md max-w-lg cursor-pointer"
                            onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
                            title={tr('clickForDetails')}
                          >
                            {post.images && post.images.length > 0 ? (
                              <img
                                src={post.images[0]}
                                className="w-16 h-16 object-cover rounded-lg border border-outline-variant/30 shadow-sm shrink-0"
                                alt=""
                              />
                            ) : (
                              <div
                                className="w-16 h-16 rounded-lg border border-dashed border-outline-variant/50 bg-surface-container-low flex items-center justify-center shrink-0"
                                title={tr('noImage')}
                              >
                                <span className="material-symbols-outlined text-on-surface-variant/60 text-[22px]">image_not_supported</span>
                              </div>
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="text-label-md font-bold text-primary line-clamp-1 flex items-center gap-xs">
                                {tr('byAuthor').replace('{name}', post.authorName)}
                                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                                  {expandedId === post.id ? 'expand_less' : 'expand_more'}
                                </span>
                              </span>
                              <span className="text-body-sm text-on-surface-variant font-medium mt-xs">
                                {tr('classifiedPrice')}{' '}
                                <span className="font-bold text-secondary">
                                  {post.priceScraped ? formatPrice(post.priceScraped) : tr('notScraped')}
                                </span>
                              </span>
                              <p className={`text-body-sm text-on-surface-variant/80 mt-sm italic ${expandedId === post.id ? '' : 'line-clamp-2'}`}>
                                "{post.rawText || tr('noText')}"
                              </p>
                              {post.rejectionReason && (
                                <div className="mt-sm p-sm bg-red-50 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-xs">
                                  <span className="material-symbols-outlined text-sm">error</span>
                                  {tr('reasonLabel')} {post.rejectionReason}
                                </div>
                              )}
                              <span className="text-[11px] text-secondary font-semibold mt-xs">
                                {expandedId === post.id ? tr('hideDetails') : tr('showDetails')}
                              </span>
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
                                  title={tr('approveAction')}
                                >
                                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                </button>
                                <button
                                  onClick={() => setRejectPost(post)}
                                  className="p-md text-error hover:bg-error-container bg-error-container/20 rounded-lg transition-all flex items-center justify-center"
                                  title={tr('rejectAction')}
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
                              title={tr('viewOriginal')}
                            >
                              <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                      {expandedId === post.id && (
                        <tr className="bg-surface-container-low/40">
                          <td colSpan={4} className="px-lg py-lg">
                            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-lg space-y-lg">
                              <h4 className="text-label-md font-bold text-primary uppercase tracking-wide">{tr('postDetails')}</h4>

                              {/* Full text */}
                              <div>
                                <span className="text-xs font-bold text-on-surface-variant uppercase">{tr('fullText')}</span>
                                <p className="text-body-md text-on-surface mt-xs whitespace-pre-wrap">
                                  {post.rawText || tr('noTextCaptured')}
                                </p>
                              </div>

                              {/* Attribute grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
                                {[
                                  [tr('attrAuthor'), post.authorName || '—'],
                                  [tr('attrPriceScraped'), post.priceScraped != null ? formatPrice(post.priceScraped) : tr('notFound')],
                                  [tr('attrGroup'), post.group?.name || '—'],
                                  [tr('attrStatus'), tr(`status${post.status}`)],
                                  [tr('attrScrapedAt'), new Date(post.scrapedAt).toLocaleString()],
                                  [tr('attrImages'), String(post.images?.length || 0)],
                                ].map(([label, value]) => (
                                  <div key={label as string} className="p-sm rounded-lg bg-surface-container-low/50">
                                    <span className="text-[11px] font-bold text-on-surface-variant uppercase block">{label}</span>
                                    <span className="text-body-sm text-on-surface font-medium break-words">{value}</span>
                                  </div>
                                ))}
                                <div className="p-sm rounded-lg bg-surface-container-low/50">
                                  <span className="text-[11px] font-bold text-on-surface-variant uppercase block">{tr('authorProfile')}</span>
                                  {post.authorProfile ? (
                                    <a href={post.authorProfile} target="_blank" rel="noreferrer" className="text-body-sm text-secondary font-medium hover:underline break-all">{tr('openProfile')}</a>
                                  ) : (
                                    <span className="text-body-sm text-on-surface-variant">—</span>
                                  )}
                                </div>
                                <div className="p-sm rounded-lg bg-surface-container-low/50 sm:col-span-2">
                                  <span className="text-[11px] font-bold text-on-surface-variant uppercase block">{tr('originalPost')}</span>
                                  {post.fbPostId ? (
                                    <a href={post.fbPostId} target="_blank" rel="noreferrer" className="text-body-sm text-secondary font-medium hover:underline break-all">{post.fbPostId}</a>
                                  ) : (
                                    <span className="text-body-sm text-on-surface-variant">—</span>
                                  )}
                                </div>
                              </div>

                              {/* Image gallery */}
                              {post.images && post.images.length > 0 && (
                                <div>
                                  <span className="text-xs font-bold text-on-surface-variant uppercase">{tr('imagesCount').replace('{n}', String(post.images.length))}</span>
                                  <div className="flex flex-wrap gap-sm mt-xs">
                                    {post.images.map((img, i) => (
                                      <a key={i} href={img} target="_blank" rel="noreferrer">
                                        <img src={img} alt="" className="w-24 h-24 object-cover rounded-lg border border-outline-variant/30" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
                <span className="material-symbols-outlined text-secondary">verified</span> {tr('approveModalTitle')}
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
                <label className="block text-label-sm font-bold text-on-surface-variant mb-xs">{tr('itemTitle')}</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-md bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block text-label-sm font-bold text-on-surface-variant mb-xs">{tr('category')}</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full p-md bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.slug} value={c.slug}>{lang === 'ka' ? c.nameKa : c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-label-sm font-bold text-on-surface-variant mb-xs">{tr('price')}</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-md bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-xs">{tr('location')}</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full p-md bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-xs">{tr('description')}</label>
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
                {tr('cancel')}
              </button>
              <button
                onClick={handleApproveSubmit}
                className="px-lg py-md bg-secondary text-on-secondary hover:bg-secondary/95 rounded-lg font-bold shadow-lg transition-all"
              >
                {tr('publishLive')}
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
                <span className="material-symbols-outlined text-error">cancel</span> {tr('rejectModalTitle')}
              </h3>
              <button
                onClick={() => setRejectPost(null)}
                className="p-xs text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-body-sm text-on-surface-variant mb-md">
              {tr('rejectPrompt')}
            </p>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-md bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none mb-lg"
              placeholder={tr('rejectPlaceholder')}
            ></textarea>
            <div className="flex justify-end gap-sm">
              <button
                onClick={() => setRejectPost(null)}
                className="px-md py-sm text-on-surface-variant hover:bg-surface-container-low rounded-lg font-bold transition-all"
              >
                {tr('cancel')}
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-md py-sm bg-error text-on-error hover:bg-error/90 rounded-lg font-bold shadow-md transition-all animate-pulse"
              >
                {tr('rejectConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
