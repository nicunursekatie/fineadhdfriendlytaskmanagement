import { useState } from "react";
import { format } from "date-fns";
import { CheckCircle, Clock, Edit, ExternalLink, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnergySelector } from "@/components/ui/energy-selector";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import type { Schema } from "@/lib/db-types";

interface TaskCardProps {
  task: Schema["tasks"] & { id: number };
  onComplete: (taskId: number) => void;
  onEdit: (taskId: number) => void;
  onDelete: (taskId: number) => void;
}

export function TaskCard({ task, onComplete, onEdit, onDelete }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const isCompleted = task.status === "completed";
  const hasDeadline = !!task.dueDate;
  
  const formattedDueDate = hasDeadline 
    ? format(new Date(task.dueDate!), "MMM d, yyyy")
    : null;
  
  const isOverdue = hasDeadline && new Date(task.dueDate!) < new Date() && !isCompleted;

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        isCompleted && "opacity-70",
        isHovered && "border-primary"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h3 className={cn(
              "font-medium line-clamp-2",
              isCompleted && "line-through text-muted-foreground"
            )}>
              {task.title}
            </h3>
            <div className="flex flex-wrap gap-2">
              <PriorityBadge priority={task.priority as any} />
              <Badge variant="outline">{task.context}</Badge>
              {isOverdue && (
                <Badge variant="destructive" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Overdue
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        {task.description && (
          <p className={cn(
            "text-sm text-muted-foreground mb-3 line-clamp-2",
            isCompleted && "line-through"
          )}>
            {task.description}
          </p>
        )}
        
        <div className="flex flex-wrap items-center justify-between gap-2">
          <EnergySelector 
            value={task.energyLevel} 
            onChange={() => {}} // Read-only in card view
            className="pointer-events-none"
          />
          
          {hasDeadline && (
            <div className={cn(
              "text-xs flex items-center gap-1",
              isOverdue ? "text-destructive" : "text-muted-foreground"
            )}>
              <Clock className="h-3 w-3" />
              <span>{formattedDueDate}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2">
        <div className="flex w-full justify-between">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">
              Emotional importance: {task.emotionalImportance}
            </span>
          </div>
          
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              asChild
              className="h-8 w-8"
            >
              <Link to={`/task/${task.id}`}>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onEdit(task.id)}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onDelete(task.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            
            <Button 
              variant={isCompleted ? "outline" : "default"}
              size="icon" 
              onClick={() => onComplete(task.id)}
              className="h-8 w-8"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}