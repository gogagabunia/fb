import { Metadata } from 'next';
import Link from 'next/link';
import { getListingById, getMarketplaceListings } from '../../actions';
import ListingDetailClient from './ListingDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Generate premium dynamic SEO metadata for each individual listing
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing) {
    return {
      title: 'Listing Not Found | GroupMarket',
      description: 'The requested listing could not be found on the marketplace.',
    };
  }

  const formattedPrice = `$${Number(listing.price).toLocaleString()}`;
  return {
    title: `${listing.title} - ${formattedPrice} | GroupMarket`,
    description: listing.description.slice(0, 160),
    openGraph: {
      title: `${listing.title} | GroupMarket`,
      description: listing.description.slice(0, 160),
      images: listing.images && listing.images.length > 0 ? [{ url: listing.images[0] }] : [],
    },
  };
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  // 1. Fetch current listing from Postgres
  const listing = await getListingById(id);

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between selection:bg-secondary-container">
        {/* Simple Header */}
        <nav className="bg-surface border-b border-outline-variant/30 py-sm">
          <div className="max-w-container-max mx-auto px-lg flex items-center justify-between">
            <Link href="/" className="text-headline-md font-bold text-primary">
              GroupMarket
            </Link>
            <Link href="/marketplace" className="text-label-md text-primary hover:underline">
              Back to Browse
            </Link>
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 flex flex-col items-center justify-center text-center p-xl max-w-md mx-auto">
          <div className="w-20 h-20 bg-error-container/20 rounded-full flex items-center justify-center mb-lg border border-error/10">
            <span className="material-symbols-outlined text-[48px] text-error">info</span>
          </div>
          <h1 className="text-headline-lg font-bold text-primary mb-md">Listing Not Found</h1>
          <p className="text-body-md text-on-surface-variant mb-xl leading-relaxed">
            The listing you are looking for might have been sold, archived, or does not exist in our database.
          </p>
          <Link
            href="/marketplace"
            className="px-xl py-md bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-xs"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Return to Marketplace
          </Link>
        </main>

        {/* Simple Footer */}
        <footer className="bg-surface border-t border-outline-variant/20 py-md text-center text-xs text-slate-400">
          © {new Date().getFullYear()} GroupMarket Inc. All rights reserved.
        </footer>
      </div>
    );
  }

  // 2. Fetch similar listings for related carousel (in same category or general)
  const allListings = await getMarketplaceListings();
  const similarListings = allListings
    .filter((l) => l.id !== listing.id && (l.category === listing.category || l.price > 10000))
    .slice(0, 4) as any[];

  return <ListingDetailClient listing={listing as any} similarListings={similarListings} />;
}
