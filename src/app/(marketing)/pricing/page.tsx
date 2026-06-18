import type { Metadata } from "next";

import { PricingPage } from "@/components/pricing/PricingPage";

export const metadata: Metadata = {
  title: "Precios",
  description:
    "Planes de Ceoteca: Gratis, Pro, Ilimitado y Fundador con pagos deshabilitados hasta definir proveedor.",
};

export default function PricingRoutePage() {
  return <PricingPage />;
}
