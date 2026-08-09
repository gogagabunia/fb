'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toggleFavoriteAction } from '../actions';
import Sidebar from '../components/sidebar';
import { formatPrice } from '../lib/format-price';
import { makeT } from '../lib/i18n';
import { favoritesStrings } from '../lib/i18n/favorites';
import { useLang } from '../components/lang-provider';

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

interface FavoritesClientProps {
  initialFavorites: Listing[];
  user: any;
}

/**
 * Client island for the saved-listings grid.
 *
 * State exists only because removing a listing updates the grid in place. The
 * data itself now arrives from the server component, so there is no fetch on
 * mount and no skeleton.
 */
export default function FavoritesClient({ initialFavorites, user }: FavoritesClientProps) {
  const tr = makeT(favoritesStrings, useLang());
  const [favorites, setFavorites] = useState<Listing[]>(initialFavorites);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

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
        showToast(tr('removedToast').replace('{title}', listingTitle), 'info');
      } else {
        showToast(result.error || tr('removeFailed'), 'error');
      }
    } catch (error: any) {
      showToast(error.message || tr('errorOccurred'), 'error');
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
              <h2 className="text-display-lg font-bold text-primary">{tr('heading')}</h2>
              <p className="text-body-lg text-on-surface-variant mt-xs">
                {tr('subheading')}
              </p>
            </div>
            <Link
              href="/marketplace"
              className="bg-secondary text-on-secondary px-xl py-md rounded-xl font-bold flex items-center gap-sm shadow-md hover:shadow-lg transition-all active:scale-95 text-label-md"
            >
              <span className="material-symbols-outlined">storefront</span>
              {tr('exploreFeed')}
            </Link>
          </header>

          {favorites.length === 0 ? (
            <div className="py-xxl flex flex-col items-center justify-center text-center bg-white border border-outline-variant/30 rounded-xl px-md">
              <span className="material-symbols-outlined text-[72px] text-slate-300 mb-md" style={{ fontVariationSettings: "'FILL' 1" }}>
                bookmark
              </span>
              <h3 className="text-headline-sm font-bold text-primary mb-xs">{tr('emptyHeading')}</h3>
              <p className="text-body-md text-on-surface-variant max-w-sm mb-lg">
                {tr('emptyBody')}
              </p>
              <Link
                href="/marketplace"
                className="px-xl py-md border border-primary text-primary hover:bg-primary hover:text-on-primary rounded-lg text-label-md font-bold transition-all shadow-sm flex items-center gap-xs"
              >
                {tr('browseMarketplace')}
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
                        title={tr('removeFromSaved')}
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
                        {formatPrice(post.price)}
                      </div>
                      <p className="text-on-surface-variant text-body-xs line-clamp-2">
                        {post.description}
                      </p>
                      <p className="text-slate-400 text-[11px] mt-2 truncate">
                        📍 {post.location || tr('local')} • {post.importedPost?.group.name || 'Facebook'}
                      </p>
                    </div>
                    <div className="flex gap-sm mt-auto">
                      <Link
                        href={`/listing-detail/${post.id}`}
                        className="flex-grow py-2 bg-primary text-on-primary rounded-lg text-xs font-bold transition-all text-center hover:opacity-90 active:scale-[0.98]"
                      >
                        {tr('viewInfo')}
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
