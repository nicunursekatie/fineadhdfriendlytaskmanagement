import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fine } from "@/lib/fine";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Award, Calendar, CheckCircle, Flame, Loader2, Medal, Star, Trophy } from "lucide-react";
import { format } from "date-fns";
import { ProtectedRoute } from "@/components/auth/route-components";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { Schema } from "@/lib/db-types";

const AchievementsPage = () => {
  const [achievements, setAchievements] = useState<(Schema["achievements"] & { id: number })[]>([]);
  const [streak, setStreak] = useState<(Schema["streaks"] & { id: number }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [totalTasksCount, setTotalTasksCount] = useState(0);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: session } = fine.auth.useSession();

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch achievements
      const fetchedAchievements = await fine.table("achievements")
        .select("*")
        .eq("userId", session!.user.id)
        .order("createdAt", { ascending: false });
      
      setAchievements(fetchedAchievements as any);
      
      // Fetch streak
      const streaks = await fine.table("streaks")
        .select("*")
        .eq("userId", session!.user.id);
      
      if (streaks.length > 0) {
        setStreak(streaks[0] as any);
      }
      
      // Fetch task counts
      const tasks = await fine.table("tasks")
        .select("*")
        .eq("userId", session!.user.id);
      
      const total = tasks.length;
      const completed = tasks.filter((task: any) => task.status === "completed").length;
      
      setTotalTasksCount(total);
      setCompletedTasksCount(completed);
    } catch (error) {
      console.error("Error fetching achievements data:", error);
      toast({
        title: "Error",
        description: "Failed to load achievements. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Group achievements by date
  const groupedAchievements = achievements.reduce((groups: Record<string, any[]>, achievement) => {
    const date = format(new Date(achievement.createdAt), "yyyy-MM-dd");
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(achievement);
    return groups;
  }, {});

  // Calculate streak status
  const isStreakActive = streak ? (
    new Date().getTime() - new Date(streak.lastCompletedAt).getTime() < 24 * 60 * 60 * 1000
  ) : false;

  // Generate achievement stats
  const stats = [
    {
      title: "Tasks Completed",
      value: completedTasksCount,
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      title: "Completion Rate",
      value: totalTasksCount > 0 ? `${Math.round((completedTasksCount / totalTasksCount) * 100)}%` : "0%",
      icon: Star,
      color: "text-yellow-500",
    },
    {
      title: "Current Streak",
      value: streak?.count || 0,
      icon: Flame,
      color: isStreakActive ? "text-orange-500" : "text-muted-foreground",
    },
    {
      title: "Total Achievements",
      value: achievements.length,
      icon: Trophy,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Achievements</h1>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Dashboard
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className={`rounded-full p-3 bg-muted ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Streak Card */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className={isStreakActive ? "text-orange-500" : "text-muted-foreground"} />
                  Task Completion Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold">{streak?.count || 0} {streak?.count === 1 ? "day" : "days"}</p>
                      <p className="text-sm text-muted-foreground">
                        {isStreakActive 
                          ? "Your streak is active! Complete a task today to keep it going." 
                          : "Your streak is inactive. Complete a task today to restart it!"}
                      </p>
                    </div>
                    <div className={`rounded-full p-4 ${isStreakActive ? "bg-orange-100 dark:bg-orange-900" : "bg-muted"}`}>
                      <Flame className={`h-8 w-8 ${isStreakActive ? "text-orange-500" : "text-muted-foreground"}`} />
                    </div>
                  </div>
                  
                  {/* Milestone progress */}
                  {streak && streak.count > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Next milestone: {streak.count < 7 ? "7 days" : streak.count < 30 ? "30 days" : "100 days"}</span>
                        <span>
                          {streak.count < 7 
                            ? `${streak.count}/7` 
                            : streak.count < 30 
                              ? `${streak.count}/30` 
                              : `${streak.count}/100`}
                        </span>
                      </div>
                      <ProgressBar 
                        value={streak.count} 
                        max={streak.count < 7 ? 7 : streak.count < 30 ? 30 : 100} 
                        variant="warning"
                        showLabel={false}
                      />
                    </div>
                  )}
                  
                  {streak && (
                    <p className="text-xs text-muted-foreground">
                      Last completed: {format(new Date(streak.lastCompletedAt), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Achievement Timeline */}
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Medal className="h-5 w-5 text-primary" />
              Achievement Timeline
            </h2>
            
            {Object.keys(groupedAchievements).length > 0 ? (
              <div className="space-y-8">
                {Object.entries(groupedAchievements).map(([date, dayAchievements]) => (
                  <div key={date} className="relative">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-primary text-primary-foreground rounded-full p-2">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-medium">
                        {format(new Date(date), "MMMM d, yyyy")}
                      </h3>
                    </div>
                    
                    <div className="ml-6 pl-6 border-l space-y-4">
                      {dayAchievements.map((achievement) => (
                        <Card key={achievement.id} className="bg-card/50">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Award className="h-5 w-5 text-primary mt-1" />
                              <div>
                                <p className="font-medium">{achievement.title}</p>
                                <p className="text-sm text-muted-foreground">{achievement.description}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(achievement.createdAt), "h:mm a")}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No achievements yet. Complete tasks to earn achievements!</p>
                <Button 
                  onClick={() => navigate("/")}
                  className="mt-4"
                >
                  Go to Tasks
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default function AchievementsPageWrapper() {
  return <ProtectedRoute Component={AchievementsPage} />;
}