import Link from 'next/link';
import { prisma } from './lib/prisma';
import { getViewer } from './lib/authz';
import { can } from './lib/authz';
import { CATEGORIES } from './lib/categories';

// The landing page is the discovery surface: live category counts and the
// freshest listings. Rendered per-request — counts and the viewer's role are
// both dynamic.
export const dynamic = 'force-dynamic';

async function getDiscoveryData() {
  const [counts, categories, fresh] = await Promise.all([
    prisma.listing.groupBy({
      by: ['categoryId'],
      where: { isActive: true },
      _count: { _all: true }
    }),
    prisma.category.findMany({ select: { id: true, slug: true } }),
    prisma.listing.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        title: true,
        price: true,
        images: true,
        location: true,
        categoryRel: { select: { name: true } }
      }
    })
  ]);

  // groupBy keys on categoryId; the fixed list keys on slug. Categories with
  // no listings yet simply have no DB row — they render with a 0.
  const idToSlug = new Map(categories.map(c => [c.id, c.slug]));
  const countBySlug = new Map<string, number>();
  for (const row of counts) {
    const slug = idToSlug.get(row.categoryId);
    if (slug) countBySlug.set(slug, (countBySlug.get(slug) ?? 0) + row._count._all);
  }

  return { countBySlug, fresh };
}

export default async function HomePage() {
  const [{ countBySlug, fresh }, viewer] = await Promise.all([getDiscoveryData(), getViewer()]);

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      <header className="bg-surface/80 backdrop-blur-md sticky top-0 z-50 border-b border-outline-variant/30 shadow-sm">
        <div className="flex justify-between items-center w-full px-md md:px-lg py-sm max-w-container-max mx-auto h-20">
          <div className="flex items-center gap-xl">
            <Link className="text-headline-md font-bold text-primary" href="/">
              GroupMarket
            </Link>
            <nav className="hidden md:flex items-center gap-lg">
              <Link className="text-on-surface-variant hover:text-primary transition-colors font-label-md" href="/marketplace">
                Browse all
              </Link>
              {viewer && can(viewer.role, 'sell') && (
                <Link className="text-on-surface-variant hover:text-primary transition-colors font-label-md" href="/dashboard">
                  Dashboard
                </Link>
              )}
              {viewer && can(viewer.role, 'manage_users') && (
                <Link className="text-on-surface-variant hover:text-primary transition-colors font-label-md" href="/admin">
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-md">
            {viewer ? (
              <>
                <Link
                  href="/favorites"
                  className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container-low rounded-full transition-all"
                  aria-label="Favorites"
                >
                  favorite
                </Link>
                <Link
                  href="/settings"
                  className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container-low rounded-full transition-all"
                  aria-label="Settings"
                >
                  settings
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="px-lg py-2.5 rounded-lg font-label-md text-primary hover:bg-surface-container-low transition-all">
                  Log in
                </Link>
                <Link href="/register" className="px-lg py-2.5 rounded-lg font-label-md bg-primary text-on-primary hover:opacity-90 transition-all">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-container-max mx-auto px-md md:px-lg py-xl">
        {/* Search */}
        <section className="text-center py-xl">
          <h1 className="text-display-sm md:text-display-md font-bold text-primary">
            Find it in your community
          </h1>
          <p className="text-body-lg text-on-surface-variant mt-sm max-w-2xl mx-auto">
            Listings imported from local Facebook groups, checked by real sellers, sorted into categories.
          </p>
          <form action="/marketplace" method="GET" className="mt-lg max-w-xl mx-auto flex gap-sm">
            <input
              type="search"
              name="search"
              placeholder="Search for anything — bikes, phones, sofas…"
              className="flex-1 px-lg py-3 bg-surface border border-outline-variant rounded-full text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
            <button type="submit" className="px-xl py-3 rounded-full bg-primary text-on-primary font-label-md hover:opacity-90 transition-all">
              Search
            </button>
          </form>
        </section>

        {/* Category grid */}
        <section className="py-lg">
          <h2 className="text-headline-md font-bold text-primary mb-lg">Browse by category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-md">
            {CATEGORIES.map(category => {
              const count = countBySlug.get(category.slug) ?? 0;
              return (
                <Link
                  key={category.slug}
                  href={`/marketplace?category=${category.slug}`}
                  className="group bg-surface border border-outline-variant/40 rounded-xl p-lg flex flex-col items-center text-center gap-sm hover:border-primary hover:shadow-md transition-all"
                >
                  <span className="material-symbols-outlined text-4xl text-primary group-hover:scale-110 transition-transform">
                    {category.icon}
                  </span>
                  <span className="font-label-md font-bold text-primary">{category.name}</span>
                  <span className="text-label-sm text-on-surface-variant">
                    {count} {count === 1 ? 'listing' : 'listings'}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Fresh listings */}
        <section className="py-lg">
          <div className="flex items-center justify-between mb-lg">
            <h2 className="text-headline-md font-bold text-primary">Fresh listings</h2>
            <Link href="/marketplace" className="font-label-md text-primary hover:underline">
              See all →
            </Link>
          </div>
          {fresh.length === 0 ? (
            <p className="text-body-md text-on-surface-variant bg-surface border border-outline-variant/40 rounded-xl p-xl text-center">
              Nothing here yet — listings appear as sellers approve them.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-md">
              {fresh.map(listing => (
                <Link
                  key={listing.id}
                  href={`/listing-detail/${listing.id}`}
                  className="group bg-surface border border-outline-variant/40 rounded-xl overflow-hidden hover:shadow-md hover:border-primary transition-all"
                >
                  <div className="aspect-[4/3] bg-surface-container-low overflow-hidden">
                    {listing.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={listing.images[0]}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-outline-variant">image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-md">
                    <p className="font-bold text-body-md text-primary truncate">{listing.title}</p>
                    <p className="text-headline-sm font-bold text-primary mt-xs">${listing.price.toLocaleString()}</p>
                    <p className="text-label-sm text-on-surface-variant mt-xs">
                      {listing.categoryRel?.name ?? 'Other'}
                      {listing.location ? ` · ${listing.location}` : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Seller invitation */}
        <section className="py-xl">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-xl text-center">
            <h2 className="text-headline-md font-bold text-primary">Sell from your Facebook group</h2>
            <p className="text-body-md text-on-surface-variant mt-sm max-w-xl mx-auto">
              Connect your group and imported posts land in your moderation queue — approve them and they publish here, in the right category.
            </p>
            {!viewer ? (
              <Link
                href="/register"
                className="inline-block mt-lg px-xl py-3 rounded-lg bg-primary text-on-primary font-label-md hover:opacity-90 transition-all"
              >
                Start selling
              </Link>
            ) : can(viewer.role, 'sell') ? (
              <Link
                href="/dashboard"
                className="inline-block mt-lg px-xl py-3 rounded-lg bg-primary text-on-primary font-label-md hover:opacity-90 transition-all"
              >
                Open your dashboard
              </Link>
            ) : (
              // Buyers cannot self-upgrade — the admin changes roles.
              <p className="text-label-md text-on-surface-variant mt-lg">
                Your account is a buyer account. Ask the site admin to make you a seller.
              </p>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-surface border-t border-outline-variant/20 py-md text-center text-xs text-slate-400">
        © {new Date().getFullYear()} GroupMarket Inc. All rights reserved.
      </footer>
    </div>
  );
}
