import { Skeleton } from "@/components/ui/skeleton";

/**
 * Generic page-level skeleton shown by <Suspense> while a lazy-loaded
 * route chunk is being downloaded. Kept lightweight and layout-safe
 * so it doesn't cause extra CLS when the real page renders.
 */
const PageSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-12 w-3/4 md:w-1/2" />
      <Skeleton className="h-6 w-2/3 md:w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  </div>
);

export default PageSkeleton;
