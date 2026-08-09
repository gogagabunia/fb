import Link from 'next/link';
import { cookies } from 'next/headers';
import { prisma } from './lib/prisma';
import { getViewer } from './lib/authz';
import { can } from './lib/authz';
import { CATEGORIES } from './lib/categories';
import { getLang, t, LANG_COOKIE } from './lib/i18n';
import { formatPrice } from './lib/format-price';
import { LangSwitcher } from './components/lang-switcher';
import { FavoriteHeart } from './components/favorite-heart';

// The landing page is the storefront: live category counts, the freshest
// listings, and the viewer's language — all per-request.
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
      take: 12,
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
  // no listings yet simply have no DB row — they render without a badge.
  const idToSlug = new Map(categories.map(c => [c.id, c.slug]));
  const countBySlug = new Map<string, number>();
  for (const row of counts) {
    const slug = idToSlug.get(row.categoryId);
    if (slug) countBySlug.set(slug, (countBySlug.get(slug) ?? 0) + row._count._all);
  }

  return { countBySlug, fresh };
}

export default async function HomePage() {
  const lang = getLang((await cookies()).get(LANG_COOKIE)?.value);
  const [{ countBySlug, fresh }, viewer] = await Promise.all([getDiscoveryData(), getViewer()]);

  // Which of the fresh listings the viewer already saved, so hearts render
  // filled without a client-side fetch.
  let savedIds = new Set<string>();
  if (viewer && fresh.length > 0) {
    const saved = await prisma.savedListing.findMany({
      where: { userId: viewer.userId, listingId: { in: fresh.map(l => l.id) } },
      select: { listingId: true }
    });
    savedIds = new Set(saved.map(s => s.listingId));
  }

  const sellHref = !viewer ? '/register?role=seller' : can(viewer.role, 'sell') ? '/dashboard' : null;

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      {/* Header: logo, search, + Sell, language, account. Search lives here —
          there is no hero; listings start immediately, mymarket-style. */}
      <header className="bg-surface/95 backdrop-blur-md sticky top-0 z-50 border-b border-outline-variant/30 shadow-sm">
        <div className="flex items-center gap-md w-full px-md md:px-lg max-w-container-max mx-auto h-16 md:h-20">
          <Link className="text-headline-sm md:text-headline-md font-bold text-primary shrink-0" href="/">
            GroupMarket
          </Link>

          <form action="/marketplace" method="GET" className="flex-1 flex min-w-0">
            <div className="flex flex-1 items-center gap-sm bg-surface-container-low border border-outline-variant/60 rounded-full px-md py-2 focus-within:ring-2 focus-within:ring-primary min-w-0">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
              <input
                type="search"
                name="search"
                placeholder={t('searchPlaceholder', lang)}
                className="flex-1 bg-transparent text-body-md outline-none min-w-0"
              />
              <button type="submit" className="hidden sm:block px-md py-1 rounded-full bg-primary text-on-primary text-label-md hover:opacity-90 transition-all shrink-0">
                {t('searchButton', lang)}
              </button>
            </div>
          </form>

          <div className="flex items-center gap-sm shrink-0">
            {sellHref && (
              <Link
                href={sellHref}
                className="hidden sm:flex items-center gap-xs px-md py-2 rounded-lg bg-secondary text-on-secondary font-label-md font-bold hover:opacity-90 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                {t('sell', lang)}
              </Link>
            )}
            <LangSwitcher current={lang} />
            {viewer ? (
              <>
                {can(viewer.role, 'sell') && (
                  <Link className="hidden md:block text-on-surface-variant hover:text-primary transition-colors font-label-md" href="/dashboard">
                    {t('dashboard', lang)}
                  </Link>
                )}
                {can(viewer.role, 'manage_users') && (
                  <Link className="hidden md:block text-on-surface-variant hover:text-primary transition-colors font-label-md" href="/admin">
                    {t('admin', lang)}
                  </Link>
                )}
                <Link
                  href="/favorites"
                  className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container-low rounded-full transition-all"
                  aria-label={t('favorites', lang)}
                >
                  favorite
                </Link>
                <Link
                  href="/settings"
                  className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container-low rounded-full transition-all"
                  aria-label={t('settings', lang)}
                >
                  settings
                </Link>
              </>
            ) : (
              <Link href="/login" className="px-md py-2 rounded-lg font-label-md text-primary hover:bg-surface-container-low transition-all">
                {t('login', lang)}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-container-max mx-auto px-md md:px-lg pb-xl">
        {/* Category chips: every category, horizontally scrollable, live count
            badge only when a category actually has listings. */}
        <nav className="flex gap-sm overflow-x-auto py-md -mx-md px-md md:mx-0 md:px-0" aria-label={t('allCategories', lang)}>
          {CATEGORIES.map(category => {
            const count = countBySlug.get(category.slug) ?? 0;
            return (
              <Link
                key={category.slug}
                href={`/marketplace?category=${category.slug}`}
                className="flex items-center gap-xs shrink-0 bg-surface border border-outline-variant/50 rounded-full px-md py-2 hover:border-primary hover:shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">{category.icon}</span>
                <span className="text-label-md text-on-surface">{lang === 'ka' ? category.nameKa : category.name}</span>
                {count > 0 && <span className="text-label-md font-bold text-secondary">{count}</span>}
              </Link>
            );
          })}
        </nav>

        {/* The listing grid — the heart of the page. */}
        <section>
          <div className="flex items-baseline justify-between mb-md">
            <h1 className="text-headline-sm md:text-headline-md font-bold text-primary">{t('freshHeading', lang)}</h1>
            <Link href="/marketplace" className="font-label-md text-secondary font-bold hover:underline shrink-0">
              {t('seeAll', lang)}
            </Link>
          </div>
          {fresh.length === 0 ? (
            <p className="text-body-md text-on-surface-variant bg-surface border border-outline-variant/40 rounded-xl p-xl text-center">
              {t('emptyState', lang)}
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-sm md:gap-md">
              {fresh.map(listing => (
                <Link
                  key={listing.id}
                  href={`/listing-detail/${listing.id}`}
                  className="group relative bg-surface border border-outline-variant/40 rounded-xl overflow-hidden hover:shadow-md hover:border-primary transition-all"
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
                  <FavoriteHeart listingId={listing.id} initiallySaved={savedIds.has(listing.id)} />
                  <div className="p-sm md:p-md">
                    <p className="text-body-md text-on-surface leading-snug line-clamp-2">{listing.title}</p>
                    <p className="text-title-md font-bold text-primary mt-xs">{formatPrice(listing.price)}</p>
                    <p className="text-label-sm text-on-surface-variant mt-xs truncate">
                      {listing.categoryRel?.name ?? 'Other'}
                      {listing.location ? ` · ${listing.location}` : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </main>

      <footer className="bg-surface border-t border-outline-variant/20 py-md px-md text-center text-label-sm text-on-surface-variant">
        {t('footerBlurb', lang)} · © {new Date().getFullYear()} GroupMarket
      </footer>
    </div>
  );
}
