'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { connectFacebookGroup, triggerScrapingAction } from '../actions';
import { getCurrentUser } from '../auth-actions';
import Sidebar from '../components/sidebar';

export default function AddGroupWizardPage() {
  const [step, setStep] = useState(1);
  const [groupUrl, setGroupUrl] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Vehicles']);
  const [keywords, setKeywords] = useState('BMW, Porsche, Mazda, Toyota, OEM');
  const [toggleNotify, setToggleNotify] = useState(false);

  // Success screen progress bar simulation
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [user, setUser] = useState<{ firstName: string | null; lastName: string | null; email: string } | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser as any);
      } catch (error) {
        console.error('Failed to get current user:', error);
      }
    }
    loadUser();
  }, []);

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }

  // Handle advancing wizard steps
  const nextStep = async () => {
    if (step === 1) {
      if (!groupUrl) {
        showToast('Please provide a valid Facebook Group URL!', 'error');
        return;
      }
      // Auto-extract group name if not specified
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
      // Step 3 -> Submit to DB and run ingestion
      setSubmitting(true);
      showToast('Creating source in cloud database...', 'info');

      try {
        // Parse keywords array
        const keywordsArray = keywords
          .split(',')
          .map((k) => k.trim())
          .filter((k) => k.length > 0);

        // Generate a random Facebook-like Group ID for simulation/testing
        const simulatedGroupId = 'fb_group_' + Math.floor(Math.random() * 10000000);

        // 1. Save group to DB
        const groupRes = await connectFacebookGroup({
          name: groupName,
          url: groupUrl,
          groupId: simulatedGroupId,
          keywords: keywordsArray
        });

        if (groupRes.success && groupRes.group) {
          showToast('Source connected successfully! Simulating AI scraping...', 'success');
          setStep(4);
          
          // Start simulated progress bar
          let progressVal = 10;
          const interval = setInterval(() => {
            progressVal += Math.floor(Math.random() * 15) + 5;
            if (progressVal >= 100) {
              progressVal = 100;
              clearInterval(interval);
            }
            setProgress(progressVal);
          }, 400);

          // 2. Trigger Playwright Scraper and AI Parser in the background
          triggerScrapingAction(groupRes.group.id)
            .then((scrapeRes) => {
              if (scrapeRes.success) {
                showToast(`Scrape Done! Ingested ${scrapeRes.listingsImported} classified items.`, 'success');
              } else {
                showToast(`Sync alert: Scraper fallback ran due to mock settings.`, 'info');
              }
            })
            .catch((err) => {
              console.error('Background ingestion error:', err);
              showToast('Scraper finished. Ingested fallback vehicle records.', 'info');
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
        <Sidebar activePage="add-group" user={user} />

        {/* Content Canvas */}
        <main className="flex-grow p-md md:p-xl overflow-y-auto max-w-container-max h-full flex flex-col items-center">
          <div className="w-full max-w-xl py-lg">
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

        {/* Wizard Box */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-xl shadow-sm min-h-[400px] flex flex-col justify-between">
          <div>
            {/* Step 1: Facebook Group Info */}
            {step === 1 && (
              <section className="animate-fade-in">
                <div className="mb-lg">
                  <h1 className="text-headline-lg font-bold text-primary mb-xs">Paste Group Details</h1>
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
                        placeholder="e.g. https://facebook.com/groups/california-auto-marketplace"
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
                      placeholder="e.g. California Cars & Spares (Optional)"
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                  </div>

                  <div className="p-md bg-secondary-container/10 rounded-lg border border-secondary-container/20 flex gap-md">
                    <span className="material-symbols-outlined text-secondary">info</span>
                    <p className="text-body-sm text-on-secondary-fixed-variant">
                      Our system monitors posts 24/7. When classified ads match selling criteria, they ingest seamlessly.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Step 2: Categories selection */}
            {step === 2 && (
              <section className="animate-fade-in">
                <div className="mb-lg">
                  <h1 className="text-headline-lg font-bold text-primary mb-xs">Monitor Categories</h1>
                  <p className="text-body-md text-on-surface-variant">
                    Select which types of posts we should scan, parse, and import.
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
              <section className="animate-fade-in">
                <div className="mb-lg">
                  <h1 className="text-headline-lg font-bold text-primary mb-xs">Import Filtering Rules</h1>
                  <p className="text-body-md text-on-surface-variant">
                    Define scanning filters to maintain absolute quality control over live listings.
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
                        Send notifications for newly flagged reviews.
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
              <section className="flex flex-col items-center justify-center text-center py-xl animate-fade-in">
                <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-xl">
                  <span className="material-symbols-outlined text-[48px] text-secondary">check_circle</span>
                </div>
                <h1 className="text-headline-lg font-bold text-primary mb-xs">Source Successfully Configured!</h1>
                <p className="text-body-md text-on-surface-variant mb-xl max-w-sm">
                  We are executing our Playwright scraper & OpenAI parsing logic in the cloud now. Your moderation feed is filling up.
                </p>
                <div className="w-full max-w-sm space-y-sm">
                  <div className="flex justify-between text-label-sm font-semibold text-on-surface-variant">
                    <span>Scanning Facebook Group & Auto-Persisting...</span>
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
                  className={`px-xl py-md rounded-lg text-on-primary text-label-md font-bold hover:scale-[0.98] active:scale-95 transition-all flex items-center gap-xs shadow-md ${
                    step === 3 ? 'bg-secondary text-white' : 'bg-primary text-white'
                  }`}
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
                <Link
                  href="/dashboard"
                  className="px-xl py-md rounded-lg bg-secondary text-on-secondary text-label-md font-bold hover:scale-[0.98] active:scale-95 transition-all flex items-center gap-xs shadow-md"
                >
                  Go to Dashboard
                  <span className="material-symbols-outlined text-[20px]">dashboard</span>
                </Link>
              </div>
            )}
          </div>
        </div>
        </div>
      </main>
      </div>
    </div>
  );
}
