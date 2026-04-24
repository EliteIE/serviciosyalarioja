import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton for ProviderProfile page.
 * Mirrors the real layout: cover + avatar row + stats + content grid (2/3 + 1/3).
 * Prevents layout shift (CLS) and communicates "loading real content" better
 * than a single spinner — especially on slow mobile networks.
 */
export const ProviderProfileSkeleton = () => {
  return (
    <div className="min-h-screen bg-background font-sans pb-20">
      {/* HERO */}
      <div className="bg-card border-b border-border">
        {/* Cover */}
        <Skeleton className="h-48 md:h-64 w-full rounded-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-6 -mt-16 sm:-mt-20 relative z-10 mb-4 sm:mb-0">
              {/* Avatar */}
              <Skeleton className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-card shrink-0" />

              <div className="pb-2 space-y-3">
                <Skeleton className="h-8 w-64 rounded" />
                <div className="flex gap-3">
                  <Skeleton className="h-6 w-24 rounded-lg" />
                  <Skeleton className="h-6 w-32 rounded-lg" />
                </div>
              </div>
            </div>

            <div className="hidden sm:flex gap-3 pb-2">
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-8 border-t border-border py-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 flex-shrink-0">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-16 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left column — content sections */}
          <div className="w-full lg:w-2/3 space-y-8">
            {[1, 2, 3].map((i) => (
              <section
                key={i}
                className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm space-y-4"
              >
                <Skeleton className="h-6 w-40 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-5/6 rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                </div>
              </section>
            ))}
          </div>

          {/* Right sidebar — CTA card */}
          <div className="w-full lg:w-1/3 space-y-6">
            <div className="bg-card rounded-2xl border-2 border-primary/20 p-6 shadow-xl space-y-4">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4 rounded mx-auto" />
              <div className="pt-6 border-t border-border space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-20 rounded" />
                      <Skeleton className="h-4 w-32 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <Skeleton className="h-5 w-40 rounded" />
              {[5, 4, 3, 2, 1].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-3 w-6 rounded" />
                  <Skeleton className="h-2 flex-1 rounded-full" />
                  <Skeleton className="h-3 w-8 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderProfileSkeleton;
