export type Schema = {
  tasks: {
    id?: number;
    title: string;
    description?: string | null;
    priority: string;
    energyLevel: number;
    emotionalImportance: number;
    estimatedTime?: number | null;
    actualTime?: number | null;
    context: string;
    status: string;
    dueDate?: string | null;
    createdAt: string;
    completedAt?: string | null;
    userId: string;
  };
  
  taskBreakdowns: {
    id?: number;
    taskId: number;
    stepTitle: string;
    stepDescription?: string | null;
    isCompleted: boolean;
  };
  
  brainDumps: {
    id?: number;
    content: string;
    createdAt: string;
    userId: string;
  };
  
  achievements: {
    id?: number;
    title: string;
    description: string;
    createdAt: string;
    userId: string;
  };
  
  streaks: {
    id?: number;
    count: number;
    lastCompletedAt: string;
    userId: string;
  };
}