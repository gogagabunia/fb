import { getFavoritesAction } from '../actions';
import { getCurrentUser } from '../auth-actions';
import FavoritesClient from './FavoritesClient';

// Reads the session cookie, so it can never be prerendered. Declaring it
// here stops Next attempting a static render and logging the failure at build.
export const dynamic = 'force-dynamic';

/**
 * Server component: saved listings and the current user are fetched here, so
 * the grid arrives with the HTML instead of after a mount-time round trip.
 */
export default async function FavoritesPage() {
  const [favorites, user] = await Promise.all([getFavoritesAction(), getCurrentUser()]);

  return <FavoritesClient initialFavorites={favorites as any} user={user} />;
}
