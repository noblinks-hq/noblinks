import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccessPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-24">
      <div className="text-center space-y-6 max-w-md">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">You&apos;re all set!</h1>
          <p className="text-muted-foreground">
            Your subscription is now active. Welcome to the next level of infrastructure monitoring.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/overview">Go to Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/settings">Manage Billing</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
