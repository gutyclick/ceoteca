import type { ReactNode } from "react";
import { AdminTrainingShell } from "@/components/training/admin/AdminTrainingShell";
export default function AdminTrainingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminTrainingShell>{children}</AdminTrainingShell>;
}
