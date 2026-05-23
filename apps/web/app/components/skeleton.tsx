'use client';

export function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200 rounded ${className}`}></div>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm flex flex-col h-[380px]">
      <div className="relative h-48 w-full bg-slate-100 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full"></div>
      </div>
      <div className="p-md flex flex-col justify-between flex-grow space-y-sm">
        <div className="space-y-xs">
          <Shimmer className="h-5 w-3/4" />
          <Shimmer className="h-6 w-1/3" />
          <Shimmer className="h-4 w-full" />
          <Shimmer className="h-4 w-5/6" />
        </div>
        <Shimmer className="h-8 w-full mt-auto" />
      </div>
    </div>
  );
}

export function MarketplaceSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-md md:gap-lg">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-xl w-full">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-container-lowest border border-outline-variant/30 p-xl rounded-xl shadow-sm flex flex-col space-y-sm">
            <Shimmer className="h-4 w-1/2" />
            <div className="flex justify-between items-center">
              <Shimmer className="h-10 w-1/4" />
              <Shimmer className="h-6 w-1/3 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
        {/* Table column */}
        <div className="lg:col-span-2 space-y-md">
          <Shimmer className="h-8 w-1/4" />
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-md space-y-md">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between items-center py-sm border-b border-outline-variant/10 last:border-none">
                <div className="space-y-xs w-2/3">
                  <Shimmer className="h-5 w-1/2" />
                  <Shimmer className="h-4 w-1/3" />
                </div>
                <Shimmer className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Side card column */}
        <div className="space-y-lg">
          <Shimmer className="h-8 w-1/3" />
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-xl space-y-md">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-sm items-center">
                <Shimmer className="w-10 h-10 rounded-full" />
                <div className="space-y-xs w-full">
                  <Shimmer className="h-4 w-2/3" />
                  <Shimmer className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function QueueSkeleton() {
  return (
    <div className="space-y-xl w-full">
      <div className="flex justify-between items-center border-b border-outline-variant/20 pb-md">
        <Shimmer className="h-8 w-1/4" />
        <div className="flex gap-sm">
          <Shimmer className="h-10 w-24 rounded-lg" />
          <Shimmer className="h-10 w-24 rounded-lg" />
        </div>
      </div>
      <div className="space-y-md">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-xl shadow-sm flex flex-col md:flex-row gap-lg">
            {/* Image Placeholder */}
            <Shimmer className="w-full md:w-48 h-32 rounded-lg shrink-0" />
            
            {/* Metadata Shimmers */}
            <div className="flex-grow space-y-sm flex flex-col justify-between">
              <div className="space-y-xs">
                <div className="flex justify-between">
                  <Shimmer className="h-6 w-1/3" />
                  <Shimmer className="h-4 w-20" />
                </div>
                <Shimmer className="h-4 w-1/4" />
                <Shimmer className="h-4 w-full" />
                <Shimmer className="h-4 w-5/6" />
              </div>
              <div className="flex justify-end gap-sm mt-md">
                <Shimmer className="h-10 w-24 rounded-lg" />
                <Shimmer className="h-10 w-24 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
