import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fine } from "@/lib/fine";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { EnergySelector } from "@/components/ui/energy-selector";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CheckCircle, Clock, Edit, Loader2, Plus, Trash2 } from "lucide-react";
import type { Schema } from "@/lib/db-types";

// Default user ID for single-user app
const DEFAULT_USER_ID = "single-user";

const TaskDetailPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const [task, setTask] = useState<(Schema["tasks"] & { id: number }) | null>(null);
  const [steps, setSteps] = useState<(Schema["taskBreakdowns"] & { id: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [newStep, setNewStep] = useState({ stepTitle: "", stepDescription: "" });
  const [editingStepId, setEditingStepId] = useState<number | null>(null);
  const [deleteStepId, setDeleteStepId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (taskId) {
      fetchTaskData();
    }
  }, [taskId]);

  const fetchTaskData = async () => {
    setIsLoading(true);
    try {
      // Fetch task
      const tasks = await fine.table("tasks")
        .select("*")
        .eq("id", Number(taskId))
        .eq("userId", DEFAULT_USER_ID);
      
      if (tasks.length === 0) {
        toast({
          title: "Task not found",
          description: "The requested task could not be found.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
      
      setTask(tasks[0] as any);
      
      // Fetch task breakdown steps
      const fetchedSteps = await fine.table("taskBreakdowns")
        .select("*")
        .eq("taskId", Number(taskId));
      
      setSteps(fetchedSteps as any);
    } catch (error) {
      console.error("Error fetching task data:", error);
      toast({
        title: "Error",
        description: "Failed to load task details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStep = async () => {
    if (!newStep.stepTitle.trim()) {
      toast({
        title: "Error",
        description: "Step title is required.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const stepData = {
        taskId: Number(taskId),
        stepTitle: newStep.stepTitle,
        stepDescription: newStep.stepDescription || null,
        isCompleted: false,
      };

      const createdSteps = await fine.table("taskBreakdowns").insert(stepData).select();
      
      setSteps([...steps, createdSteps[0] as any]);
      setNewStep({ stepTitle: "", stepDescription: "" });
      setIsAddingStep(false);
      
      toast({
        title: "Step added",
        description: "Task step has been added successfully.",
      });
    } catch (error) {
      console.error("Error adding step:", error);
      toast({
        title: "Error",
        description: "Failed to add step. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStep = async () => {
    if (!editingStepId) return;
    
    const step = steps.find(s => s.id === editingStepId);
    if (!step) return;
    
    if (!step.stepTitle.trim()) {
      toast({
        title: "Error",
        description: "Step title is required.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const stepData = {
        stepTitle: step.stepTitle,
        stepDescription: step.stepDescription || null,
      };

      const updatedSteps = await fine.table("taskBreakdowns")
        .update(stepData)
        .eq("id", editingStepId)
        .select();
      
      setSteps(steps.map(s => 
        s.id === editingStepId ? { ...updatedSteps[0] as any } : s
      ));
      
      setEditingStepId(null);
      
      toast({
        title: "Step updated",
        description: "Task step has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating step:", error);
      toast({
        title: "Error",
        description: "Failed to update step. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStep = async () => {
    if (!deleteStepId) return;
    
    try {
      await fine.table("taskBreakdowns").delete().eq("id", deleteStepId);
      
      setSteps(steps.filter(step => step.id !== deleteStepId));
      setDeleteStepId(null);
      
      toast({
        title: "Step deleted",
        description: "Task step has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting step:", error);
      toast({
        title: "Error",
        description: "Failed to delete step. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStepCompletion = async (stepId: number) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    
    try {
      const updatedSteps = await fine.table("taskBreakdowns")
        .update({ isCompleted: !step.isCompleted })
        .eq("id", stepId)
        .select();
      
      setSteps(steps.map(s => 
        s.id === stepId ? { ...updatedSteps[0] as any } : s
      ));
      
      // Check if all steps are completed
      const allCompleted = steps
        .filter(s => s.id !== stepId)
        .every(s => s.isCompleted) && !step.isCompleted;
      
      if (allCompleted && task?.status !== "completed") {
        toast({
          title: "All steps completed!",
          description: "Would you like to mark the entire task as complete?",
          action: (
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => handleCompleteTask()}
            >
              Complete Task
            </Button>
          ),
        });
      }
    } catch (error) {
      console.error("Error toggling step completion:", error);
      toast({
        title: "Error",
        description: "Failed to update step. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteTask = async () => {
    if (!task) return;
    
    try {
      const newStatus = task.status === "completed" ? "active" : "completed";
      
      const updatedTasks = await fine.table("tasks")
        .update({ 
          status: newStatus,
          completedAt: newStatus === "completed" ? new Date().toISOString() : null
        })
        .eq("id", task.id)
        .select();
      
      setTask({ ...updatedTasks[0] as any });
      
      toast({
        title: newStatus === "completed" ? "Task completed!" : "Task reopened",
        description: newStatus === "completed" 
          ? "Congratulations on completing this task!" 
          : "The task has been marked as active again.",
      });
    } catch (error) {
      console.error("Error completing task:", error);
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Task not found.</p>
            <Button 
              onClick={() => navigate("/")}
              className="mt-4"
            >
              Back to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const isCompleted = task.status === "completed";
  const completedSteps = steps.filter(step => step.isCompleted).length;
  const totalSteps = steps.length;
  const completionPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to Dashboard
            </Button>
          </div>
          <Button 
            variant={isCompleted ? "outline" : "default"}
            onClick={handleCompleteTask}
            className="gap-1"
          >
            <CheckCircle className="h-4 w-4" />
            {isCompleted ? "Mark as Active" : "Complete Task"}
          </Button>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <PriorityBadge priority={task.priority as any} />
                <span className="text-sm bg-secondary text-secondary-foreground px-2 py-1 rounded">
                  {task.context}
                </span>
              </div>
              <CardTitle className={isCompleted ? "line-through text-muted-foreground" : ""}>
                {task.title}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {task.description && (
              <p className={`text-muted-foreground ${isCompleted ? "line-through" : ""}`}>
                {task.description}
              </p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Energy Required:</span>
                  <EnergySelector 
                    value={task.energyLevel} 
                    onChange={() => {}} // Read-only in detail view
                    className="pointer-events-none"
                  />
                </div>
                
                <div>
                  <span className="text-sm font-medium">Emotional Importance:</span>
                  <span className="ml-2">{task.emotionalImportance}/100</span>
                </div>
                
                {task.estimatedTime && (
                  <div>
                    <span className="text-sm font-medium">Estimated Time:</span>
                    <span className="ml-2">{task.estimatedTime} minutes</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                {task.dueDate && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Due: {format(new Date(task.dueDate), "MMMM d, yyyy")}
                    </span>
                  </div>
                )}
                
                <div>
                  <span className="text-sm font-medium">Created:</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {format(new Date(task.createdAt), "MMMM d, yyyy")}
                  </span>
                </div>
                
                {task.completedAt && (
                  <div>
                    <span className="text-sm font-medium">Completed:</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {format(new Date(task.completedAt), "MMMM d, yyyy")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Task Breakdown
          </h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsAddingStep(true)}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Step
          </Button>
        </div>
        
        {totalSteps > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-1">
              <span>{completedSteps} of {totalSteps} steps completed</span>
              <span>{Math.round(completionPercentage)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {steps.length > 0 ? (
          <div className="space-y-4">
            {steps.map((step, index) => (
              <Card key={step.id} className={step.isCompleted ? "bg-muted/50" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      id={`step-${step.id}`}
                      checked={step.isCompleted}
                      onCheckedChange={() => handleToggleStepCompletion(step.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor={`step-${step.id}`}
                        className={`font-medium ${step.isCompleted ? "line-through text-muted-foreground" : ""}`}
                      >
                        {index + 1}. {step.stepTitle}
                      </Label>
                      {step.stepDescription && (
                        <p className={`text-sm mt-1 ${step.isCompleted ? "line-through text-muted-foreground" : "text-muted-foreground"}`}>
                          {step.stepDescription}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          const stepToEdit = steps.find(s => s.id === step.id);
                          if (stepToEdit) {
                            setEditingStepId(step.id);
                          }
                        }}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setDeleteStepId(step.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">No steps added yet. Break down your task into manageable steps.</p>
            <Button 
              onClick={() => setIsAddingStep(true)}
              className="mt-4"
            >
              Add First Step
            </Button>
          </div>
        )}
      </main>
      
      {/* Add Step Dialog */}
      <Dialog open={isAddingStep} onOpenChange={setIsAddingStep}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Task Step</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stepTitle">Step Title</Label>
              <Input
                id="stepTitle"
                value={newStep.stepTitle}
                onChange={(e) => setNewStep({ ...newStep, stepTitle: e.target.value })}
                placeholder="What needs to be done?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stepDescription">Description (Optional)</Label>
              <Textarea
                id="stepDescription"
                value={newStep.stepDescription}
                onChange={(e) => setNewStep({ ...newStep, stepDescription: e.target.value })}
                placeholder="Add any details about this step..."
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddingStep(false);
                  setNewStep({ stepTitle: "", stepDescription: "" });
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddStep}
                disabled={isSubmitting || !newStep.stepTitle.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : "Add Step"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Step Dialog */}
      <Dialog open={!!editingStepId} onOpenChange={(open) => !open && setEditingStepId(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Task Step</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editingStepId && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="editStepTitle">Step Title</Label>
                  <Input
                    id="editStepTitle"
                    value={steps.find(s => s.id === editingStepId)?.stepTitle || ""}
                    onChange={(e) => {
                      setSteps(steps.map(s => 
                        s.id === editingStepId ? { ...s, stepTitle: e.target.value } : s
                      ));
                    }}
                    placeholder="What needs to be done?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editStepDescription">Description (Optional)</Label>
                  <Textarea
                    id="editStepDescription"
                    value={steps.find(s => s.id === editingStepId)?.stepDescription || ""}
                    onChange={(e) => {
                      setSteps(steps.map(s => 
                        s.id === editingStepId ? { ...s, stepDescription: e.target.value } : s
                      ));
                    }}
                    placeholder="Add any details about this step..."
                    className="resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingStepId(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdateStep}
                    disabled={isSubmitting || !(steps.find(s => s.id === editingStepId)?.stepTitle || "").trim()}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : "Save Changes"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Step Confirmation Dialog */}
      <AlertDialog open={!!deleteStepId} onOpenChange={(open) => !open && setDeleteStepId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this task step.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStep}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TaskDetailPage;