import { AppChrome } from "@/components/app/AppChrome";
import { PrivateRouteGuard } from "@/components/auth/PrivateRouteGuard";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PrivateRouteGuard>
      <AppChrome>{children}</AppChrome>
    </PrivateRouteGuard>
  );
}
