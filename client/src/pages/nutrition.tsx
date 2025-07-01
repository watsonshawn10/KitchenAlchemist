import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Target, TrendingUp, Heart, Activity, Settings, Calendar } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface HealthGoals {
  id: number;
  dailyCalories: number;
  dailyProtein: string;
  dailyCarbs: string;
  dailyFat: string;
  dailyFiber: string;
  maxSodium: string;
  healthConditions: string[];
  activityLevel: string;
  weightGoal: string;
}

interface NutritionLog {
  id: number;
  date: string;
  mealType: string;
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sodium: string;
  servings: string;
}

const activityLevels = [
  "sedentary", "light", "moderate", "active", "very-active"
];

const weightGoals = [
  "maintain", "lose", "gain"
];

const healthConditions = [
  "diabetes", "hypertension", "heart-disease", "high-cholesterol", 
  "celiac", "food-allergies", "kidney-disease", "none"
];

const mealTypes = ["breakfast", "lunch", "dinner", "snack"];

export default function Nutrition() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGoalsDialogOpen, setIsGoalsDialogOpen] = useState(false);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [newGoals, setNewGoals] = useState({
    dailyCalories: 2000,
    dailyProtein: "150",
    dailyCarbs: "250",
    dailyFat: "65",
    dailyFiber: "25",
    maxSodium: "2300",
    healthConditions: [] as string[],
    activityLevel: "moderate",
    weightGoal: "maintain",
  });

  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split('T')[0],
    mealType: "breakfast",
    calories: 0,
    protein: "0",
    carbs: "0",
    fat: "0",
    fiber: "0",
    sodium: "0",
    servings: "1",
  });

  const { data: healthGoals } = useQuery({
    queryKey: ["/api/health-goals"],
    enabled: !!user,
  });

  const { data: nutritionLogs } = useQuery({
    queryKey: ["/api/nutrition-logs", selectedDate],
    enabled: !!user,
  });

  const { data: dailyProgress } = useQuery({
    queryKey: ["/api/nutrition-progress", selectedDate],
    enabled: !!user,
  });

  const updateGoals = useMutation({
    mutationFn: async (goals: typeof newGoals) => {
      return apiRequest("POST", "/api/health-goals", goals);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-goals"] });
      setIsGoalsDialogOpen(false);
      toast({
        title: "Goals Updated",
        description: "Your health goals have been updated.",
      });
    },
  });

  const addNutritionLog = useMutation({
    mutationFn: async (log: typeof newLog) => {
      return apiRequest("POST", "/api/nutrition-logs", log);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition-progress"] });
      setIsLogDialogOpen(false);
      setNewLog({
        date: new Date().toISOString().split('T')[0],
        mealType: "breakfast",
        calories: 0,
        protein: "0",
        carbs: "0",
        fat: "0",
        fiber: "0",
        sodium: "0",
        servings: "1",
      });
      toast({
        title: "Meal Logged",
        description: "Your nutrition has been logged.",
      });
    },
  });

  const handleUpdateGoals = (e: React.FormEvent) => {
    e.preventDefault();
    updateGoals.mutate(newGoals);
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    addNutritionLog.mutate(newLog);
  };

  const handleConditionToggle = (condition: string) => {
    setNewGoals(prev => ({
      ...prev,
      healthConditions: prev.healthConditions.includes(condition)
        ? prev.healthConditions.filter(c => c !== condition)
        : [...prev.healthConditions, condition]
    }));
  };

  // Mock progress data when API data isn't available
  const progress = dailyProgress || {
    calories: { consumed: 1650, target: newGoals.dailyCalories },
    protein: { consumed: 125, target: parseFloat(newGoals.dailyProtein) },
    carbs: { consumed: 180, target: parseFloat(newGoals.dailyCarbs) },
    fat: { consumed: 58, target: parseFloat(newGoals.dailyFat) },
    fiber: { consumed: 22, target: parseFloat(newGoals.dailyFiber) },
    sodium: { consumed: 1850, target: parseFloat(newGoals.maxSodium) },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-xl font-bold text-primary hover:text-primary/80">
                ChefAI
              </Link>
              <nav className="flex space-x-6">
                <Link href="/" className="text-gray-600 hover:text-gray-900">
                  Home
                </Link>
                <Link href="/collections" className="text-gray-600 hover:text-gray-900">
                  Collections
                </Link>
                <Link href="/shopping-lists" className="text-gray-600 hover:text-gray-900">
                  Shopping Lists
                </Link>
                <Link href="/pantry" className="text-gray-600 hover:text-gray-900">
                  Pantry
                </Link>
                <Link href="/equipment" className="text-gray-600 hover:text-gray-900">
                  Equipment
                </Link>
                <Link href="/nutrition" className="text-primary font-medium">
                  Nutrition
                </Link>
                <Link href="/analytics" className="text-gray-600 hover:text-gray-900">
                  Analytics
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Health & Nutrition</h1>
            <p className="text-gray-600 mt-2">
              Track your nutrition goals and monitor your health progress
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Dialog open={isGoalsDialogOpen} onOpenChange={setIsGoalsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Target className="h-4 w-4 mr-2" />
                  Set Goals
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Health Goals</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateGoals} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Daily Calories</label>
                      <Input
                        type="number"
                        value={newGoals.dailyCalories}
                        onChange={(e) => setNewGoals({ ...newGoals, dailyCalories: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Protein (g)</label>
                      <Input
                        value={newGoals.dailyProtein}
                        onChange={(e) => setNewGoals({ ...newGoals, dailyProtein: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Carbs (g)</label>
                      <Input
                        value={newGoals.dailyCarbs}
                        onChange={(e) => setNewGoals({ ...newGoals, dailyCarbs: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Fat (g)</label>
                      <Input
                        value={newGoals.dailyFat}
                        onChange={(e) => setNewGoals({ ...newGoals, dailyFat: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Fiber (g)</label>
                      <Input
                        value={newGoals.dailyFiber}
                        onChange={(e) => setNewGoals({ ...newGoals, dailyFiber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Activity Level</label>
                      <Select 
                        value={newGoals.activityLevel} 
                        onValueChange={(value) => setNewGoals({ ...newGoals, activityLevel: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {activityLevels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level.charAt(0).toUpperCase() + level.slice(1).replace('-', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Weight Goal</label>
                      <Select 
                        value={newGoals.weightGoal} 
                        onValueChange={(value) => setNewGoals({ ...newGoals, weightGoal: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {weightGoals.map((goal) => (
                            <SelectItem key={goal} value={goal}>
                              {goal.charAt(0).toUpperCase() + goal.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button type="submit" disabled={updateGoals.isPending}>
                      {updateGoals.isPending ? "Updating..." : "Update Goals"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsGoalsDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Log Meal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log Nutrition</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddLog} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Date</label>
                      <Input
                        type="date"
                        value={newLog.date}
                        onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Meal Type</label>
                      <Select 
                        value={newLog.mealType} 
                        onValueChange={(value) => setNewLog({ ...newLog, mealType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {mealTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Calories</label>
                      <Input
                        type="number"
                        value={newLog.calories}
                        onChange={(e) => setNewLog({ ...newLog, calories: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Servings</label>
                      <Input
                        value={newLog.servings}
                        onChange={(e) => setNewLog({ ...newLog, servings: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Protein (g)</label>
                      <Input
                        value={newLog.protein}
                        onChange={(e) => setNewLog({ ...newLog, protein: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Carbs (g)</label>
                      <Input
                        value={newLog.carbs}
                        onChange={(e) => setNewLog({ ...newLog, carbs: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button type="submit" disabled={addNutritionLog.isPending}>
                      {addNutritionLog.isPending ? "Logging..." : "Log Meal"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsLogDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Date Selector */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <Calendar className="h-5 w-5 text-gray-600" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-48"
            />
          </div>
        </div>

        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList>
            <TabsTrigger value="progress">Daily Progress</TabsTrigger>
            <TabsTrigger value="goals">Health Goals</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="progress">
            {/* Daily Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-blue-500" />
                    Calories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Consumed</span>
                      <span>{progress.calories.consumed} / {progress.calories.target}</span>
                    </div>
                    <Progress 
                      value={(progress.calories.consumed / progress.calories.target) * 100} 
                      className="h-2"
                    />
                    <div className="text-xs text-gray-500">
                      {progress.calories.target - progress.calories.consumed} remaining
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                    Protein
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Consumed</span>
                      <span>{progress.protein.consumed}g / {progress.protein.target}g</span>
                    </div>
                    <Progress 
                      value={(progress.protein.consumed / progress.protein.target) * 100} 
                      className="h-2"
                    />
                    <div className="text-xs text-gray-500">
                      {((progress.protein.consumed / progress.protein.target) * 100).toFixed(0)}% of goal
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-red-500" />
                    Fiber
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Consumed</span>
                      <span>{progress.fiber.consumed}g / {progress.fiber.target}g</span>
                    </div>
                    <Progress 
                      value={(progress.fiber.consumed / progress.fiber.target) * 100} 
                      className="h-2"
                    />
                    <div className="text-xs text-gray-500">
                      Great for digestive health
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Macronutrient Breakdown */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Macronutrient Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{progress.carbs.consumed}g</div>
                    <div className="text-sm text-gray-600">Carbohydrates</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {((progress.carbs.consumed / progress.carbs.target) * 100).toFixed(0)}% of {progress.carbs.target}g goal
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{progress.protein.consumed}g</div>
                    <div className="text-sm text-gray-600">Protein</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {((progress.protein.consumed / progress.protein.target) * 100).toFixed(0)}% of {progress.protein.target}g goal
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{progress.fat.consumed}g</div>
                    <div className="text-sm text-gray-600">Fat</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {((progress.fat.consumed / progress.fat.target) * 100).toFixed(0)}% of {progress.fat.target}g goal
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals">
            <Card>
              <CardHeader>
                <CardTitle>Current Health Goals</CardTitle>
              </CardHeader>
              <CardContent>
                {healthGoals ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-4">Daily Targets</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Calories</span>
                          <span>{healthGoals.dailyCalories}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Protein</span>
                          <span>{healthGoals.dailyProtein}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Carbohydrates</span>
                          <span>{healthGoals.dailyCarbs}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fat</span>
                          <span>{healthGoals.dailyFat}g</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-4">Lifestyle</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Activity Level</span>
                          <Badge variant="secondary">
                            {healthGoals.activityLevel.replace('-', ' ')}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Weight Goal</span>
                          <Badge variant="outline">
                            {healthGoals.weightGoal}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Set your health goals to get personalized nutrition tracking
                    </p>
                    <Button onClick={() => setIsGoalsDialogOpen(true)}>
                      <Target className="h-4 w-4 mr-2" />
                      Set Your Goals
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Nutrition History</CardTitle>
              </CardHeader>
              <CardContent>
                {nutritionLogs && nutritionLogs.length > 0 ? (
                  <div className="space-y-4">
                    {nutritionLogs.map((log: NutritionLog) => (
                      <div key={log.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{log.mealType}</Badge>
                            <span className="text-sm text-gray-600">
                              {new Date(log.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-lg font-semibold">{log.calories} cal</div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Protein:</span>
                            <div className="font-medium">{log.protein}g</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Carbs:</span>
                            <div className="font-medium">{log.carbs}g</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Fat:</span>
                            <div className="font-medium">{log.fat}g</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Servings:</span>
                            <div className="font-medium">{log.servings}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      No nutrition logs found for {new Date(selectedDate).toLocaleDateString()}
                    </p>
                    <Button onClick={() => setIsLogDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Log Your First Meal
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}