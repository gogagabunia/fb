'use client';

import { useState } from 'react';

interface SearchBarProps {
  search: string;
  setSearch: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  categories: string[];
  minPrice: string;
  setMinPrice: (value: string) => void;
  maxPrice: string;
  setMaxPrice: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
}

export default function SearchBar({
  search,
  setSearch,
  category,
  setCategory,
  categories,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  sortBy,
  setSortBy,
}: SearchBarProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-md shadow-sm space-y-md">
      {/* Top Search Row */}
      <div className="flex flex-col sm:flex-row gap-md items-center">
        {/* Search Input */}
        <div className="relative flex-grow w-full">
          <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant/60">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search listings by title, description, or group..."
            className="w-full h-12 pl-[42px] pr-xl rounded-lg bg-surface border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-primary transition-colors"
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex gap-sm w-full sm:w-auto shrink-0 justify-end">
          {/* Sorting */}
          <div className="relative w-full sm:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-12 px-md pr-xl rounded-lg bg-surface border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-sm appearance-none cursor-pointer"
            >
              <option value="newest">Sort by: Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
            <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
              expand_more
            </span>
          </div>

          {/* Toggle Filters (Mobile only) */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="sm:hidden flex items-center justify-center gap-xs px-md h-12 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 rounded-lg text-label-md font-bold transition-all whitespace-nowrap"
          >
            <span className="material-symbols-outlined">tune</span>
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Desktop Filters / Expandable Mobile Filters */}
      <div className={`${showMobileFilters ? 'block' : 'hidden'} sm:grid sm:grid-cols-3 gap-lg pt-sm border-t border-outline-variant/20`}>
        {/* Category Filter */}
        <div className="space-y-xs">
          <label className="text-label-sm font-bold text-on-surface-variant">Category</label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-md pr-xl rounded-lg bg-surface border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-sm appearance-none cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
              expand_more
            </span>
          </div>
        </div>

        {/* Price Range Filter */}
        <div className="space-y-xs col-span-2">
          <label className="text-label-sm font-bold text-on-surface-variant">Price Range ($)</label>
          <div className="flex items-center gap-sm">
            <div className="relative w-full">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min Price"
                className="w-full h-10 px-md rounded-lg bg-surface border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-sm"
              />
            </div>
            <span className="text-outline-variant font-medium">—</span>
            <div className="relative w-full">
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max Price"
                className="w-full h-10 px-md rounded-lg bg-surface border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
