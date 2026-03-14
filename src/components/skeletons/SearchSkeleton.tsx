import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const SearchSkeleton = () => {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-4 w-48 rounded" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-full">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4 rounded" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                </div>
              </div>
              
              <div className="space-y-2 mb-4 flex-1">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-5/6 rounded" />
              </div>
              
              <div className="space-y-3 mt-auto">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-20 rounded" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};
