import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Plus, Brain, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TaskForm } from "@/components/task-form";

// Default user ID for single-user app
const DEFAULT_USER_ID = "single-user";

export function Header() {
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

      await fine.table("tasks").insert(newTask).select();
      
      setIsTaskDialogOpen(false);
      window.location.reload(); // Simple refresh to show new task
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const menuItems = [
    { label: "Dashboard", icon: Brain, href: "/" },
    { label: "Brain Dump", icon: Brain, href: "/brain-dump" },
    { label: "Achievements", icon: Award, href: "/achievements" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Focus Flow</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        {!isMobile && (
          <nav className="hidden md:flex items-center gap-6">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                <span>New Task</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <h2 className="text-lg font-semibold mb-4">Create New Task</h2>
              <TaskForm 
                onSubmit={handleCreateTask} 
                isSubmitting={isSubmitting} 
              />
            </DialogContent>
          </Dialog>

          {/* Mobile Menu */}
          {isMobile && (
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[250px] sm:w-[300px]">
                <div className="flex flex-col gap-6 py-6">
                  <div className="flex items-center justify-between">
                    <Link 
                      to="/" 
                      className="flex items-center gap-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Brain className="h-6 w-6 text-primary" />
                      <span className="text-xl font-bold">Focus Flow</span>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <nav className="flex flex-col gap-4">
                    {menuItems.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        className="flex items-center gap-2 px-2 py-1 text-sm font-medium transition-colors hover:text-primary"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
}