import React from "react";

export default function UserFormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-full" />
      <div className="h-10 bg-gray-200 rounded w-full" />
      <div className="h-10 bg-gray-200 rounded w-full" />
      <div className="h-10 bg-gray-200 rounded w-full" />
      <div className="h-10 bg-blue-200 rounded w-1/2 mx-auto" />
    </div>
  );
} 