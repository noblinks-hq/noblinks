import { requireOrgAuth } from "@/lib/session";
import { LensDashboardLayout } from "@/components/lens/lens-layout";

export default async function LensLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOrgAuth();
  return <LensDashboardLayout>{children}</LensDashboardLayout>;
}
