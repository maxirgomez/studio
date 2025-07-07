import { Suspense } from "react";
import LotesClientPage from "./../../components/dashboard/LotesClientPage";
import LotesGrid from "@/components/lotes/LotesGrid";

function LotesLoading() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-10 w-40 bg-muted rounded animate-pulse" />
      </div>
      <LotesGrid listings={[]} loading />
    </div>
  );
}

export default function LotesPage() {
  return (
    <Suspense fallback={<LotesLoading />}>
      <LotesClientPage />
    </Suspense>
  );
}
