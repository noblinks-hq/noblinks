import { DashboardLayout } from "@/components/product/dashboard-layout";
import { requireOrgAuth } from "@/lib/session";

export default async function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOrgAuth();
  return <DashboardLayout>{children}</DashboardLayout>;
}
