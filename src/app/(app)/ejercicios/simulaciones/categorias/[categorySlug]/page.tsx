import { RoleplayCatalogView } from "@/components/training/roleplay/RoleplayCatalogView";
export default async function RoleplayCategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  return <RoleplayCatalogView initialCategory={(await params).categorySlug} />;
}
