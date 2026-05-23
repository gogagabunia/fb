'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMarketplaceListings } from '../actions';
import SearchBar from './components/search-bar';

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
  const [sortBy, setSortBy] = useState('newest');
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

  const filteredListings = listings
    .filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(search.toLowerCase())) ||
        (item.importedPost?.group.name && item.importedPost.group.name.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory = category === 'All' || item.category === category;

      const price = item.price;
      const min = minPrice ? parseFloat(minPrice) : 0;
      const max = maxPrice ? parseFloat(maxPrice) : Infinity;
      const matchesPrice = price >= min && price <= max;

      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') {
        return a.price - b.price;
      } else if (sortBy === 'price-desc') {
        return b.price - a.price;
      } else {
        // 'newest'
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  // Top featured items: select first few vehicles or items
  const featuredItems = listings.filter((l) => l.price > 10000).slice(0, 2);
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
                            ${mainFeatured.price.toLocaleString()} • {mainFeatured.location || 'Local'}
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
                            <p className="text-white/95 text-label-md font-bold">${sideFeatured.price.toLocaleString()}</p>
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
                    Showing {filteredListings.length} matching item{filteredListings.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-md md:gap-lg">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-outline-variant/30 p-md h-[380px] animate-pulse flex flex-col justify-between">
                      <div className="h-40 w-full bg-slate-200 rounded-lg"></div>
                      <div className="h-6 w-3/4 bg-slate-200 rounded mt-4"></div>
                      <div className="h-4 w-1/2 bg-slate-200 rounded mt-2"></div>
                      <div className="h-10 w-full bg-slate-200 rounded-lg mt-6"></div>
                    </div>
                  ))}
                </div>
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
                          <button className="bg-white/90 backdrop-blur-md p-xs rounded-full shadow-sm hover:text-error transition-colors flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">favorite</span>
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
                            ${post.price.toLocaleString()}
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

            {/* Load More Button */}
            {!loading && filteredListings.length > 0 && (
              <div className="mt-xxl flex justify-center">
                <button className="flex items-center gap-sm px-xl py-2 bg-surface-container-high text-primary rounded-full text-xs font-bold hover:bg-surface-container-highest transition-all">
                  <span>Explore More Listings</span>
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
