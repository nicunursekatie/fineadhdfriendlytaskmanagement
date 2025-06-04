import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fine } from "@/lib/fine";
import { Header } from "@/components/layout/header";
import { TaskCard } from "@/components/task-card";
import { TaskForm } from "@/components/task-form";
import { BrainDumpEditor } from "@/components/brain-dump-editor";
import { AchievementNotification } from "@/components/ui/achievement-notification";
import { EnergySelector } from "@/components/ui/energy-selector";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Brain, Filter, ListFilter, Plus, Sparkles, Zap } from "lucide-react";
import type { Schema } from "@/lib/db-types";

// Default user ID for single-user app
const DEFAULT_USER_ID = "single-user";

const Dashboard = () => {
  const [tasks, setTasks] = useState<(Schema["tasks"] & { id: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<(Schema["tasks"] & { id: number }) | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);
  const [currentEnergyLevel, setCurrentEnergyLevel] = useState(3);
  const [activeContext, setActiveContext] = useState<string | null>(null);
  const [activePriority, setActivePriority] = useState<string | null>(null);
  const [achievement, setAchievement] = useState<{ title: string; description: string } | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const fetchedTasks = await fine.table("tasks")
        .select("*")
        .eq("userId", DEFAULT_USER_ID)
        .order("createdAt", { ascending: false });
      
      setTasks(fetchedTasks as any);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const newTask = {
        ...formData,
        status: "active",
        createdAt: new Date().toISOString(),
        userId: DEFAULT_USER_ID,
        dueDate: formData.dueDate ? formData.dueDate.toISOString() : null,
      };

      const createdTasks = await fine.table("tasks").insert(newTask).select();
      
      setTasks([createdTasks[0] as any, ...tasks]);
      setIsTaskDialogOpen(false);
      
      toast({
        title: "Task created",
        description: "Your task has been created successfully.",
      });
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTask = async (formData: any) => {
    if (!editingTask) return;
    
    setIsSubmitting(true);
    try {
      const updatedTask = {
        ...formData,
        dueDate: formData.dueDate ? formData.dueDate.toISOString() : null,
      };

      const updatedTasks = await fine.table("tasks")
        .update(updatedTask)
        .eq("id", editingTask.id)
        .select();
      
      setTasks(tasks.map(task => 
        task.id === editingTask.id ? { ...updatedTasks[0] as any } : task
      ));
      
      setEditingTask(null);
      setIsTaskDialogOpen(false);
      
      toast({
        title: "Task updated",
        description: "Your task has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;
    
    try {
      await fine.table("tasks").delete().eq("id", deleteTaskId);
      
      setTasks(tasks.filter(task => task.id !== deleteTaskId));
      setDeleteTaskId(null);
      
      toast({
        title: "Task deleted",
        description: "Your task has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newStatus = task.status === "completed" ? "active" : "completed";
    
    try {
      const updatedTasks = await fine.table("tasks")
        .update({ 
          status: newStatus,
          completedAt: newStatus === "completed" ? new Date().toISOString() : null
        })
        .eq("id", taskId)
        .select();
      
      setTasks(tasks.map(t => 
        t.id === taskId ? { ...updatedTasks[0] as any } : t
      ));
      
      if (newStatus === "completed") {
        // Show achievement notification
        setAchievement({
          title: "Task Completed!",
          description: `You've completed "${task.title}". Great job!`,
        });
        
        // Create achievement record
        try {
          await fine.table("achievements").insert({
            title: "Task Completed",
            description: `Completed task: ${task.title}`,
            createdAt: new Date().toISOString(),
            userId: DEFAULT_USER_ID,
          });
          
          // Update streak
          const streaks = await fine.table("streaks")
            .select("*")
            .eq("userId", DEFAULT_USER_ID);
          
          const now = new Date().toISOString();
          
          if (streaks.length === 0) {
            // Create new streak
            await fine.table("streaks").insert({
              count: 1,
              lastCompletedAt: now,
              userId: DEFAULT_USER_ID,
            });
          } else {
            // Update existing streak
            const streak = streaks[0] as any;
            const lastDate = new Date(streak.lastCompletedAt);
            const today = new Date();
            
            // Check if the last completion was yesterday or earlier today
            const isConsecutive = 
              (today.getDate() === lastDate.getDate() && 
               today.getMonth() === lastDate.getMonth() && 
               today.getFullYear() === lastDate.getFullYear()) || 
              (today.getDate() - lastDate.getDate() === 1);
            
            if (isConsecutive) {
              await fine.table("streaks")
                .update({ 
                  count: streak.count + 1,
                  lastCompletedAt: now,
                })
                .eq("id", streak.id);
            } else {
              // Reset streak
              await fine.table("streaks")
                .update({ 
                  count: 1,
                  lastCompletedAt: now,
                })
                .eq("id", streak.id);
            }
          }
        } catch (error) {
          console.error("Error updating achievements/streaks:", error);
        }
      }
    } catch (error) {
      console.error("Error completing task:", error);
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveBrainDump = async (content: string) => {
    try {
      await fine.table("brainDumps").insert({
        content,
        createdAt: new Date().toISOString(),
        userId: DEFAULT_USER_ID,
      });
      
      toast({
        title: "Saved",
        description: "Your brain dump has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving brain dump:", error);
      toast({
        title: "Error",
        description: "Failed to save brain dump. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    let matches = true;
    
    // Filter by context
    if (activeContext) {
      matches = matches && task.context === activeContext;
    }
    
    // Filter by priority
    if (activePriority) {
      matches = matches && task.priority === activePriority;
    }
    
    return matches;
  });

  // Get tasks that match current energy level
  const energyMatchedTasks = filteredTasks.filter(
    task => task.status !== "completed" && task.energyLevel === currentEnergyLevel
  );

  // Get urgent tasks
  const urgentTasks = filteredTasks.filter(
    task => task.status !== "completed" && task.priority === "urgent"
  );

  // Get quick win tasks
  const quickWinTasks = filteredTasks.filter(
    task => task.status !== "completed" && task.priority === "quick-win"
  );

  // Get completed tasks
  const completedTasks = filteredTasks.filter(task => task.status === "completed");

  // Calculate completion stats
  const totalTasks = filteredTasks.length;
  const completedCount = completedTasks.length;
  const completionRate = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  // Get unique contexts for filter
  const contexts = Array.from(new Set(tasks.map(task => task.context)));
  
  // Get unique priorities for filter
  const priorities = Array.from(new Set(tasks.map(task => task.priority)));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Energy Level */}
          <div className="col-span-1 p-6 border rounded-lg bg-card">
            <h2 className="text-lg font-medium mb-4">Current Energy Level</h2>
            <EnergySelector 
              value={currentEnergyLevel} 
              onChange={setCurrentEnergyLevel} 
              className="mb-2"
            />
            <p className="text-sm text-muted-foreground">
              Set your current energy level to get matching task suggestions
            </p>
          </div>
          
          {/* Task Completion Progress */}
          <div className="col-span-1 p-6 border rounded-lg bg-card">
            <h2 className="text-lg font-medium mb-4">Task Progress</h2>
            <ProgressBar 
              value={completedCount} 
              max={totalTasks} 
              variant={completionRate > 75 ? "success" : completionRate > 25 ? "warning" : "default"}
            />
            <p className="text-sm text-muted-foreground mt-2">
              {completedCount} of {totalTasks} tasks completed
            </p>
          </div>
          
          {/* Quick Actions */}
          <div className="col-span-1 p-6 border rounded-lg bg-card">
            <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => {
                  setEditingTask(null);
                  setIsTaskDialogOpen(true);
                }}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                New Task
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/brain-dump")}
                className="gap-1"
              >
                <Sparkles className="h-4 w-4" />
                Brain Dump
              </Button>
            </div>
          </div>
        </div>
        
        {/* Brain Dump Quick Entry */}
        <div className="mb-8">
          <BrainDumpEditor 
            onSave={handleSaveBrainDump} 
            isSubmitting={isSubmitting} 
          />
        </div>
        
        {/* Task Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <ListFilter className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Filters:</span>
          </div>
          
          <Select
            value={activeContext || ""}
            onValueChange={(value) => setActiveContext(value || null)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Context" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Contexts</SelectItem>
              {contexts.map(context => (
                <SelectItem key={context} value={context}>
                  {context.charAt(0).toUpperCase() + context.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={activePriority || ""}
            onValueChange={(value) => setActivePriority(value || null)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Priorities</SelectItem>
              {priorities.map(priority => (
                <SelectItem key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {(activeContext || activePriority) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setActiveContext(null);
                setActivePriority(null);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
        
        {/* Tasks Tabs */}
        <Tabs defaultValue="suggested" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="suggested" className="gap-1">
              <Zap className="h-4 w-4" />
              Suggested
            </TabsTrigger>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="suggested" className="space-y-6">
            {/* Energy Matched Tasks */}
            {energyMatchedTasks.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Filter className="h-5 w-5 text-primary" />
                  Energy Matched Tasks
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {energyMatchedTasks.slice(0, 3).map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={handleCompleteTask}
                      onEdit={(id) => {
                        setEditingTask(tasks.find(t => t.id === id) || null);
                        setIsTaskDialogOpen(true);
                      }}
                      onDelete={(id) => setDeleteTaskId(id)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Urgent Tasks */}
            {urgentTasks.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Filter className="h-5 w-5 text-destructive" />
                  Urgent Tasks
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {urgentTasks.slice(0, 3).map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={handleCompleteTask}
                      onEdit={(id) => {
                        setEditingTask(tasks.find(t => t.id === id) || null);
                        setIsTaskDialogOpen(true);
                      }}
                      onDelete={(id) => setDeleteTaskId(id)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Quick Win Tasks */}
            {quickWinTasks.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Filter className="h-5 w-5 text-emerald-500" />
                  Quick Wins
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quickWinTasks.slice(0, 3).map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={handleCompleteTask}
                      onEdit={(id) => {
                        setEditingTask(tasks.find(t => t.id === id) || null);
                        setIsTaskDialogOpen(true);
                      }}
                      onDelete={(id) => setDeleteTaskId(id)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {energyMatchedTasks.length === 0 && urgentTasks.length === 0 && quickWinTasks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No suggested tasks found. Try adjusting your energy level or adding new tasks.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="all">
            {filteredTasks.filter(task => task.status !== "completed").length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTasks
                  .filter(task => task.status !== "completed")
                  .map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={handleCompleteTask}
                      onEdit={(id) => {
                        setEditingTask(tasks.find(t => t.id === id) || null);
                        setIsTaskDialogOpen(true);
                      }}
                      onDelete={(id) => setDeleteTaskId(id)}
                    />
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No active tasks found. Create a new task to get started!</p>
                <Button 
                  onClick={() => {
                    setEditingTask(null);
                    setIsTaskDialogOpen(true);
                  }}
                  className="mt-4"
                >
                  Create Task
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed">
            {completedTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleCompleteTask}
                    onEdit={(id) => {
                      setEditingTask(tasks.find(t => t.id === id) || null);
                      setIsTaskDialogOpen(true);
                    }}
                    onDelete={(id) => setDeleteTaskId(id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No completed tasks yet. Complete a task to see it here!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Task Edit/Create Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
          </DialogHeader>
          <TaskForm 
            initialData={editingTask || undefined}
            onSubmit={editingTask ? handleUpdateTask : handleCreateTask} 
            isSubmitting={isSubmitting} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={(open) => !open && setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Achievement Notification */}
      {achievement && (
        <AchievementNotification
          title={achievement.title}
          description={achievement.description}
          onClose={() => setAchievement(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;