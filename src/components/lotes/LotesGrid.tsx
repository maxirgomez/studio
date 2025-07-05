import ListingCard, { Listing } from "@/components/lotes/ListingCard";
import Link from "next/link";
import React from "react";

interface LotesGridProps {
  listings: Listing[];
}

const LotesGrid: React.FC<LotesGridProps> = ({ listings }) => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
    {listings.map((listing) => (
      <Link href={`/lotes/${listing.smp}`} key={listing.smp} className="block">
        <ListingCard listing={listing} />
      </Link>
    ))}
  </div>
);

export default LotesGrid; 