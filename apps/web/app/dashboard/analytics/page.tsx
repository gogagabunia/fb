'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAnalyticsSummaryAction } from '../../actions';
import { getCurrentUser } from '../../auth-actions';
import Sidebar from '../../components/sidebar';
import { DashboardSkeleton } from '../../components/skeleton';

interface TopListing {
  id: string;
  title: string;
  price: number;
  viewsCount: number;
  clicksCount: number;
  category: string;
}

interface DailyView {
  date: string;
  views: number;
}

interface AnalyticsSummary {
  totalViews: number;
  totalClicks: number;
  contactClicks: number;
  fbClicks: number;
  ctr: number;
  topListings: TopListing[];
  dailyViews: DailyView[];
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const stats = await getAnalyticsSummaryAction();
        setSummary(stats);
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Failed to load analytics summaries:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans selection:bg-secondary-container">
      <div className="flex flex-col md:flex-row h-screen overflow-hidden">
        {/* Shared Sidebar */}
        <Sidebar activePage="analytics" user={user} />

        {/* Content Canvas */}
        <main className="flex-grow p-md md:p-xl overflow-y-auto max-w-container-max h-full">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md mb-xl border-b border-outline-variant/20 pb-md">
            <div>
              <h2 className="text-display-lg font-bold text-primary">Platform Analytics</h2>
              <p className="text-body-lg text-on-surface-variant mt-xs">
                Track visitor actions, click behavior, popular categories, and marketplace engagement.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="bg-primary text-on-primary px-xl py-md rounded-xl font-bold flex items-center gap-sm shadow-md hover:shadow-lg transition-all active:scale-95 text-label-md"
            >
              <span className="material-symbols-outlined">dashboard</span>
              Back to Dashboard
            </Link>
          </header>

          {loading || !summary ? (
            <DashboardSkeleton />
          ) : (
            <div className="space-y-xl">
              {/* Stat Metric Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md md:gap-lg">
                {/* Views Card */}
                <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant/30 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
                  <div className="space-y-xs">
                    <span className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider block">Total Page Views</span>
                    <span className="text-display-md font-bold text-primary block">{summary.totalViews.toLocaleString()}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold block flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[12px] font-bold">trending_up</span>
                      +18.4% since last week
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[28px]">visibility</span>
                  </div>
                </div>

                {/* Total Clicks Card */}
                <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant/30 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
                  <div className="space-y-xs">
                    <span className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider block">Action Clicks</span>
                    <span className="text-display-md font-bold text-primary block">{summary.totalClicks.toLocaleString()}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold block flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[12px] font-bold">trending_up</span>
                      +24.1% since last week
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-secondary/5 text-secondary rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[28px]">ads_click</span>
                  </div>
                </div>

                {/* CTR Card */}
                <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant/30 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
                  <div className="space-y-xs">
                    <span className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider block">Click-Through-Rate</span>
                    <span className="text-display-md font-bold text-secondary block">{summary.ctr.toFixed(1)}%</span>
                    <span className="text-[10px] text-emerald-600 font-semibold block flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[12px] font-bold">insights</span>
                      Outstanding conversion ratio
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-secondary-container/20 text-on-secondary-container rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[28px]">percent</span>
                  </div>
                </div>

                {/* Contact Clicks Card */}
                <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant/30 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
                  <div className="space-y-xs">
                    <span className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider block">Inquiries Sent</span>
                    <span className="text-display-md font-bold text-primary block">{summary.contactClicks.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 block">
                      Direct inquiries to sellers
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[28px]">mail</span>
                  </div>
                </div>
              </div>

              {/* Graphic charts & lists */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
                {/* Custom CSS Bar Chart for Traffic Analysis */}
                <div className="lg:col-span-2 bg-surface-container-lowest p-xl rounded-xl border border-outline-variant/30 shadow-sm flex flex-col justify-between min-h-[350px]">
                  <div className="mb-md">
                    <h3 className="text-title-lg font-bold text-primary flex items-center gap-xs">
                      <span className="material-symbols-outlined text-secondary">analytics</span>
                      Weekly Traffic Volume
                    </h3>
                    <p className="text-body-sm text-on-surface-variant mt-xs">Visual distribution of daily visitor page views.</p>
                  </div>
                  <div className="flex items-end justify-between h-48 pt-lg border-b border-outline-variant/30 px-md relative">
                    {/* Vertical grid lines */}
                    <div className="absolute inset-x-0 top-1/4 border-t border-slate-100 border-dashed"></div>
                    <div className="absolute inset-x-0 top-2/4 border-t border-slate-100 border-dashed"></div>
                    <div className="absolute inset-x-0 top-3/4 border-t border-slate-100 border-dashed"></div>

                    {summary.dailyViews.map((day) => {
                      const maxViews = Math.max(...summary.dailyViews.map(d => d.views), 1);
                      const heightPct = (day.views / maxViews) * 100;
                      return (
                        <div key={day.date} className="flex flex-col items-center flex-grow group relative z-10">
                          {/* Hover Tooltip */}
                          <div className="absolute bottom-full mb-xs bg-primary text-white text-[10px] px-sm py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-bold">
                            {day.views} views
                          </div>
                          {/* The Bar */}
                          <div
                            style={{ height: `${Math.max(heightPct, 8)}%` }}
                            className="w-8 sm:w-12 bg-primary rounded-t-md group-hover:bg-secondary transition-all shadow-sm animate-pulse"
                          ></div>
                          <span className="text-body-xs font-bold text-on-surface-variant mt-sm">{day.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Most Popular Listings */}
                <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant/30 shadow-sm flex flex-col justify-between">
                  <div className="mb-md border-b border-outline-variant/20 pb-sm">
                    <h3 className="text-title-lg font-bold text-primary flex items-center gap-xs">
                      <span className="material-symbols-outlined text-secondary">trending_up</span>
                      Most Popular Listings
                    </h3>
                    <p className="text-body-sm text-on-surface-variant mt-xs">Ranked by overall page views.</p>
                  </div>
                  <div className="flex-grow space-y-md">
                    {summary.topListings.map((item, idx) => (
                      <div key={item.id} className="flex justify-between items-center p-sm hover:bg-surface-container-low rounded-lg transition-colors border border-outline-variant/10">
                        <div className="flex items-center gap-md truncate">
                          <span className="font-extrabold text-title-md text-secondary-container bg-primary w-8 h-8 rounded-full flex items-center justify-center shadow-sm text-xs">
                            #{idx + 1}
                          </span>
                          <div className="truncate">
                            <span className="font-bold text-body-md text-primary block truncate max-w-[150px]" title={item.title}>
                              {item.title}
                            </span>
                            <span className="text-[10px] text-on-surface-variant font-medium uppercase">{item.category} • ${item.price.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-body-md text-primary block">{item.viewsCount} views</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{item.clicksCount} clicks</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
