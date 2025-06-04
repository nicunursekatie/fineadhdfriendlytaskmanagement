import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, ArrowDown, ArrowUp, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type PriorityType = "urgent" | "important" | "medium" | "low" | "quick-win";

interface PriorityBadgeProps {
  priority: PriorityType;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = {
    "urgent": {
      label: "Urgent",
      icon: AlertCircle,
      variant: "destructive" as const,
    },
    "important": {
      label: "Important",
      icon: AlertTriangle,
      variant: "default" as const,
    },
    "medium": {
      label: "Medium",
      icon: ArrowUp,
      variant: "secondary" as const,
    },
    "low": {
      label: "Low",
      icon: ArrowDown,
      variant: "outline" as const,
    },
    "quick-win": {
      label: "Quick Win",
      icon: Zap,
      variant: "default" as const,
      className: "bg-emerald-500 hover:bg-emerald-600",
    },
  };

  const { label, icon: Icon, variant, className: priorityClassName } = config[priority];

  return (
    <Badge 
      variant={variant} 
      className={cn("gap-1", priorityClassName, className)}
    >
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </Badge>
  );
}