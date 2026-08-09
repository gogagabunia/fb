'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getMarketplaceListings, getFeaturedListings, getCategories, getFavoritedIdsAction, toggleFavoriteAction } from '../actions';
import SearchBar from './components/search-bar';
import { MarketplaceSkeleton } from '../components/skeleton';
import { isFeaturedNow } from '../lib/featured';
import { categoryBySlug } from '../lib/categories';
import { formatPrice } from '../lib/format-price';

interface Listing {
  id: string;
  title: string;
  price: number;
  description: string;
  images: string[];
  location: string | null;
  category: string;
  specs: any;
  contactUrl: string;
  originalPostUrl: string;
  createdAt: any;
  isFeatured?: boolean;
  featuredUntil?: string | Date | null;
  categoryRel?: {
    name: string;
    slug: string;
  };
  importedPost?: {
    group: {
      name: string;
    };
  };
}

// Wrapped in Suspense below: useSearchParams() opts the page into dynamic
// rendering, and Next requires a boundary around it for the build.
function MarketplaceContent() {
  // Homepage category tiles and the search bar land here as URL params.
  const params = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState(params.get('search') ?? '');
  // Homepage links carry slugs; the filter dropdown works in display names.
  const initialCategory = params.get('category');
  const [category, setCategory] = useState(
    initialCategory ? (categoryBySlug(initialCategory)?.name ?? initialCategory) : 'All'
  );
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [favoritedIds, setFavoritedIds] = useState<string[]>([]);
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);

  // Loaded once: the category list and the featured grid must not be limited to
  // whichever page happens to be loaded.
  useEffect(() => {
    async function loadStatic() {
      try {
        const [cats, feat, favIds] = await Promise.all([
          getCategories(),
          getFeaturedListings(),
          getFavoritedIdsAction()
        ]);
        setCategories(['All', ...cats.map((c: any) => c.name)]);
        setFeatured(feat as any);
        setFavoritedIds(favIds);
      } catch (error) {
        console.error('Error loading marketplace metadata:', error);
      }
    }
    loadStatic();
  }, []);

  // Filters now run in the database, so any change refetches page 0. Debounced
  // so typing in the search box doesn't fire a query per keystroke.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const result = await getMarketplaceListings({
          search,
          category,
          minPrice: minPrice ? parseFloat(minPrice) : null,
          maxPrice: maxPrice ? parseFloat(maxPrice) : null,
          sortBy: sortBy as 'newest' | 'price-asc' | 'price-desc',
          page: 0
        });
        if (cancelled) return;
        setListings(result.items as any);
        setTotal(result.total);
        setHasMore(result.hasMore);
        setPage(0);
      } catch (error) {
        console.error('Error fetching marketplace listings:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, category, minPrice, maxPrice, sortBy]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const result = await getMarketplaceListings({
        search,
        category,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        sortBy: sortBy as 'newest' | 'price-asc' | 'price-desc',
        page: next
      });
      setListings((prev) => [...prev, ...(result.items as any)]);
      setHasMore(result.hasMore);
      setPage(next);
    } catch (error) {
      console.error('Error loading more listings:', error);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleToggleFavorite(listingId: string, title: string) {
    try {
      const result = await toggleFavoriteAction(listingId);
      if (result.success) {
        if (result.favorited) {
          setFavoritedIds([...favoritedIds, listingId]);
        } else {
          setFavoritedIds(favoritedIds.filter(id => id !== listingId));
        }
      } else {
        console.error('Failed to toggle favorite:', result.error);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  }

  // `listings` is already filtered, sorted and paginated by the database.
  const filteredListings = listings;

  // Bento featured slots: promoted listings whose paid window is still open,
  // topped up from the current page so the grid isn't empty before anyone pays.
  const featuredItems = featured.length >= 2
    ? featured.slice(0, 2)
    : [...featured, ...listings.filter((l) => !isFeaturedNow(l) && l.price > 10000)].slice(0, 2);
  const mainFeatured = featuredItems[0];
  const sideFeatured = featuredItems[1];

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans selection:bg-secondary-container">
      {/* Top Navigation */}
      <nav className="bg-surface/80 backdrop-blur-md text-primary sticky top-0 z-50 border-b border-outline-variant/30 shadow-sm">
        <div className="flex justify-between items-center w-full px-md md:px-lg py-sm max-w-container-max mx-auto h-16">
          <div className="flex items-center gap-md md:gap-xl">
            <Link href="/" className="text-title-lg md:text-headline-md font-bold text-primary">
              GroupMarket
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-lg">
            <Link className="text-primary border-b-2 border-primary pb-1 font-label-md" href="/marketplace">
              Browse Feed
            </Link>
            <Link className="text-on-surface-variant hover:text-primary transition-colors font-label-md" href="/add-group">
              Sync Groups
            </Link>
            <Link className="text-on-surface-variant hover:text-primary transition-colors font-label-md" href="/dashboard">
              Admin Panel
            </Link>
          </div>
          <div className="flex items-center gap-sm md:gap-md">
            <Link href="/add-group" className="bg-primary text-on-primary px-sm md:px-lg py-1.5 rounded-lg text-xs md:text-label-md font-bold hover:opacity-90 active:scale-[0.98] transition-all">
              List Item
            </Link>
            <Link
              href="/dashboard"
              className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant/30 block"
            >
              <img
                alt="User profile"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9ThJLNagGxUr6zXYbmk8Gyhb5Ik8Te58DtM10gaj0ZPRFKu54iJXJ5GObeOhfXAQ5fHMTgJo4wxforvJMBo9CjaFmICBMGUA-HeqqzCQamXQ_GcyaA0VGgg3bXgWruO_PIk8r8KqMEtbU9MY8t21tJxP3w7HfyjYXUDXykBx0B7dRsCObIDBvXeYRx_3E7o60Lo9CFVK6xgs6vvMD_yVhD1wNeWycEwlJsx77I33yZH6JgfTKpoy_k8zSxjW7hpHQ3jqhqRXTf6U"
              />
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Layout Container */}
      <main className="max-w-container-max mx-auto px-md md:px-lg py-xl flex flex-col gap-lg md:gap-xl">
        {/* Search Bar at the Top */}
        <SearchBar
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
          categories={categories}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />

        <div className="flex flex-col md:flex-row gap-lg md:gap-xl">
          {/* Main Listing Content */}
          <section className="flex-grow w-full space-y-xl">
            {/* Asymmetric Bento-style Hero Grid for high price listings */}
            {!loading && listings.length > 0 && category === 'All' && !search && !minPrice && !maxPrice && (
              <div className="space-y-lg">
                <div>
                  <h2 className="text-headline-md md:text-headline-lg font-bold mb-xs">Premium Inventory</h2>
                  <p className="text-on-surface-variant text-body-sm md:text-body-md">Curated selection from verified local groups.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-md md:gap-lg">
                  {/* Large Bento Card */}
                  {mainFeatured ? (
                    <div className="lg:col-span-2 relative group overflow-hidden rounded-xl border border-outline-variant/20 shadow-sm h-64 sm:h-96 md:h-[450px]">
                      <img
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        src={mainFeatured.images[0] || 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=1200'}
                        alt={mainFeatured.title}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex flex-col justify-end p-md md:p-xl">
                        <div className="flex items-center gap-xs mb-sm">
                          <span className="bg-secondary-container text-on-secondary-container text-xs px-sm py-0.5 rounded-full font-bold">
                            NEW ARRIVAL
                          </span>
                          <span className="bg-white/10 backdrop-blur-md text-white text-xs px-sm py-0.5 rounded-full border border-white/20">
                            {mainFeatured.importedPost?.group.name || 'Verified Group'}
                          </span>
                        </div>
                        <h3 className="text-white text-headline-lg md:text-display-md font-bold mb-xs truncate">{mainFeatured.title}</h3>
                        <div className="flex justify-between items-end gap-md">
                          <p className="text-white/80 text-body-sm md:text-body-lg">
                            {formatPrice(mainFeatured.price)} • {mainFeatured.location || 'Local'}
                          </p>
                          <Link
                            href={`/listing-detail/${mainFeatured.id}`}
                            className="bg-white text-primary px-md md:px-xl py-2 md:py-md rounded-lg text-xs md:text-label-md font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center whitespace-nowrap"
                          >
                            View Detail
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="lg:col-span-2 bg-gradient-to-br from-primary to-primary-container rounded-xl p-xl flex flex-col justify-center text-center">
                      <span className="material-symbols-outlined text-[64px] text-secondary mb-md">auto_awesome</span>
                      <h3 className="text-white text-headline-lg font-bold">Premium Experience</h3>
                      <p className="text-slate-300 max-w-sm mx-auto mt-xs">Auto-parsed, curated items with complete specifications.</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-md md:gap-lg">
                    {/* Small Bento Card */}
                    {sideFeatured ? (
                      <div className="h-48 md:h-[210px] relative group overflow-hidden rounded-xl border border-outline-variant/20 shadow-sm">
                        <img
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          src={sideFeatured.images[0] || 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=1200'}
                          alt={sideFeatured.title}
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex flex-col justify-end p-md">
                          <h4 className="text-white font-bold text-title-md truncate">{sideFeatured.title}</h4>
                          <div className="flex justify-between items-center mt-xs">
                            <p className="text-white/95 text-label-md font-bold">{formatPrice(sideFeatured.price)}</p>
                            <Link href={`/listing-detail/${sideFeatured.id}`} className="text-white text-label-sm font-semibold underline">
                              View Detail
                            </Link>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 md:h-[210px] bg-surface-container-high rounded-xl p-md flex flex-col justify-center text-center border border-outline-variant/20">
                        <span className="material-symbols-outlined text-primary text-3xl">verified</span>
                        <h4 className="font-bold text-primary text-label-md mt-sm">Verified Listings Only</h4>
                      </div>
                    )}

                    {/* Sell Yours Card */}
                    <div className="h-48 md:h-[210px] bg-primary-container rounded-xl p-md flex flex-col justify-between border border-outline-variant/20 relative overflow-hidden">
                      <div className="relative z-10">
                        <h4 className="text-on-primary-container text-title-md font-bold">Sync Facebook Groups</h4>
                        <p className="text-on-primary-container/70 text-body-xs mt-xs">
                          Let AI automatically ingest and format local listing posts for you.
                        </p>
                      </div>
                      <Link
                        href="/add-group"
                        className="relative z-10 w-full py-2 bg-secondary text-on-secondary rounded-lg text-xs md:text-label-md font-bold hover:opacity-90 transition-all text-center"
                      >
                        Connect Group
                      </Link>
                      <div className="absolute -bottom-4 -right-4 opacity-10">
                        <span className="material-symbols-outlined text-9xl">trending_up</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Standard Listings Feed Section */}
            <div className="space-y-md">
              <div className="flex justify-between items-end border-b border-outline-variant/20 pb-sm">
                <div>
                  <h2 className="text-title-lg md:text-headline-md font-bold">
                    {category !== 'All' ? `${category} Listings` : 'All Inventory'}
                  </h2>
                  <p className="text-on-surface-variant text-body-xs md:text-body-sm mt-xs">
                    {/* `total` is the full match count, not just what's loaded —
                        showing the loaded count would understate the results. */}
                    Showing {filteredListings.length} of {total} matching item{total !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {loading ? (
                <MarketplaceSkeleton />
              ) : filteredListings.length === 0 ? (
                <div className="py-xxl flex flex-col items-center justify-center text-center bg-white border border-outline-variant/30 rounded-xl px-md">
                  <span className="material-symbols-outlined text-[64px] text-outline mb-md">storefront</span>
                  <h3 className="text-title-lg md:text-headline-sm font-bold text-primary mb-xs">No Listings Found</h3>
                  <p className="text-body-sm md:text-body-md text-on-surface-variant max-w-sm">
                    Try modifying your search query, price range, or category filter.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-md md:gap-lg">
                  {filteredListings.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col overflow-hidden"
                    >
                      <div className="relative h-48 overflow-hidden bg-surface-container-low">
                        <img
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          src={post.images[0] || 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=1200'}
                          alt={post.title}
                        />
                        <div className="absolute top-sm right-sm">
                          <button
                            onClick={() => handleToggleFavorite(post.id, post.title)}
                            className={`bg-white/90 backdrop-blur-md p-xs rounded-full shadow-sm transition-colors flex items-center justify-center hover:scale-105 active:scale-95 ${
                              favoritedIds.includes(post.id) ? 'text-error' : 'text-on-surface-variant hover:text-error'
                            }`}
                          >
                            <span
                              className="material-symbols-outlined text-[18px]"
                              style={{ fontVariationSettings: favoritedIds.includes(post.id) ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              favorite
                            </span>
                          </button>
                        </div>
                      </div>
                      <div className="p-md flex flex-col justify-between flex-grow">
                        <div className="mb-md">
                          <div className="flex justify-between items-start mb-base gap-xs">
                            <h4
                              className="font-bold text-body-md group-hover:text-primary transition-colors truncate flex-1"
                              title={post.title}
                            >
                              {post.title}
                            </h4>
                          </div>
                          <div className="text-secondary font-bold text-body-lg mb-xs">
                            {formatPrice(post.price)}
                          </div>
                          <p className="text-on-surface-variant text-body-xs line-clamp-2">
                            {post.description}
                          </p>
                          <p className="text-slate-400 text-[11px] mt-2 truncate">
                            📍 {post.location || 'Local'} • {post.importedPost?.group.name || 'Facebook'}
                          </p>
                        </div>
                        <Link
                          href={`/listing-detail/${post.id}`}
                          className="w-full py-2 border border-primary text-primary hover:bg-primary hover:text-on-primary rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center mt-auto"
                        >
                          View Listing
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Load More — only shown when the database actually has another
                page. Previously this button was always rendered and had no
                onClick handler at all. */}
            {!loading && hasMore && (
              <div className="mt-xxl flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-sm px-xl py-2 bg-surface-container-high text-primary rounded-full text-xs font-bold hover:bg-surface-container-highest transition-all disabled:opacity-60"
                >
                  <span>{loadingMore ? 'Loading…' : 'Explore More Listings'}</span>
                  <span className="material-symbols-outlined text-[16px]">
                    {loadingMore ? 'progress_activity' : 'expand_more'}
                  </span>
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<MarketplaceSkeleton />}>
      <MarketplaceContent />
    </Suspense>
  );
}
