import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Active Services Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 rounded-md" />
        </div>
        
        <div className="grid lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={`active-${i}`} className="border-l-4 border-l-primary/30 h-full">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-3/4 rounded-md" />
                    <Skeleton className="h-4 w-1/2 rounded-md" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full shrink-0" />
                </div>
                
                <div className="space-y-3 mt-6">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-32 rounded-md" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-40 rounded-md" />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Skeleton className="h-10 w-32 rounded-md" />
                  <Skeleton className="h-10 w-28 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Completed Services Section / Extras (smaller cards) */}
      <div className="space-y-4 pt-4 border-t border-border/50">
        <Skeleton className="h-8 w-48 rounded-md mb-4" />
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={`completed-${i}`} className="opacity-80">
              <CardContent className="p-5 flex justify-between items-center">
                <div className="space-y-2 w-2/3">
                  <Skeleton className="h-5 w-full rounded-md" />
                  <Skeleton className="h-4 w-1/2 rounded-md" />
                </div>
                <Skeleton className="h-8 w-16 rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

    </div>
  );
};
