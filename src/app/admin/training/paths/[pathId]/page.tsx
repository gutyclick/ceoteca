import { AdminPathEditorPage } from "@/components/training/admin/AdminPathEditorPage";
export default async function Page({
  params,
}: {
  params: Promise<{ pathId: string }>;
}) {
  return <AdminPathEditorPage pathId={(await params).pathId} />;
}
