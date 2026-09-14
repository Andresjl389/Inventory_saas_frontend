import { CardsSkeleton } from "@/components/shared/loading-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <CardsSkeleton />
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}
