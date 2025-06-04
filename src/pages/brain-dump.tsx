import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fine } from "@/lib/fine";
import { Header } from "@/components/layout/header";
import { BrainDumpEditor } from "@/components/brain-dump-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Brain, Edit, Loader2, Sparkles, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { Schema } from "@/lib/db-types";

// Default user ID for single-user app
const DEFAULT_USER_ID = "single-user";

const BrainDumpPage = () => {
  const [brainDumps, setBrainDumps] = useState<(Schema["brainDumps"] & { id: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDump, setEditingDump] = useState<(Schema["brainDumps"] & { id: number }) | null>(null);
  const [deleteDumpId, setDeleteDumpId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBrainDumps();
  }, []);

  const fetchBrainDumps = async () => {
    setIsLoading(true);
    try {
      const fetchedDumps = await fine.table("brainDumps")
        .select("*")
        .eq("userId", DEFAULT_USER_ID)
        .order("createdAt", { ascending: false });
      
      setBrainDumps(fetchedDumps as any);
    } catch (error) {
      console.error("Error fetching brain dumps:", error);
      toast({
        title: "Error",
        description: "Failed to load brain dumps. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBrainDump = async (content: string) => {
    setIsSubmitting(true);
    try {
      const newDump = {
        content,
        createdAt: new Date().toISOString(),
        userId: DEFAULT_USER_ID,
      };

      const createdDumps = await fine.table("brainDumps").insert(newDump).select();
      
      setBrainDumps([createdDumps[0] as any, ...brainDumps]);
      
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBrainDump = async (content: string) => {
    if (!editingDump) return;
    
    setIsSubmitting(true);
    try {
      const updatedDump = {
        content,
        // Keep the original creation date
      };

      const updatedDumps = await fine.table("brainDumps")
        .update(updatedDump)
        .eq("id", editingDump.id)
        .select();
      
      setBrainDumps(brainDumps.map(dump => 
        dump.id === editingDump.id ? { ...updatedDumps[0] as any } : dump
      ));
      
      setEditingDump(null);
      
      toast({
        title: "Updated",
        description: "Your brain dump has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating brain dump:", error);
      toast({
        title: "Error",
        description: "Failed to update brain dump. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBrainDump = async () => {
    if (!deleteDumpId) return;
    
    try {
      await fine.table("brainDumps").delete().eq("id", deleteDumpId);
      
      setBrainDumps(brainDumps.filter(dump => dump.id !== deleteDumpId));
      setDeleteDumpId(null);
      
      toast({
        title: "Deleted",
        description: "Your brain dump has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting brain dump:", error);
      toast({
        title: "Error",
        description: "Failed to delete brain dump. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Brain Dump</h1>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Dashboard
          </Button>
        </div>
        
        <div className="mb-8">
          <BrainDumpEditor 
            onSave={handleSaveBrainDump} 
            isSubmitting={isSubmitting} 
          />
        </div>
        
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Your Brain Dumps
        </h2>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : brainDumps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brainDumps.map(dump => (
              <Card key={dump.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(dump.createdAt), "MMM d, yyyy • h:mm a")}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="whitespace-pre-wrap break-words">
                    {dump.content.length > 200 
                      ? `${dump.content.substring(0, 200)}...` 
                      : dump.content}
                  </p>
                </CardContent>
                <CardFooter className="pt-2">
                  <div className="flex justify-end gap-2 w-full">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setEditingDump(dump)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteDumpId(dump.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No brain dumps yet. Create one using the editor above!</p>
          </div>
        )}
      </main>
      
      {/* Edit Brain Dump Dialog */}
      <Dialog open={!!editingDump} onOpenChange={(open) => !open && setEditingDump(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Brain Dump</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea 
              value={editingDump?.content || ""}
              onChange={(e) => setEditingDump(prev => prev ? { ...prev, content: e.target.value } : null)}
              className="min-h-[200px] resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setEditingDump(null)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleUpdateBrainDump(editingDump!.content)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDumpId} onOpenChange={(open) => !open && setDeleteDumpId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your brain dump.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBrainDump}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BrainDumpPage;