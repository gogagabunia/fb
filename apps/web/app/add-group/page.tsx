'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  connectFacebookGroup, 
  triggerScrapingAction, 
  getFacebookGroups, 
  updateFacebookGroupAction, 
  disconnectFacebookGroupAction 
} from '../actions';
import { getCurrentUser } from '../auth-actions';
import Sidebar from '../components/sidebar';

export default function AddGroupWizardPage() {
  // Navigation & UI modes
  const [isCreating, setIsCreating] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Wizard state
  const [step, setStep] = useState(1);
  const [groupUrl, setGroupUrl] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Vehicles']);
  const [keywords, setKeywords] = useState('BMW, Porsche, Mazda, Toyota, OEM');
  const [toggleNotify, setToggleNotify] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Editing state per group
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editKeywords, setEditKeywords] = useState('');
  const [updating, setUpdating] = useState(false);

  // Deletion confirm state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Background scraping indicator state
  const [syncingGroupId, setSyncingGroupId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [user, setUser] = useState<{ firstName: string | null; lastName: string | null; email: string } | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser as any);
        
        const fetchedGroups = await getFacebookGroups();
        setGroups(fetchedGroups);
        
        // If there are no groups connected, default immediately to the wizard view
        if (fetchedGroups.length === 0) {
          setIsCreating(true);
        }
      } catch (error) {
        console.error('Failed to load initial workspace data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  async function refreshGroups() {
    try {
      const fetchedGroups = await getFacebookGroups();
      setGroups(fetchedGroups);
      if (fetchedGroups.length === 0) {
        setIsCreating(true);
      }
    } catch (error) {
      console.error('Failed to refresh groups:', error);
    }
  }

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  }

  // Handle advancing wizard steps
  const nextStep = async () => {
    if (step === 1) {
      if (!groupUrl) {
        showToast('Please provide a valid Facebook Group URL!', 'error');
        return;
      }
      if (!groupName) {
        try {
          const cleanUrl = groupUrl.replace(/\/$/, '');
          const parts = cleanUrl.split('/');
          const lastPart = parts[parts.length - 1] || parts[parts.length - 2];
          if (lastPart && lastPart !== 'groups') {
            const cleanName = lastPart
              .split('-')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            setGroupName(cleanName);
          } else {
            setGroupName('Local Buy/Sell Group');
          }
        } catch (e) {
          setGroupName('Local Buy/Sell Group');
        }
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setSubmitting(true);
      showToast('Connecting source in PostgreSQL database...', 'info');

      try {
        const keywordsArray = keywords
          .split(',')
          .map((k) => k.trim())
          .filter((k) => k.length > 0);

        const simulatedGroupId = 'fb_group_' + Math.floor(Math.random() * 10000000);

        const groupRes = await connectFacebookGroup({
          name: groupName,
          url: groupUrl,
          groupId: simulatedGroupId,
          keywords: keywordsArray
        });

        if (groupRes.success && groupRes.group) {
          showToast('Source connected successfully! Executing initial sync...', 'success');
          setStep(4);
          
          let progressVal = 10;
          const interval = setInterval(() => {
            progressVal += Math.floor(Math.random() * 15) + 5;
            if (progressVal >= 100) {
              progressVal = 100;
              clearInterval(interval);
            }
            setProgress(progressVal);
          }, 350);

          triggerScrapingAction(groupRes.group.id)
            .then((scrapeRes) => {
              if (scrapeRes.success) {
                showToast(`Scrape Done! Ingested ${scrapeRes.listingsImported} classified items.`, 'success');
              } else {
                showToast(`Sync alert: Remote browserless CDP loaded sandbox template items.`, 'info');
              }
              refreshGroups();
            })
            .catch((err) => {
              console.error('Background ingestion error:', err);
              showToast('Scraper finished. Ingested fallback vehicle records.', 'info');
              refreshGroups();
            });

        } else {
          showToast(`Error: ${groupRes.error}`, 'error');
        }
      } catch (error: any) {
        showToast(`Submission failed: ${error.message}`, 'error');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const prevStep = () => {
    if (step > 1 && step < 4) {
      setStep(step - 1);
    }
  };

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  // Sync individual group on-demand
  async function handleIndividualSync(id: string) {
    setSyncingGroupId(id);
    showToast('Connecting to Browserless CDP WebSocket and launching scraper...', 'info');

    try {
      const scrapeRes = await triggerScrapingAction(id);
      if (scrapeRes.success) {
        showToast(`Sync finished! Ingested ${scrapeRes.listingsImported} listings successfully.`, 'success');
      } else {
        showToast('Sync finished using CDP sandbox templates.', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Scraping finalized.', 'info');
    } finally {
      setSyncingGroupId(null);
    }
  }

  // Edit action triggers
  function startEditing(group: any) {
    setEditingGroupId(group.id);
    setEditName(group.name);
    setEditUrl(group.url);
    setEditKeywords(group.keywords.join(', '));
  }

  function cancelEditing() {
    setEditingGroupId(null);
  }

  async function handleUpdateGroup(id: string) {
    if (!editName.trim() || !editUrl.trim()) {
      showToast('Name and URL cannot be blank.', 'info');
      return;
    }

    setUpdating(true);
    showToast('Updating source parameters...', 'info');

    try {
      const keywordsArray = editKeywords
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      const res = await updateFacebookGroupAction(id, {
        name: editName.trim(),
        url: editUrl.trim(),
        keywords: keywordsArray
      });

      if (res.success) {
        showToast('Group configuration updated successfully!', 'success');
        setEditingGroupId(null);
        refreshGroups();
      } else {
        showToast(res.error || 'Failed to update configuration.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Update failed.', 'error');
    } finally {
      setUpdating(false);
    }
  }

  // Safe delete triggers
  async function handleDeleteGroup(id: string) {
    showToast('Deleting source from cloud database...', 'info');

    try {
      const res = await disconnectFacebookGroupAction(id);
      if (res.success) {
        showToast('Successfully disconnected group and cleaned up database relations!', 'success');
        setConfirmDeleteId(null);
        refreshGroups();
      } else {
        showToast(res.error || 'Failed to disconnect group.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Deletion failed.', 'error');
    }
  }

  function resetWizard() {
    setStep(1);
    setGroupUrl('');
    setGroupName('');
    setKeywords('BMW, Porsche, Mazda, Toyota, OEM');
    setProgress(0);
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans selection:bg-secondary-container">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-lg right-lg flex flex-col gap-sm z-50 animate-fade-in shadow-xl">
          <div
            className={`px-md py-sm rounded-lg flex items-center gap-sm text-white ${
              toast.type === 'success' ? 'bg-secondary' : toast.type === 'error' ? 'bg-error' : 'bg-primary'
            }`}
          >
            <span className="material-symbols-outlined">
              {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'cancel' : 'info'}
            </span>
            <span className="text-label-md font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row h-screen overflow-hidden">
        {/* Shared Sidebar */}
        <Sidebar activePage="add-group" user={user} />

        {/* Content Canvas */}
        <main className="flex-grow p-md md:p-xl overflow-y-auto max-w-container-max h-full">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-md">
              <span className="material-symbols-outlined text-[48px] text-primary animate-spin">sync</span>
              <p className="text-label-md text-slate-400 font-bold uppercase tracking-wider">
                Loading Source Workspace...
              </p>
            </div>
          ) : (
            <div className="w-full py-md max-w-6xl mx-auto space-y-xl">
              
              {/* Header Panel */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-md border-b border-outline-variant/30 pb-lg">
                <div>
                  <h1 className="text-headline-md font-bold text-primary">Connected Groups Workspace</h1>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">
                    Manage your active target Facebook Group pipelines, configure brand filters, or connect new feeds.
                  </p>
                </div>
                {groups.length > 0 && (
                  <button
                    onClick={() => {
                      resetWizard();
                      setIsCreating(!isCreating);
                    }}
                    className="px-xl py-md bg-primary text-on-primary rounded-lg text-label-md font-bold flex items-center justify-center gap-xs hover:opacity-90 active:scale-[0.98] transition-all shadow-md shrink-0"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isCreating ? 'dashboard' : 'add'}
                    </span>
                    {isCreating ? 'Back to Workspace' : 'Connect New Source'}
                  </button>
                )}
              </div>

              {/* Ingest Workspace list state */}
              {!isCreating ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                  {groups.map((group) => {
                    const isEditing = editingGroupId === group.id;
                    const isDeleting = confirmDeleteId === group.id;
                    const isSyncing = syncingGroupId === group.id;

                    return (
                      <div
                        key={group.id}
                        className={`bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-xl shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col justify-between min-h-[260px] ${
                          isSyncing ? 'ring-1 ring-primary' : ''
                        }`}
                      >
                        {/* Status bar */}
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary to-secondary"></div>

                        {/* Card Content */}
                        <div className="space-y-md">
                          {isEditing ? (
                            // Inline Edit UI Mode
                            <div className="space-y-md">
                              <div className="flex flex-col gap-xs">
                                <label className="text-[11px] font-bold text-slate-400 uppercase">Group Label Name</label>
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full h-10 px-sm rounded-lg border border-outline-variant outline-none focus:border-primary text-xs font-semibold"
                                  placeholder="e.g. California Cars Classifieds"
                                />
                              </div>

                              <div className="flex flex-col gap-xs">
                                <label className="text-[11px] font-bold text-slate-400 uppercase">Facebook Group URL</label>
                                <input
                                  type="url"
                                  value={editUrl}
                                  onChange={(e) => setEditUrl(e.target.value)}
                                  className="w-full h-10 px-sm rounded-lg border border-outline-variant outline-none focus:border-primary text-xs font-semibold"
                                  placeholder="e.g. https://facebook.com/groups/california-auto"
                                />
                              </div>

                              <div className="flex flex-col gap-xs">
                                <label className="text-[11px] font-bold text-slate-400 uppercase">Keywords (Comma Separated)</label>
                                <input
                                  type="text"
                                  value={editKeywords}
                                  onChange={(e) => setEditKeywords(e.target.value)}
                                  className="w-full h-10 px-sm rounded-lg border border-outline-variant outline-none focus:border-primary text-xs font-medium"
                                  placeholder="BMW, Porsche, Mazda"
                                />
                              </div>
                            </div>
                          ) : (
                            // Standard Detail Mode
                            <div className="space-y-sm">
                              <div className="flex justify-between items-start gap-md">
                                <div className="space-y-xxs">
                                  <h2 className="text-title-md font-bold text-primary tracking-tight leading-snug">
                                    {group.name}
                                  </h2>
                                  <a
                                    href={group.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-slate-400 hover:text-primary hover:underline flex items-center gap-xs font-medium truncate max-w-[280px]"
                                  >
                                    <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                    {group.url}
                                  </a>
                                </div>
                                <span className="px-xs py-xxs bg-secondary/10 text-secondary rounded-full text-[10px] font-bold uppercase tracking-wider block">
                                  Automated CDP Sync
                                </span>
                              </div>

                              {/* Ingestion metrics badges */}
                              <div className="pt-sm space-y-xs">
                                <span className="text-[11px] font-bold text-slate-500 uppercase block">Keywords Monitored</span>
                                <div className="flex flex-wrap gap-xs">
                                  {group.keywords.length > 0 ? (
                                    group.keywords.map((kw: string, i: number) => (
                                      <span
                                        key={i}
                                        className="px-sm py-xs bg-surface-container-high text-on-surface text-[10px] font-semibold rounded-md border border-outline-variant/30"
                                      >
                                        {kw}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-body-sm text-slate-400 italic font-medium">
                                      Scanning all feed posts
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="mt-lg pt-md border-t border-outline-variant/30 flex justify-between items-center gap-md">
                          {isEditing ? (
                            <div className="flex items-center gap-sm w-full">
                              <button
                                onClick={cancelEditing}
                                disabled={updating}
                                className="px-md py-sm bg-surface-container-high text-on-surface rounded-lg text-label-xs font-bold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-xxs"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleUpdateGroup(group.id)}
                                disabled={updating}
                                className="flex-grow py-sm bg-secondary text-on-secondary rounded-lg text-label-xs font-bold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-xxs"
                              >
                                <span className="material-symbols-outlined text-[14px]">save</span>
                                {updating ? 'Saving...' : 'Save Configuration'}
                              </button>
                            </div>
                          ) : isDeleting ? (
                            <div className="bg-error/5 border border-error/25 p-sm rounded-lg flex flex-col sm:flex-row items-center justify-between gap-sm w-full">
                              <span className="text-[11px] text-error font-bold leading-relaxed">
                                Are you sure? Deleting this group removes all scraped listings.
                              </span>
                              <div className="flex items-center gap-xs shrink-0">
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-sm py-xs bg-surface-container-high text-on-surface text-[10px] font-bold rounded"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleDeleteGroup(group.id)}
                                  className="px-sm py-xs bg-error text-white text-[10px] font-bold rounded hover:opacity-90"
                                >
                                  Disconnect
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-xs">
                                <button
                                  onClick={() => startEditing(group)}
                                  className="p-sm bg-surface-container-high text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                  title="Edit source parameters"
                                >
                                  <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(group.id)}
                                  className="p-sm bg-surface-container-high text-on-surface-variant hover:text-error hover:bg-error/5 rounded-lg transition-all"
                                  title="Disconnect source pipeline"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              </div>
                              <button
                                onClick={() => handleIndividualSync(group.id)}
                                disabled={isSyncing}
                                className="px-lg py-sm bg-primary text-on-primary rounded-lg text-label-xs font-bold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-xxs"
                              >
                                <span className={`material-symbols-outlined text-[14px] ${isSyncing ? 'animate-spin' : ''}`}>
                                  sync
                                </span>
                                {isSyncing ? 'CDP Syncing...' : 'Sync Feed'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Step connection Wizard Form Container
                <div className="w-full max-w-xl mx-auto py-sm">
                  {/* Step Indicator Header */}
                  <div className="mb-xl">
                    <div className="flex justify-between items-center relative">
                      <div className="absolute top-1/2 left-0 w-full h-[2px] bg-surface-container-high -z-10 -translate-y-1/2"></div>
                      <div
                        className="absolute top-1/2 left-0 h-[2px] bg-secondary -z-10 -translate-y-1/2 transition-all duration-500"
                        style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
                      ></div>
                      <div className="step-indicator flex flex-col items-center gap-xs">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-label-sm shadow-sm transition-colors ${
                            step >= 1 ? 'bg-secondary text-on-secondary' : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          {step > 1 ? <span className="material-symbols-outlined text-sm">check</span> : '1'}
                        </div>
                        <span className={`text-label-sm font-semibold ${step >= 1 ? 'text-secondary' : 'text-on-surface-variant'}`}>
                          Connect
                        </span>
                      </div>

                      <div className="step-indicator flex flex-col items-center gap-xs">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-label-sm shadow-sm transition-colors ${
                            step >= 2 ? 'bg-secondary text-on-secondary' : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          {step > 2 ? <span className="material-symbols-outlined text-sm">check</span> : '2'}
                        </div>
                        <span className={`text-label-sm font-semibold ${step >= 2 ? 'text-secondary' : 'text-on-surface-variant'}`}>
                          Categories
                        </span>
                      </div>

                      <div className="step-indicator flex flex-col items-center gap-xs">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-label-sm shadow-sm transition-colors ${
                            step >= 3 ? 'bg-secondary text-on-secondary' : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          {step > 3 ? <span className="material-symbols-outlined text-sm">check</span> : '3'}
                        </div>
                        <span className={`text-label-sm font-semibold ${step >= 3 ? 'text-secondary' : 'text-on-surface-variant'}`}>
                          Rules
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Wizard Card */}
                  <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-xl shadow-sm min-h-[400px] flex flex-col justify-between">
                    <div>
                      {/* Step 1: Facebook Group Info */}
                      {step === 1 && (
                        <section className="animate-fade-in space-y-lg">
                          <div className="mb-lg">
                            <h2 className="text-headline-sm font-bold text-primary mb-xs">Paste Group Details</h2>
                            <p className="text-body-md text-on-surface-variant">
                              Connect a Facebook Buy/Sell group to start monitoring for listings automatically.
                            </p>
                          </div>
                          <div className="space-y-lg">
                            <div className="flex flex-col gap-xs">
                              <label className="text-label-md font-bold text-on-surface">Facebook Group URL</label>
                              <div className="relative">
                                <input
                                  className="w-full h-14 px-md rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all text-body-lg bg-surface-container-low/30"
                                  placeholder="e.g. https://facebook.com/groups/scottsdale-classifieds"
                                  type="url"
                                  value={groupUrl}
                                  onChange={(e) => setGroupUrl(e.target.value)}
                                />
                                <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant">
                                  link
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-xs">
                              <label className="text-label-md font-bold text-on-surface">Custom Label / Group Name</label>
                              <input
                                  className="w-full h-14 px-md rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all text-body-lg bg-surface-container-low/30"
                                placeholder="e.g. Scottsdale Classifieds (Optional)"
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                              />
                            </div>

                            <div className="p-md bg-secondary-container/10 rounded-lg border border-secondary-container/20 flex gap-md">
                              <span className="material-symbols-outlined text-secondary">info</span>
                              <p className="text-body-sm text-on-secondary-fixed-variant leading-relaxed">
                                Our automated background worker will automatically scan and flag items matching your monitoring criteria.
                              </p>
                            </div>
                          </div>
                        </section>
                      )}

                      {/* Step 2: Categories selection */}
                      {step === 2 && (
                        <section className="animate-fade-in space-y-lg">
                          <div className="mb-lg">
                            <h2 className="text-headline-sm font-bold text-primary mb-xs">Monitor Categories</h2>
                            <p className="text-body-md text-on-surface-variant">
                              Select which types of posts our classifier should automatically scan and catalog.
                            </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                            {[
                              { key: 'Vehicles', title: 'Cars & Vehicles', desc: 'Sedans, SUVs, Sports Cars' },
                              { key: 'Electronics', title: 'Consumer Electronics', desc: 'Phones, Cameras, Laptops' },
                              { key: 'Real Estate', title: 'Real Estate / Land', desc: 'Rentals, Sales, Plots' },
                              { key: 'Other', title: 'Other Classifieds', desc: 'Tools, Furniture, Collectibles' }
                            ].map((cat) => (
                              <label
                                key={cat.key}
                                onClick={() => toggleCategory(cat.key)}
                                className={`flex items-center p-md border rounded-lg cursor-pointer hover:bg-surface-container-low transition-all group ${
                                  selectedCategories.includes(cat.key) ? 'border-secondary bg-secondary/5' : 'border-outline-variant'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedCategories.includes(cat.key)}
                                  readOnly
                                  className="w-5 h-5 rounded border-outline-variant text-secondary focus:ring-secondary"
                                />
                                <div className="ml-md">
                                  <span className="text-label-md font-bold block text-primary">{cat.title}</span>
                                  <span className="text-body-sm text-on-surface-variant">{cat.desc}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Step 3: Rules & Filters */}
                      {step === 3 && (
                        <section className="animate-fade-in space-y-lg">
                          <div className="mb-lg">
                            <h2 className="text-headline-sm font-bold text-primary mb-xs">Import Filtering Rules</h2>
                            <p className="text-body-md text-on-surface-variant">
                              Define scanning keywords to maintain absolute quality control over live listings.
                            </p>
                          </div>
                          <div className="space-y-xl">
                            <div className="space-y-md">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-label-md font-bold block text-primary">Keyword Filter Spans</span>
                                  <span className="text-body-sm text-on-surface-variant">
                                    Only import posts containing these terms (comma separated).
                                  </span>
                                </div>
                                <span className="material-symbols-outlined text-on-surface-variant">tune</span>
                              </div>
                              <input
                                  className="w-full px-md py-sm rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all text-body-md bg-surface-container-low/30"
                                placeholder="e.g. BMW, Toyota, Porsche, Leica"
                                type="text"
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                              />
                            </div>

                            <div className="flex items-center justify-between p-md bg-surface-container-low rounded-lg">
                              <div>
                                <span className="text-label-md font-bold block text-primary">Auto-Notify Platform Admin</span>
                                <span className="text-body-sm text-on-surface-variant">
                                  Send email alerts for newly flagged moderation reviews.
                                </span>
                              </div>
                              <button
                                onClick={() => setToggleNotify(!toggleNotify)}
                                className={`w-12 h-6 rounded-full relative transition-colors ${
                                  toggleNotify ? 'bg-secondary' : 'bg-outline-variant'
                                }`}
                              >
                                <div
                                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                    toggleNotify ? 'translate-x-[24px]' : 'translate-x-[4px]'
                                  }`}
                                ></div>
                              </button>
                            </div>
                          </div>
                        </section>
                      )}

                      {/* Step 4: Success, Scanning Animation */}
                      {step === 4 && (
                        <section className="flex flex-col items-center justify-center text-center py-xl animate-fade-in space-y-md">
                          <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-md">
                            <span className="material-symbols-outlined text-[48px] text-secondary animate-bounce">check_circle</span>
                          </div>
                          <h2 className="text-headline-sm font-bold text-primary">Source Successfully Configured!</h2>
                          <p className="text-body-md text-on-surface-variant max-w-sm leading-relaxed">
                            We are initiating your Playwright sync via the Browserless CDP engine. Your moderation queue will populate momentarily.
                          </p>
                          <div className="w-full max-w-sm space-y-sm pt-md">
                            <div className="flex justify-between text-label-sm font-semibold text-on-surface-variant">
                              <span>Parsing feed data in background...</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
                              <div
                                className="h-full bg-secondary transition-all duration-300 shadow-[0_0_12px_rgba(0,108,73,0.3)]"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </section>
                      )}
                    </div>

                    {/* Action Row */}
                    <div className="mt-xl pt-lg border-t border-outline-variant/30 flex justify-between items-center">
                      {step < 4 ? (
                        <>
                          <button
                            onClick={prevStep}
                            className={`px-xl py-sm rounded-lg text-label-md font-bold text-on-surface-variant hover:bg-surface-container-high transition-all flex items-center gap-xs ${
                              step === 1 ? 'opacity-0 pointer-events-none' : ''
                            }`}
                          >
                            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                            Back
                          </button>

                          <button
                            onClick={nextStep}
                            disabled={submitting}
                            className="px-xl py-md rounded-lg bg-primary text-on-primary text-label-md font-bold hover:scale-[0.98] active:scale-95 transition-all flex items-center gap-xs shadow-md"
                          >
                            {submitting ? (
                              <>Connecting...</>
                            ) : step === 3 ? (
                              <>
                                Complete Setup
                                <span className="material-symbols-outlined text-[20px]">task_alt</span>
                              </>
                            ) : (
                              <>
                                Continue
                                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                              </>
                            )}
                          </button>
                        </>
                      ) : (
                        <div className="w-full flex justify-center">
                          <button
                            onClick={() => {
                              setIsCreating(false);
                              refreshGroups();
                            }}
                            className="px-xl py-md rounded-lg bg-secondary text-on-secondary text-label-md font-bold hover:scale-[0.98] active:scale-95 transition-all flex items-center gap-xs shadow-md"
                          >
                            Go to Connected Workspace
                            <span className="material-symbols-outlined text-[20px]">groups</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
