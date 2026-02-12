import { DashboardLayout } from "@/components/product/dashboard-layout";

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
