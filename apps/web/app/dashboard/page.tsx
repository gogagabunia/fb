'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDashboardStats, triggerScrapingAction } from '../actions';

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

  async function loadData() {
    try {
      const data = await getDashboardStats();
      setStats(data as any);
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

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-64 bg-surface border-r border-outline-variant/30 flex flex-col p-md gap-xs shrink-0 h-full">
          <div className="mb-xl px-xs py-sm">
            <h1 className="text-headline-sm font-bold text-primary">GroupMarket</h1>
            <p className="text-body-sm text-on-surface-variant font-medium">Seller Portal</p>
          </div>
          <nav className="flex-grow flex flex-col gap-xs">
            <Link
              className="flex items-center gap-md px-md py-sm bg-secondary-container text-on-secondary-container font-bold rounded-lg transition-all"
              href="/dashboard"
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span className="text-label-md">Dashboard</span>
            </Link>
            <Link
              className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary rounded-lg transition-all"
              href="/admin"
            >
              <span className="material-symbols-outlined">gavel</span>
              <span className="text-label-md font-medium">Moderation Queue</span>
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
            <span className="text-[11px] text-slate-400 font-semibold uppercase px-md mb-xs">Database Engine</span>
            <div className="flex items-center gap-sm px-md py-xs text-xs text-emerald-600 font-bold bg-emerald-50 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              Live Serverless DB
            </div>
          </div>
        </aside>

        {/* Content Canvas */}
        <main className="flex-grow p-xl overflow-y-auto max-w-container-max h-full">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md mb-xl">
            <div>
              <h2 className="text-display-lg font-bold text-primary">Overview</h2>
              <p className="text-body-lg text-on-surface-variant mt-xs">
                Welcome to your GroupMarket admin hub. Monitor scraped updates and approvals here.
              </p>
            </div>
            <Link
              href="/add-group"
              className="bg-secondary text-on-secondary px-xl py-md rounded-xl font-bold flex items-center gap-sm shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Add New Facebook Group
            </Link>
          </header>

          {loading ? (
            <div className="flex items-center justify-center h-[400px] text-slate-400">
              <span className="material-symbols-outlined animate-spin mr-sm text-3xl">sync</span> Loading system stats...
            </div>
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
