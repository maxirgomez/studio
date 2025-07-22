"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";

interface PageProps {
  params: Promise<{ smp: string; numero: string }>;
}

export default function LoteDetallePage({ params }: PageProps) {
  const { smp, numero } = use(params);
  const router = useRouter();

  useEffect(() => {
    // Redirigir a la página SMP original con el número como parámetro de query
    router.replace(`/lotes/${smp}?direccion=${numero}`);
  }, [smp, numero, router]);

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Redirigiendo a la vista del SMP...</p>
      </div>
    </div>
  );
} 