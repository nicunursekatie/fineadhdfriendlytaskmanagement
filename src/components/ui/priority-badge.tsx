import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, ArrowDown, ArrowUp, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type PriorityType = "urgent" | "important" | "medium" | "low" | "quick-win";

interface PriorityBadgeProps {
  priority: PriorityType;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config: Record<PriorityType, {
    label: string;
    icon: React.ElementType;
    variant: "destructive" | "default" | "secondary" | "outline";
    customClass?: string;
  }> = {
    "urgent": {
      label: "Urgent",
      icon: AlertCircle,
      variant: "destructive",
    },
    "important": {
      label: "Important",
      icon: AlertTriangle,
      variant: "default",
    },
    "medium": {
      label: "Medium",
      icon: ArrowUp,
      variant: "secondary",
    },
    "low": {
      label: "Low",
      icon: ArrowDown,
      variant: "outline",
    },
    "quick-win": {
      label: "Quick Win",
      icon: Zap,
      variant: "default",
      customClass: "bg-emerald-500 hover:bg-emerald-600",
    },
  };

  const { label, icon: Icon, variant, customClass } = config[priority];

  return (
    <Badge 
      variant={variant} 
      className={cn("gap-1", customClass, className)}
    >
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </Badge>
  );
}