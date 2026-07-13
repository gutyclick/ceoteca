import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AdminAccessGate } from "@/components/training/admin/AdminAccessGate";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
export default function AdminTrainingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminAccessGate>{children}</AdminAccessGate>;
}
