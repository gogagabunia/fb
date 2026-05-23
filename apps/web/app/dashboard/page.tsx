'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDashboardStats, triggerScrapingAction, ingestRawTextAction } from '../actions';
import { getCurrentUser, logoutAction } from '../auth-actions';
import Sidebar from '../components/sidebar';
import { DashboardSkeleton } from '../components/skeleton';

interface ScrapingLog {
  id: string;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING';
  postsScraped: number;
  postsImported: number;
  errorMessage: string | null;
  startedAt: string;
  groupName: string;
}

interface FacebookGroup {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    connectedGroups: 0,
    pendingPosts: 0,
    approvedListings: 0,
    rejectedPosts: 0,
    recentLogs: [] as ScrapingLog[],
    recentGroups: [] as FacebookGroup[]
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [user, setUser] = useState<{ firstName: string | null; lastName: string | null; email: string } | null>(null);

  const [selectedGroup, setSelectedGroup] = useState('');
  const [rawText, setRawText] = useState('');
  const [ingesting, setIngesting] = useState(false);

  useEffect(() => {
    if (stats.recentGroups.length > 0 && !selectedGroup) {
      setSelectedGroup(stats.recentGroups[0].id);
    }
  }, [stats.recentGroups, selectedGroup]);

  async function handleManualIngest(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGroup || !rawText.trim()) {
      showToast('Please select a group and enter listing details.', 'info');
      return;
    }

    setIngesting(true);
    showToast('AI Parsing pasted text block...', 'info');

    try {
      const result = await ingestRawTextAction(selectedGroup, rawText);
      if (result.success) {
        showToast('Successfully imported listing! Added to Moderation Queue.', 'success');
        setRawText('');
        loadData();
      } else {
        showToast(result.error || 'Failed to parse text. Is it a classified ad?', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Manual ingestion failed.', 'error');
    } finally {
      setIngesting(false);
    }
  }

  async function loadData() {
    try {
      const data = await getDashboardStats();
      setStats(data as any);
      const currentUser = await getCurrentUser();
      setUser(currentUser as any);
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
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

  async function handleSync() {
    if (stats.recentGroups.length === 0) {
      showToast('No active Facebook groups connected. Please add one first!', 'info');
      return;
    }
    setSyncing(true);
    showToast('Starting ingestion and AI parsing...', 'info');
    try {
      // Sync first group for demo/test purposes
      const targetGroup = stats.recentGroups[0];
      const result = await triggerScrapingAction(targetGroup.id);
      if (result.success) {
        showToast(`Sync Complete! Found ${result.postsFound} posts, imported ${result.listingsImported} listings into PENDING queue.`, 'success');
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
        <Sidebar activePage="dashboard" user={user} onSync={handleSync} syncing={syncing} />

        {/* Content Canvas */}
        <main className="flex-grow p-md md:p-xl overflow-y-auto max-w-container-max h-full">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md mb-xl">
            <div>
              <h2 className="text-display-lg font-bold text-primary">Overview</h2>
              <p className="text-body-lg text-on-surface-variant mt-xs">
                Welcome to your GroupMarket admin hub. Monitor scraped updates and approvals here.
              </p>
            </div>
            <div className="flex flex-wrap gap-sm">
              <Link
                href="/dashboard/analytics"
                className="bg-primary text-on-primary px-xl py-md rounded-xl font-bold flex items-center gap-sm shadow-md hover:shadow-lg transition-all active:scale-95 text-label-md"
              >
                <span className="material-symbols-outlined">analytics</span>
                View Analytics
              </Link>
              <Link
                href="/add-group"
                className="bg-secondary text-on-secondary px-xl py-md rounded-xl font-bold flex items-center gap-sm shadow-md hover:shadow-lg transition-all active:scale-95 text-label-md"
              >
                <span className="material-symbols-outlined">add_circle</span>
                Add New Facebook Group
              </Link>
            </div>
          </header>

          {loading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {/* Stats Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
                <div className="bg-surface-container-lowest border border-outline-variant/30 p-xl rounded-xl shadow-sm flex flex-col">
                  <span className="text-on-surface-variant text-label-md font-semibold mb-xs">Connected Groups</span>
                  <div className="flex items-center justify-between">
                    <span className="text-display-lg font-bold text-primary">{stats.connectedGroups}</span>
                    <span className="bg-secondary-container text-on-secondary-container px-sm py-xs rounded-full text-label-sm font-bold">
                      Active Ingest
                    </span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant/30 p-xl rounded-xl shadow-sm flex flex-col">
                  <span className="text-on-surface-variant text-label-md font-semibold mb-xs">Pending Reviews</span>
                  <div className="flex items-center justify-between">
                    <span className="text-display-lg font-bold text-primary">{stats.pendingPosts}</span>
                    <Link
                      href="/admin"
                      className="bg-error-container text-on-error-container px-sm py-xs rounded-full text-label-sm font-bold hover:scale-[1.02] transition-all"
                    >
                      Needs Review
                    </Link>
                  </div>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant/30 p-xl rounded-xl shadow-sm flex flex-col">
                  <span className="text-on-surface-variant text-label-md font-semibold mb-xs">Live Listings</span>
                  <div className="flex items-center justify-between">
                    <span className="text-display-lg font-bold text-primary">{stats.approvedListings}</span>
                    <span className="bg-surface-container-high text-on-surface-variant px-sm py-xs rounded-full text-label-sm font-bold">
                      Public Feed
                    </span>
                  </div>
                </div>
              </div>

              {/* Groups empty state vs grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg mb-xxl">
                {/* Left Side: Scraping Logs / Overview */}
                <div className="lg:col-span-8 space-y-lg">
                  {stats.connectedGroups === 0 ? (
                    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-xxl text-center min-h-[400px] flex flex-col items-center justify-center shadow-sm">
                      <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-lg">
                        <span className="material-symbols-outlined text-[48px] text-secondary">social_leaderboard</span>
                      </div>
                      <h3 className="text-headline-md font-bold text-primary mb-sm">Connect your first Facebook group</h3>
                      <p className="text-body-md text-on-surface-variant max-w-md mx-auto mb-xl">
                        Ingest cars, parts, electronics or any classified post automatically. Connect your first group and configure the scanning terms now.
                      </p>
                      <div className="flex gap-md">
                        <Link
                          href="/add-group"
                          className="bg-secondary text-on-secondary px-xl py-md rounded-xl font-bold flex items-center gap-xs shadow-md"
                        >
                          <span className="material-symbols-outlined">link</span> Add Group Wizard
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-sm overflow-hidden">
                      <div className="p-xl border-b border-outline-variant/30">
                        <h3 className="text-headline-sm font-bold text-primary">Scraping Ingestion History</h3>
                        <p className="text-body-sm text-slate-500 mt-xs">Real-time status of Playwright scraper run cycles.</p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-surface-container-low border-b border-outline-variant/30 text-label-sm font-bold text-on-surface-variant uppercase">
                              <th className="px-lg py-md">Facebook Group</th>
                              <th className="px-lg py-md">Scrape Status</th>
                              <th className="px-lg py-md">Posts Checked</th>
                              <th className="px-lg py-md">Ingested Ads</th>
                              <th className="px-lg py-md">Date scanned</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/20">
                            {stats.recentLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-lg py-md font-bold text-primary">{log.groupName}</td>
                                <td className="px-lg py-md">
                                  <span
                                    className={`px-sm py-1 rounded text-xs font-bold ${
                                      log.status === 'SUCCESS'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-red-50 text-red-700'
                                    }`}
                                  >
                                    {log.status}
                                  </span>
                                </td>
                                <td className="px-lg py-md font-medium text-slate-600">{log.postsScraped}</td>
                                <td className="px-lg py-md font-bold text-secondary">{log.postsImported}</td>
                                <td className="px-lg py-md text-slate-500">
                                  {new Date(log.startedAt).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side: Connected Groups List */}
                <div className="lg:col-span-4 space-y-lg">
                  <div className="bg-surface-container-lowest border border-outline-variant/30 p-xl rounded-xl shadow-sm">
                    <h3 className="text-label-md font-bold text-on-tertiary-container uppercase tracking-wider mb-lg">
                      Active Scanning Sources
                    </h3>
                    {stats.recentGroups.length === 0 ? (
                      <p className="text-body-sm text-slate-400">No active sources connected.</p>
                    ) : (
                      <div className="space-y-md">
                        {stats.recentGroups.map((group) => (
                          <div
                            key={group.id}
                            className="p-md bg-surface-container-low rounded-xl border border-outline-variant/20 flex justify-between items-center"
                          >
                            <div className="min-w-0">
                              <h4 className="font-bold text-primary text-label-md truncate">{group.name}</h4>
                              <a
                                href={group.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-secondary hover:underline truncate block"
                              >
                                View Group Source
                              </a>
                            </div>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Manual Paste Ingestion Portal */}
                  {stats.recentGroups.length > 0 && (
                    <div className="bg-surface-container-lowest border border-outline-variant/30 p-xl rounded-xl shadow-sm space-y-md">
                      <div>
                        <h3 className="text-label-md font-bold text-on-tertiary-container uppercase tracking-wider block">
                          Manual Feed Ingest
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-xs leading-relaxed">
                          Copy raw post text from Facebook, paste below, and AI will automatically parse the listing.
                        </p>
                      </div>

                      <form onSubmit={handleManualIngest} className="space-y-md">
                        <div className="flex flex-col gap-xs">
                          <label className="text-[11px] font-bold text-slate-500 uppercase">Select Target Group</label>
                          <select
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                            className="w-full h-10 px-md rounded-lg border border-outline-variant/60 focus:border-primary outline-none text-xs font-semibold bg-white"
                          >
                            {stats.recentGroups.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col gap-xs">
                          <label className="text-[11px] font-bold text-slate-500 uppercase">Paste Classified Raw Text</label>
                          <textarea
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            required
                            rows={4}
                            className="p-md rounded-lg border border-outline-variant/60 focus:border-primary outline-none text-xs font-medium leading-relaxed resize-none bg-white"
                            placeholder="Example: Selling my 2018 Honda Accord EX-L in pristine condition. Asking $18,500..."
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={ingesting}
                          className="w-full py-md bg-secondary text-on-secondary rounded-lg text-label-sm font-bold flex items-center justify-center gap-xs shadow hover:opacity-90 active:scale-[0.98] transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">{ingesting ? 'sync' : 'auto_awesome'}</span>
                          {ingesting ? 'AI Classification...' : 'Import Listing via AI'}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Pro Subscription Advert Card */}
                  <div className="bg-primary text-on-primary p-xl rounded-xl shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                      <h3 className="text-headline-sm font-bold mb-sm">Enterprise Syncing</h3>
                      <p className="text-body-sm text-slate-300 mb-lg">
                        Unlock hourly scrapers, unlimited keywords, proxy tunnels, and instant SMS alerts.
                      </p>
                      <button className="bg-secondary text-on-secondary px-lg py-2 rounded-lg text-label-md font-bold shadow-md hover:scale-[1.02] transition-transform">
                        Upgrade Tier
                      </button>
                    </div>
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-secondary/20 rounded-full blur-2xl"></div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
