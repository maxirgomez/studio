import { Suspense } from 'react';
import DashboardClientPage from '@/components/dashboard/dashboard-client';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-9 w-48 mb-2" />
                    <Skeleton className="h-5 w-72" />
                </div>
                <div className="w-full max-w-xs">
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
                {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full" />
                ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
            </div>
             <div className="grid gap-4 mt-4 grid-cols-1">
                 <Skeleton className="h-96 w-full" />
                 <Skeleton className="h-[550px] w-full" />
                 <Skeleton className="h-[500px] w-full" />
            </div>
        </div>
    )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardClientPage />
    </Suspense>
  );
}
