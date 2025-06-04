import { useState } from "react";
import { cn } from "@/lib/utils";
import { Battery, BatteryFull, BatteryLow, BatteryMedium, BatteryWarning } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EnergySelectorProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function EnergySelector({ value, onChange, className }: EnergySelectorProps) {
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);
  
  const energyLevels = [
    { level: 1, label: "Very Low", icon: BatteryLow, color: "text-red-500" },
    { level: 2, label: "Low", icon: BatteryWarning, color: "text-orange-500" },
    { level: 3, label: "Medium", icon: BatteryMedium, color: "text-yellow-500" },
    { level: 4, label: "High", icon: Battery, color: "text-green-500" },
    { level: 5, label: "Very High", icon: BatteryFull, color: "text-emerald-500" },
  ];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm font-medium">Energy:</span>
      <div className="flex gap-1">
        {energyLevels.map((energy) => {
          const Icon = energy.icon;
          const isSelected = value === energy.level;
          const isHovered = hoveredLevel === energy.level || hoveredLevel === null;
          
          return (
            <TooltipProvider key={energy.level}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onChange(energy.level)}
                    onMouseEnter={() => setHoveredLevel(energy.level)}
                    onMouseLeave={() => setHoveredLevel(null)}
                    className={cn(
                      "p-1 rounded-md transition-all",
                      isSelected ? `${energy.color} bg-muted` : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-label={`Set energy level to ${energy.label}`}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{energy.label} Energy</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}