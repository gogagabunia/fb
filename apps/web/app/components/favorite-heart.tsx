'use client';

import { useState } from 'react';
import { toggleFavoriteAction } from '../actions';

/**
 * The save-heart on a homepage listing card. Same server action as the
 * marketplace cards; the card around it is a <Link>, so the click must not
 * navigate. Failures (e.g. not logged in) leave the heart unfilled, matching
 * the marketplace's quiet handling.
 */
export function FavoriteHeart({ listingId, initiallySaved }: { listingId: string; initiallySaved: boolean }) {
  const [saved, setSaved] = useState(initiallySaved);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const result = await toggleFavoriteAction(listingId);
      if (result.success) {
        setSaved(!!result.favorited);
      } else {
        console.error('Failed to toggle favorite:', result.error);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={saved ? 'Remove from saved listings' : 'Save listing'}
      className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-surface/90 shadow-sm flex items-center justify-center transition-colors ${
        saved ? 'text-error' : 'text-on-surface-variant hover:text-error'
      }`}
    >
      <span
        className="material-symbols-outlined text-[18px]"
        style={{ fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}
      >
        favorite
      </span>
    </button>
  );
}
