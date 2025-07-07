import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ProfileCardSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent>
      <div className="flex items-center gap-6 mb-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full mb-2" />
      <Skeleton className="h-10 w-full mb-2" />
      <Skeleton className="h-10 w-32" />
    </CardContent>
  </Card>
);

export default ProfileCardSkeleton; 