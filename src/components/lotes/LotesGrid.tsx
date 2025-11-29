'use client'

import ListingCard, { Listing } from "@/components/lotes/ListingCard";
import React from "react";
import ListingCardSkeleton from "@/components/lotes/ListingCardSkeleton";

interface LotesGridProps {
  listings: Listing[];
  loading?: boolean;
}

const LotesGrid: React.FC<LotesGridProps> = ({ listings, loading = false }) => {
  const handleCardClick = (smp: string) => {
    window.open(`/lotes/${smp}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {loading
        ? Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)
        : listings.map((listing) => (
            <div
              key={listing.smp}
              onClick={(e) => {
                // Solo abrir si no se hizo clic en un enlace interno
                if ((e.target as HTMLElement).tagName !== 'A') {
                  handleCardClick(listing.smp);
                }
              }}
              className="block cursor-pointer hover:opacity-90 transition-opacity"
            >
              <ListingCard listing={listing} />
            </div>
          ))}
    </div>
  );
};

export default LotesGrid;