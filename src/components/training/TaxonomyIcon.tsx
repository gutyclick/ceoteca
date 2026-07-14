import {
  BadgeDollarSign,
  CalendarCheck,
  ChartNoAxesCombined,
  GitBranch,
  Megaphone,
  MessagesSquare,
  Rocket,
  Users,
} from "lucide-react";

const icons = {
  BadgeDollarSign,
  CalendarCheck,
  ChartNoAxesCombined,
  GitBranch,
  Megaphone,
  MessagesSquare,
  Rocket,
  Users,
};

export function TaxonomyIcon({
  name,
  size = 22,
}: {
  name: string;
  size?: number;
}) {
  const Icon = icons[name as keyof typeof icons] ?? Megaphone;
  return <Icon aria-hidden="true" size={size} />;
}
