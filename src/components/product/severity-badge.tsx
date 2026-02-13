import { Badge } from "@/components/ui/badge";
import type { AlertSeverity } from "@/lib/types";
import { cn } from "@/lib/utils";

const severityStyles: Record<AlertSeverity, string> = {
  critical:
    "border-transparent bg-red-600 text-white hover:bg-red-600",
  warning:
    "border-transparent bg-amber-500 text-white hover:bg-amber-500",
  info: "border-transparent bg-blue-500 text-white hover:bg-blue-500",
};

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  return (
    <Badge className={cn(severityStyles[severity])}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
  );
}
