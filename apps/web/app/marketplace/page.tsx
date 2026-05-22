'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMarketplaceListings } from '../actions';

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

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(true);

  // Load from database server action
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getMarketplaceListings();
        setListings(data as any);
      } catch (error) {
        console.error('Error fetching marketplace listings:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute unique categories dynamically from database listings, merging in defaults
  const categories = ['All', ...Array.from(new Set(listings.map((l) => l.category)))];

  const filteredListings = listings.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = category === 'All' || item.category === category;

    const price = item.price;
    const min = minPrice ? parseFloat(minPrice) : 0;
    const max = maxPrice ? parseFloat(maxPrice) : Infinity;
    const matchesPrice = price >= min && price <= max;

    return matchesSearch && matchesCategory && matchesPrice;
  });

  // Top featured items: select first few vehicles or items
  const featuredItems = listings.filter((l) => l.price > 10000).slice(0, 2);
  const mainFeatured = featuredItems[0];
  const sideFeatured = featuredItems[1];

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans selection:bg-secondary-container">
      {/* Top Navigation */}
      <nav className="bg-surface/80 backdrop-blur-md text-primary sticky top-0 z-50 border-b border-outline-variant/30 shadow-sm">
        <div className="flex justify-between items-center w-full px-lg py-sm max-w-container-max mx-auto h-16">
          <div className="flex items-center gap-xl">
            <Link href="/" className="text-headline-md font-bold text-primary">
              GroupMarket
            </Link>
            <div className="hidden md:flex items-center bg-surface-container-low px-md py-xs rounded-full border border-outline-variant/20 focus-within:ring-2 focus-within:ring-primary/10 transition-all w-80">
              <span className="material-symbols-outlined text-on-surface-variant mr-xs">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-body-sm w-full p-0 placeholder:text-on-surface-variant/60 outline-none"
                placeholder="Search premium listings..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="hidden md:flex items-center gap-lg">
            <Link className="text-primary border-b-2 border-primary pb-1 font-label-md" href="/marketplace">
              Browse
            </Link>
            <Link className="text-on-surface-variant hover:text-primary transition-colors font-label-md" href="/add-group">
              Groups
            </Link>
            <Link className="text-on-surface-variant hover:text-primary transition-colors font-label-md" href="/dashboard">
              Admin Panel
            </Link>
          </div>
          <div className="flex items-center gap-md">
            <button className="material-symbols-outlined p-xs hover:bg-surface-container-low rounded-full transition-all text-on-surface-variant">
              favorite
            </button>
            <button className="material-symbols-outlined p-xs hover:bg-surface-container-low rounded-full transition-all text-on-surface-variant">
              notifications
            </button>
            <Link href="/add-group" className="bg-primary text-on-primary px-lg py-xs rounded-lg font-label-md hover:opacity-90 active:scale-[0.98] transition-all">
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
      <main className="max-w-container-max mx-auto px-lg py-xl flex flex-col md:flex-row gap-xl">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-xl">
            <div>
              <h3 className="font-headline-sm text-headline-sm mb-md">Marketplace</h3>
              <nav className="space-y-xs">
                <Link
                  className="flex items-center gap-sm p-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary rounded-lg transition-all"
                  href="/dashboard"
                >
                  <span className="material-symbols-outlined">dashboard</span>
                  <span className="text-label-md">Dashboard</span>
                </Link>
                <Link
                  className="flex items-center gap-sm p-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary rounded-lg transition-all"
                  href="/admin"
                >
                  <span className="material-symbols-outlined">gavel</span>
                  <span className="text-label-md">Moderation Queue</span>
                </Link>
                <Link
                  className="flex items-center gap-sm p-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary rounded-lg transition-all"
                  href="/add-group"
                >
                  <span className="material-symbols-outlined">groups</span>
                  <span className="text-label-md">Connected Groups</span>
                </Link>
              </nav>
            </div>

            {/* Live Interactive Filters */}
            <div className="pt-xl border-t border-outline-variant/30">
              <h4 className="text-label-sm font-label-sm text-on-surface-variant/60 uppercase tracking-widest mb-md">
                Filters
              </h4>
              <div className="space-y-md">
                {/* Category Selection Chips */}
                <div>
                  <label className="text-label-md font-semibold mb-xs block">Categories</label>
                  <div className="flex flex-col gap-xs mt-xs">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`text-left px-sm py-1.5 rounded-lg text-label-sm transition-all ${
                          category === cat
                            ? 'bg-primary text-on-primary font-bold'
                            : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div className="group">
                  <label className="text-label-md font-semibold mb-xs block">Price Range</label>
                  <div className="flex items-center gap-xs">
                    <input
                      className="w-full bg-white border-outline-variant border rounded-lg px-sm py-xs text-body-sm focus:ring-primary focus:border-primary outline-none"
                      placeholder="Min"
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <span className="text-on-surface-variant">-</span>
                    <input
                      className="w-full bg-white border-outline-variant border rounded-lg px-sm py-xs text-body-sm focus:ring-primary focus:border-primary outline-none"
                      placeholder="Max"
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Listing Content */}
        <section className="flex-grow">
          {/* Asymmetric Bento-style Hero Grid for high price listings */}
          {!loading && listings.length > 0 && category === 'All' && !search && !minPrice && !maxPrice && (
            <div className="mb-xxl">
              <div className="flex items-end justify-between mb-lg">
                <div>
                  <h2 className="text-headline-lg font-headline-lg mb-xs">Premium Inventory</h2>
                  <p className="text-on-surface-variant text-body-md">Curated selection from verified local groups.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-lg h-auto md:h-[500px]">
                {/* Large Bento Card */}
                {mainFeatured ? (
                  <div className="md:col-span-2 relative group overflow-hidden rounded-xl border border-outline-variant/20 shadow-sm">
                    <img
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src={mainFeatured.images[0] || 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=1200'}
                      alt={mainFeatured.title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex flex-col justify-end p-xl">
                      <div className="flex items-center gap-xs mb-sm">
                        <span className="bg-secondary-container text-on-secondary-container text-label-sm px-sm py-0.5 rounded-full font-bold">
                          NEW ARRIVAL
                        </span>
                        <span className="bg-white/10 backdrop-blur-md text-white text-label-sm px-sm py-0.5 rounded-full border border-white/20">
                          {mainFeatured.importedPost?.group.name || 'Verified Group'}
                        </span>
                      </div>
                      <h3 className="text-white text-display-lg font-display-lg mb-xs">{mainFeatured.title}</h3>
                      <div className="flex justify-between items-end">
                        <p className="text-white/80 text-body-lg">
                          ${mainFeatured.price.toLocaleString()} • {mainFeatured.location || 'Local'}
                        </p>
                        <Link
                          href={`/listing-detail/${mainFeatured.id}`}
                          className="bg-white text-primary px-xl py-md rounded-lg font-label-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center"
                        >
                          View Detail
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="md:col-span-2 bg-gradient-to-br from-primary to-primary-container rounded-xl p-xl flex flex-col justify-center text-center">
                    <span className="material-symbols-outlined text-[64px] text-secondary mb-md">auto_awesome</span>
                    <h3 className="text-white text-headline-lg font-bold">Premium Experience</h3>
                    <p className="text-slate-300 max-w-sm mx-auto mt-xs">Auto-parsed, curated items with complete vehicle specifications.</p>
                  </div>
                )}

                <div className="flex flex-col gap-lg">
                  {/* Small Bento Card */}
                  {sideFeatured ? (
                    <div className="h-1/2 relative group overflow-hidden rounded-xl border border-outline-variant/20 shadow-sm">
                      <img
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        src={sideFeatured.images[0] || 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=1200'}
                        alt={sideFeatured.title}
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex flex-col justify-end p-lg">
                        <h4 className="text-white font-headline-sm">{sideFeatured.title}</h4>
                        <div className="flex justify-between items-center">
                          <p className="text-white/90 text-label-md">${sideFeatured.price.toLocaleString()}</p>
                          <Link href={`/listing-detail/${sideFeatured.id}`} className="text-white text-label-sm font-semibold underline">
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-1/2 bg-surface-container-high rounded-xl p-lg flex flex-col justify-center text-center border border-outline-variant/20">
                      <span className="material-symbols-outlined text-primary text-3xl">verified</span>
                      <h4 className="font-bold text-primary text-label-md mt-sm">Verified Listings Only</h4>
                    </div>
                  )}

                  {/* Sell Yours Card */}
                  <div className="h-1/2 bg-primary-container rounded-xl p-lg flex flex-col justify-between border border-outline-variant/20 relative overflow-hidden">
                    <div className="relative z-10">
                      <span className="material-symbols-outlined text-secondary-fixed text-4xl mb-md">
                        auto_awesome
                      </span>
                      <h4 className="text-on-primary-container text-headline-sm">Sync your Facebook Group</h4>
                      <p className="text-on-primary-container/70 text-body-sm mt-xs">
                        Let AI automatically ingest and format posts for you.
                      </p>
                    </div>
                    <Link
                      href="/add-group"
                      className="relative z-10 w-full py-md bg-secondary text-on-secondary rounded-lg font-label-md hover:opacity-90 transition-all text-center"
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
          <div className="mb-lg">
            <h2 className="text-headline-md font-headline-md mb-xs">
              {category !== 'All' ? `${category} Listings` : 'All Inventory'}
            </h2>
            <p className="text-on-surface-variant text-body-sm">
              Showing {filteredListings.length} matching item{filteredListings.length !== 1 ? 's' : ''}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-lg">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-outline-variant/30 p-lg h-[400px] animate-pulse flex flex-col justify-between">
                  <div className="h-48 w-full bg-slate-200 rounded-lg"></div>
                  <div className="h-6 w-3/4 bg-slate-200 rounded mt-4"></div>
                  <div className="h-4 w-1/2 bg-slate-200 rounded mt-2"></div>
                  <div className="h-10 w-full bg-slate-200 rounded-lg mt-6"></div>
                </div>
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="py-xxl flex flex-col items-center justify-center text-center bg-white border border-outline-variant/30 rounded-xl">
              <span className="material-symbols-outlined text-[64px] text-outline mb-md">storefront</span>
              <h3 className="text-headline-md font-bold text-primary mb-xs">No Listings Found</h3>
              <p className="text-body-md text-on-surface-variant max-w-sm">
                Try modifying your search query, price range, or category filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-lg">
              {filteredListings.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col"
                >
                  <div className="relative h-56 overflow-hidden rounded-t-xl bg-surface-container-low">
                    <img
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      src={post.images[0] || 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=1200'}
                      alt={post.title}
                    />
                    <div className="absolute top-md right-md">
                      <button className="bg-white/90 backdrop-blur-md p-xs rounded-full shadow-sm hover:text-error transition-colors flex items-center justify-center">
                        <span className="material-symbols-outlined">favorite</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-lg flex flex-col justify-between flex-1">
                    <div className="mb-md">
                      <div className="flex justify-between items-start mb-base gap-xs">
                        <h4
                          className="font-headline-sm text-headline-sm group-hover:text-primary transition-colors truncate flex-1 font-bold"
                          title={post.title}
                        >
                          {post.title}
                        </h4>
                        <span className="text-secondary font-bold text-headline-sm shrink-0">
                          ${post.price.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-on-surface-variant text-body-sm line-clamp-2">
                        {post.description}
                      </p>
                      <p className="text-slate-400 text-xs mt-2">
                        📍 {post.location || 'Remote'} • {post.category} • {post.importedPost?.group.name || 'Facebook'}
                      </p>
                    </div>
                    <Link
                      href={`/listing-detail/${post.id}`}
                      className="w-full py-md border border-primary text-primary hover:bg-primary hover:text-on-primary rounded-lg font-label-md transition-all duration-200 flex items-center justify-center mt-auto"
                    >
                      View Listing
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {!loading && filteredListings.length > 0 && (
            <div className="mt-xxl flex justify-center">
              <button className="flex items-center gap-sm px-xl py-md bg-surface-container-high text-primary rounded-full font-label-md hover:bg-surface-container-highest transition-all">
                <span>Explore More Listings</span>
                <span className="material-symbols-outlined">expand_more</span>
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
