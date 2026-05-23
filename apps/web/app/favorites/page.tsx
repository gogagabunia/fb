'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getFavoritesAction, toggleFavoriteAction } from '../actions';
import { getCurrentUser } from '../auth-actions';
import Sidebar from '../components/sidebar';
import { MarketplaceSkeleton } from '../components/skeleton';

interface Listing {
  id: string;
  title: string;
  price: number;
  description: string;
  images: string[];
  location: string | null;
  category: string;
  originalPostUrl: string;
  createdAt: any;
  importedPost?: {
    group: {
      name: string;
    };
  };
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  async function loadData() {
    try {
      const data = await getFavoritesAction();
      setFavorites(data as any[]);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error fetching favorites:', error);
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

  async function handleUnfavorite(listingId: string, listingTitle: string) {
    try {
      const result = await toggleFavoriteAction(listingId);
      if (result.success) {
        setFavorites(favorites.filter((f) => f.id !== listingId));
        showToast(`"${listingTitle}" removed from saved listings.`, 'info');
      } else {
        showToast(result.error || 'Failed to remove from saved.', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Error occurred.', 'error');
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
        <Sidebar activePage="favorites" user={user} />

        {/* Content Canvas */}
        <main className="flex-grow p-md md:p-xl overflow-y-auto max-w-container-max h-full">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md mb-xl border-b border-outline-variant/20 pb-md">
            <div>
              <h2 className="text-display-lg font-bold text-primary">Saved Listings</h2>
              <p className="text-body-lg text-on-surface-variant mt-xs">
                Browse and manage the classified postings you bookmarked.
              </p>
            </div>
            <Link
              href="/marketplace"
              className="bg-secondary text-on-secondary px-xl py-md rounded-xl font-bold flex items-center gap-sm shadow-md hover:shadow-lg transition-all active:scale-95 text-label-md"
            >
              <span className="material-symbols-outlined">storefront</span>
              Explore Feed
            </Link>
          </header>

          {loading ? (
            <MarketplaceSkeleton />
          ) : favorites.length === 0 ? (
            <div className="py-xxl flex flex-col items-center justify-center text-center bg-white border border-outline-variant/30 rounded-xl px-md">
              <span className="material-symbols-outlined text-[72px] text-slate-300 mb-md" style={{ fontVariationSettings: "'FILL' 1" }}>
                bookmark
              </span>
              <h3 className="text-headline-sm font-bold text-primary mb-xs">No Saved Listings</h3>
              <p className="text-body-md text-on-surface-variant max-w-sm mb-lg">
                Bookmark listings in the public feed to keep track of items you are interested in.
              </p>
              <Link
                href="/marketplace"
                className="px-xl py-md border border-primary text-primary hover:bg-primary hover:text-on-primary rounded-lg text-label-md font-bold transition-all shadow-sm flex items-center gap-xs"
              >
                Browse Marketplace Feed
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-md md:gap-lg">
              {favorites.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col overflow-hidden"
                >
                  <div className="relative h-48 overflow-hidden bg-surface-container-low">
                    <img
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      src={post.images[0] || 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=1200'}
                      alt={post.title}
                    />
                    <div className="absolute top-sm right-sm">
                      <button
                        onClick={() => handleUnfavorite(post.id, post.title)}
                        className="bg-white/95 backdrop-blur-md p-xs rounded-full shadow-sm text-error transition-colors flex items-center justify-center hover:scale-110 active:scale-95"
                        title="Remove from saved"
                      >
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          favorite
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="p-md flex flex-col justify-between flex-grow">
                    <div className="mb-md">
                      <h4
                        className="font-bold text-body-md group-hover:text-primary transition-colors truncate mb-xs font-bold"
                        title={post.title}
                      >
                        {post.title}
                      </h4>
                      <div className="text-secondary font-bold text-body-lg mb-xs">
                        ${post.price.toLocaleString()}
                      </div>
                      <p className="text-on-surface-variant text-body-xs line-clamp-2">
                        {post.description}
                      </p>
                      <p className="text-slate-400 text-[11px] mt-2 truncate">
                        📍 {post.location || 'Local'} • {post.importedPost?.group.name || 'Facebook'}
                      </p>
                    </div>
                    <div className="flex gap-sm mt-auto">
                      <Link
                        href={`/listing-detail/${post.id}`}
                        className="flex-grow py-2 bg-primary text-on-primary rounded-lg text-xs font-bold transition-all text-center hover:opacity-90 active:scale-[0.98]"
                      >
                        View Info
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
