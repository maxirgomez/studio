import { Suspense } from "react";
import LotesClientPage from "./../../components/dashboard/LotesClientPage";

export default function LotesPage() {
  return (
    <Suspense fallback={<div>Cargando lotes...</div>}>
      <LotesClientPage />
    </Suspense>
  );
}
