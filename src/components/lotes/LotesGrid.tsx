import ListingCard, { Listing } from "@/components/lotes/ListingCard";
import Link from "next/link";
import React from "react";
import ListingCardSkeleton from "@/components/lotes/ListingCardSkeleton";

interface LotesGridProps {
  listings: Listing[];
  loading?: boolean;
}

const LotesGrid: React.FC<LotesGridProps> = ({ listings, loading = false }) => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
    {loading
      ? Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)
      : listings.map((listing) => (
          <Link href={`/lotes/${listing.smp}`} key={listing.smp} className="block">
            <ListingCard listing={listing} />
          </Link>
        ))}
  </div>
);

export default LotesGrid; 