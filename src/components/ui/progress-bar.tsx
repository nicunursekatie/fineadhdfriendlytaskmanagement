import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  value: number;
  max: number;
  showLabel?: boolean;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

export function ProgressBar({ 
  value, 
  max, 
  showLabel = true, 
  className,
  variant = "default" 
}: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100);
  
  const variantClasses = {
    default: "bg-primary",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500"
  };

  return (
    <div className={cn("w-full space-y-1", className)}>
      <Progress 
        value={percentage} 
        className={cn("h-2", "[&>div]:bg-primary", variant === "success" && "[&>div]:bg-emerald-500", 
                      variant === "warning" && "[&>div]:bg-amber-500", 
                      variant === "danger" && "[&>div]:bg-red-500")}
      />
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{value} of {max}</span>
          <span>{percentage}%</span>
        </div>
      )}
    </div>
  );
}