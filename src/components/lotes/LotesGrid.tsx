'use client'

import ListingCard, { Listing } from "@/components/lotes/ListingCard";
import Link from "next/link";
import React from "react";
import ListingCardSkeleton from "@/components/lotes/ListingCardSkeleton";
import { useRouter } from "next/navigation";
import { useSpinner } from "@/components/ui/SpinnerProvider";

interface LotesGridProps {
  listings: Listing[];
  loading?: boolean;
}

const LotesGrid: React.FC<LotesGridProps> = ({ listings, loading = false }) => {
  const router = useRouter();
  const { show } = useSpinner();
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {loading
        ? Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)
        : listings.map((listing) => (
            <div
              key={listing.smp}
              className="block cursor-pointer"
              onClick={() => {
                show();
                router.push(`/lotes/${listing.smp}`);
              }}
            >
              <ListingCard listing={listing} />
            </div>
          ))}
    </div>
  );
};

export default LotesGrid; 