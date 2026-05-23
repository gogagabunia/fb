'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getFavoritedIdsAction, toggleFavoriteAction } from '../../actions';

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
    authorName: string;
    authorProfile: string | null;
    group: {
      name: string;
    };
  };
}

interface ListingDetailClientProps {
  listing: Listing;
  similarListings: Listing[];
}

export default function ListingDetailClient({ listing, similarListings }: ListingDetailClientProps) {
  const defaultFallback = 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=1200';
  
  // Setup images array, ensure we have at least 1 image and up to 4 for thumbnails
  const imageGallery = listing.images && listing.images.length > 0 ? listing.images : [defaultFallback];
  const [activeImage, setActiveImage] = useState(imageGallery[0]);
  const [saved, setSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info'>('success');
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Fetch favorite state on load
  useEffect(() => {
    async function checkSavedState() {
      try {
        const favIds = await getFavoritedIdsAction();
        if (favIds.includes(listing.id)) {
          setSaved(true);
        }
      } catch (err) {
        console.error('Error fetching favorited state:', err);
      }
    }
    checkSavedState();
  }, [listing.id]);

  const handleToggleFavorite = async () => {
    try {
      const result = await toggleFavoriteAction(listing.id);
      if (result.success) {
        const nextSavedState = result.favorited ?? !saved;
        setSaved(nextSavedState);
        setToastType(nextSavedState ? 'success' : 'info');
        setToastMessage(nextSavedState ? 'Added to Saved Listings!' : 'Removed from Saved Listings.');
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        console.error('Failed to toggle favorite:', result.error);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  // Parse specifications
  const specsObj = (listing.specs && typeof listing.specs === 'object') ? (listing.specs as Record<string, any>) : {};
  const year = specsObj.year || specsObj.Year || '2022';
  const mileage = specsObj.mileage || specsObj.Mileage || '1,240 mi';
  const fuel = specsObj.fuel || specsObj.Fuel || 'Gasoline';
  const transmission = specsObj.transmission || specsObj.Transmission || '7-spd PDK';

  // Format price
  const formattedPrice = `$${Number(listing.price).toLocaleString()}`;

  // Time format helper
  const postedDate = listing.createdAt ? new Date(listing.createdAt) : new Date();
  const daysAgo = Math.max(1, Math.round((Date.now() - postedDate.getTime()) / (1000 * 60 * 60 * 24)));
  const dateString = daysAgo === 1 ? 'Posted 1 day ago' : `Posted ${daysAgo} days ago`;

  // Share button copy function
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans selection:bg-secondary-container">
      {/* Toast Notification */}
      {copied && (
        <div className="fixed bottom-lg right-lg z-50 animate-bounce">
          <div className="px-md py-sm rounded-lg shadow-lg flex items-center gap-sm bg-primary text-white">
            <span className="material-symbols-outlined">link</span>
            <span className="text-label-md font-medium">Link copied to clipboard!</span>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-lg right-lg z-50 animate-bounce">
          <div className={`px-md py-sm rounded-lg shadow-lg flex items-center gap-sm text-white ${
            toastType === 'success' ? 'bg-secondary' : 'bg-primary'
          }`}>
            <span className="material-symbols-outlined">
              {toastType === 'success' ? 'check_circle' : 'info'}
            </span>
            <span className="text-label-md font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <nav className="bg-surface/80 backdrop-blur-md text-primary sticky top-0 z-50 border-b border-outline-variant/30 shadow-sm">
        <div className="flex justify-between items-center w-full px-md md:px-lg py-sm max-w-container-max mx-auto h-16">
          <div className="flex items-center gap-md md:gap-xl">
            <Link href="/" className="text-title-lg md:text-headline-md font-bold text-primary">
              GroupMarket
            </Link>
            <nav className="hidden md:flex gap-lg items-center">
              <Link className="text-on-surface-variant hover:text-primary transition-colors font-label-md" href="/marketplace">
                Browse Feed
              </Link>
              <Link className="text-on-surface-variant hover:text-primary transition-colors font-label-md" href="/add-group">
                Sync Groups
              </Link>
              <Link className="text-on-surface-variant hover:text-primary transition-colors font-label-md" href="/dashboard">
                Admin Panel
              </Link>
            </nav>
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
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-xs text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all"
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-[24px]">
                {menuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {menuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-surface border-b border-outline-variant/30 shadow-lg px-md py-lg z-40 flex flex-col gap-md">
            <nav className="flex flex-col gap-sm">
              <Link
                onClick={() => setMenuOpen(false)}
                className="text-primary font-bold text-headline-sm hover:text-secondary transition-colors py-xs"
                href="/marketplace"
              >
                Browse Feed
              </Link>
              <Link
                onClick={() => setMenuOpen(false)}
                className="text-on-surface-variant text-headline-sm hover:text-primary transition-colors py-xs"
                href="/add-group"
              >
                Sync Groups
              </Link>
              <Link
                onClick={() => setMenuOpen(false)}
                className="text-on-surface-variant text-headline-sm hover:text-primary transition-colors py-xs"
                href="/dashboard"
              >
                Admin Panel
              </Link>
            </nav>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-container-max mx-auto px-md md:px-lg py-xl">
        {/* Breadcrumb & Action Row */}
        <div className="flex flex-col sm:flex-row gap-md justify-between sm:items-center mb-lg">
          <div className="flex items-center gap-xs text-on-surface-variant font-label-md text-label-md">
            <Link className="hover:text-primary" href="/dashboard">Home</Link>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <Link className="hover:text-primary capitalize" href={`/marketplace?category=${encodeURIComponent(listing.category)}`}>
              {listing.category}
            </Link>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-on-surface truncate max-w-[200px] md:max-w-xs">{listing.title}</span>
          </div>
          <div className="flex gap-sm">
            <button
              onClick={handleShare}
              className="flex items-center gap-xs px-md py-xs rounded-lg border border-outline-variant hover:bg-surface-container-low transition-all text-label-md font-label-md"
            >
              <span className="material-symbols-outlined">share</span> Share
            </button>
            <button
              onClick={handleToggleFavorite}
              className={`flex items-center gap-xs px-md py-xs rounded-lg border transition-all text-label-md font-label-md ${
                saved
                  ? 'border-secondary bg-secondary-container/20 text-secondary'
                  : 'border-outline-variant hover:bg-surface-container-low text-on-surface'
              }`}
            >
              <span className={`material-symbols-outlined ${saved ? 'text-secondary' : ''}`} style={{ fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}>
                favorite
              </span>
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg md:gap-xxl">
          {/* Left Column: Gallery & Description */}
          <div className="lg:col-span-7 space-y-md">
            {/* Big Main Image */}
            <div className="rounded-xl overflow-hidden shadow-sm aspect-[16/10] bg-surface-container">
              <img
                className="w-full h-full object-cover transition-opacity duration-300"
                src={activeImage}
                alt={listing.title}
              />
            </div>
            {/* Gallery Thumbnails */}
            {imageGallery.length > 1 && (
              <div className="grid grid-cols-4 gap-sm md:gap-md">
                {imageGallery.slice(0, 4).map((img, idx) => (
                  <button
                    key={idx}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      activeImage === img ? 'border-primary' : 'border-transparent hover:border-outline'
                    }`}
                    onClick={() => setActiveImage(img)}
                  >
                    <img className="w-full h-full object-cover" src={img} alt={`${listing.title} thumbnail ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}

            {/* Description Section */}
            <div className="pt-xl border-t border-outline-variant/30 mt-xxl">
              <h2 className="font-headline-md text-headline-md mb-md">Description</h2>
              <div className="text-on-surface-variant font-body-md text-body-md leading-relaxed whitespace-pre-line space-y-md">
                {listing.description || 'No description available for this listing.'}
              </div>
            </div>
          </div>

          {/* Right Column: Details & CTA */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-lg">
              {/* Price & Title Card */}
              <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant/30 shadow-sm">
                <div className="flex justify-between items-start mb-xs">
                  <span className="text-headline-lg md:text-display-lg font-bold text-primary">{formattedPrice}</span>
                  <span className="bg-secondary-container text-on-secondary-container px-sm py-1 rounded-full font-label-sm text-label-sm">
                    {listing.isActive ? 'Active' : 'Archived'}
                  </span>
                </div>
                <h1 className="text-headline-lg font-headline-lg mb-md leading-tight">{listing.title}</h1>
                <div className="flex items-center gap-sm mb-xl text-on-surface-variant">
                  <span className="flex items-center gap-xs font-label-md text-label-md">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    <span>{listing.location || 'Remote'}</span>
                  </span>
                  <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                  <span className="font-label-md text-label-md">{dateString}</span>
                </div>

                {/* Specs Grid */}
                {listing.category.toLowerCase() === 'vehicles' ? (
                  <div className="grid grid-cols-2 gap-sm md:gap-md mb-xl">
                    <div className="bg-surface-container-low p-md rounded-lg">
                      <span className="text-on-surface-variant font-label-sm text-label-sm block mb-xs">Year</span>
                      <span className="font-headline-sm text-headline-sm">{year}</span>
                    </div>
                    <div className="bg-surface-container-low p-md rounded-lg">
                      <span className="text-on-surface-variant font-label-sm text-label-sm block mb-xs">Mileage</span>
                      <span className="font-headline-sm text-headline-sm">{mileage}</span>
                    </div>
                    <div className="bg-surface-container-low p-md rounded-lg">
                      <span className="text-on-surface-variant font-label-sm text-label-sm block mb-xs">Fuel</span>
                      <span className="font-headline-sm text-headline-sm">{fuel}</span>
                    </div>
                    <div className="bg-surface-container-low p-md rounded-lg">
                      <span className="text-on-surface-variant font-label-sm text-label-sm block mb-xs">Transmission</span>
                      <span className="font-headline-sm text-headline-sm">{transmission}</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-sm md:gap-md mb-xl">
                    <div className="bg-surface-container-low p-md rounded-lg col-span-2">
                      <span className="text-on-surface-variant font-label-sm text-label-sm block mb-xs">Category</span>
                      <span className="font-headline-sm text-headline-sm capitalize">{listing.category}</span>
                    </div>
                  </div>
                )}

                {/* CTA Action Buttons */}
                <div className="space-y-sm">
                  <a
                    href={listing.contactUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-primary text-on-primary py-md rounded-lg font-headline-sm text-headline-sm hover:opacity-95 transition-all flex items-center justify-center gap-md active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined">mail</span> Contact Seller
                  </a>
                  <a
                    href={listing.originalPostUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-surface-container-high text-primary py-md rounded-lg font-headline-sm text-headline-sm hover:bg-surface-container-highest transition-all flex items-center justify-center gap-md active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      social_leaderboard
                    </span>
                    View on Facebook
                  </a>
                </div>
              </div>

              {/* Seller Card */}
              <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant/30 shadow-sm">
                <div className="flex items-center gap-md mb-lg">
                  <div className="w-14 h-14 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[36px] text-on-surface-variant">person</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm">
                      {listing.importedPost?.authorName || 'Verified Member'}
                    </h3>
                    <div className="flex items-center gap-xs text-secondary font-label-md text-label-md">
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        verified
                      </span>
                      Verified Seller
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center py-sm border-t border-outline-variant/20">
                  <span className="text-on-surface-variant font-body-sm text-body-sm">Facebook Source Group</span>
                  <span className="font-label-md text-label-md text-primary max-w-[200px] truncate block" title={listing.importedPost?.group.name}>
                    {listing.importedPost?.group.name || 'Facebook Group'}
                  </span>
                </div>
                <Link
                  className="block text-center mt-md text-primary font-label-md text-label-md hover:underline"
                  href="/marketplace"
                >
                  View Other Listings
                </Link>
              </div>

              {/* Topographic Map Card */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
                <div className="h-48 w-full bg-surface-container relative">
                  <img
                    className="w-full h-full object-cover grayscale opacity-60"
                    alt="Map placeholder"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBsfpI1utSeKWIhUUXruaSPyJeh7ptC3i8748zj9gKoBQgvv6-x9NSxSZGX4T_teAlVim5w8ip347RRa3imIcs5QdVfv20pjughxSAoB1HJEg2R1iCodCjxekUxdJwu6bIG_UJkDqzttgYDZrbNUjjq2Dmtfby6SZcV1Sa2ymf-sp_8DZS5MVnvaqIbQfmfYn2JQVOfPkymHWH1PcEvOif03t0mPhKeMQcqgI_e09wbZwmaJXaJAyYJTZ9vo24CMvgNIHnoyyuCtA0"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        location_on
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-md">
                  <p className="text-on-surface font-label-md text-label-md">Location: {listing.location || 'Remote'}</p>
                  <p className="text-on-surface-variant font-body-sm text-body-sm">Detailed coordinates provided upon inquiry.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar High-End Listings Section */}
        {similarListings.length > 0 && (
          <section className="mt-xxl pt-xxl border-t border-outline-variant/30">
            <div className="flex justify-between items-center mb-xl">
              <h2 className="font-headline-lg text-headline-lg">Similar High-End Listings</h2>
              <Link
                className="text-primary font-label-md text-label-md hover:underline flex items-center gap-xs"
                href="/marketplace"
              >
                View all <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
              {similarListings.map((sim) => (
                <Link
                  key={sim.id}
                  href={`/listing-detail/${sim.id}`}
                  className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[4/3] relative overflow-hidden bg-surface-container-low">
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src={sim.images[0] || defaultFallback}
                        alt={sim.title}
                      />
                    </div>
                    <div className="p-md">
                      <span className="text-on-surface-variant font-label-sm text-label-sm mb-1 block capitalize">
                        {sim.category}
                      </span>
                      <h4 className="font-headline-sm text-headline-sm mb-xs group-hover:text-primary transition-colors truncate">
                        {sim.title}
                      </h4>
                      <p className="text-primary font-bold text-headline-sm mb-md">
                        ${Number(sim.price).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="p-md pt-0">
                    <div className="flex items-center gap-xs text-on-surface-variant font-label-sm text-label-sm">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      <span className="truncate">{sim.location || 'Remote'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/30 py-xxl mt-xxl">
        <div className="max-w-container-max mx-auto px-md md:px-lg grid grid-cols-1 md:grid-cols-4 gap-xl">
          <div className="col-span-2">
            <span className="text-headline-md font-headline-md font-bold text-primary mb-md block">GroupMarket</span>
            <p className="text-on-surface-variant font-body-md text-body-md max-w-md">
              The premium marketplace for niche Facebook groups and automotive enthusiasts. Experience the power of social commerce with professional tools and verification.
            </p>
          </div>
          <div>
            <h5 className="font-headline-sm text-headline-sm mb-md">Marketplace</h5>
            <ul className="space-y-sm text-on-surface-variant font-body-sm text-body-sm">
              <li><Link className="hover:text-primary transition-colors" href="/marketplace">Browse Feed</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/add-group">Sync Groups</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/dashboard">Seller Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-headline-sm text-headline-sm mb-md">Resources</h5>
            <ul className="space-y-sm text-on-surface-variant font-body-sm text-body-sm">
              <li><a className="hover:text-primary transition-colors" href="#">Trust &amp; Safety</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Help Center</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-container-max mx-auto px-lg mt-xxl pt-lg border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center gap-md">
          <p className="text-on-surface-variant font-label-sm text-label-sm">© 2026 GroupMarket Inc. All rights reserved.</p>
          <div className="flex gap-lg">
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors">language</span>
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors">share</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
