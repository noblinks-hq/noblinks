import { Skeleton } from "@/components/ui/skeleton";

export default function OverviewLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 py-4">
      <section className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </section>
      <section className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </section>
    </div>
  );
}
