import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, 
  Calendar, 
  Utensils, 
  TrendingDown, 
  Clock,
  ChefHat,
  Target,
  Lightbulb,
  ShoppingCart,
  PiggyBank,
  Settings
} from "lucide-react";

interface MealPlan {
  id: number;
  name: string;
  description: string;
  weekStartDate: string;
  totalBudget: string;
  actualCost: string;
  isActive: boolean;
  createdAt: string;
}

interface PlannedMeal {
  id: number;
  mealPlanId: number;
  recipeId: number | null;
  mealType: string;
  scheduledDate: string;
  servings: number;
  estimatedCost: string;
  actualCost: string | null;
  isCooked: boolean;
  rating: number | null;
  notes: string | null;
}

interface BudgetPreferences {
  id: number;
  userId: string;
  weeklyBudget: string;
  maxMealCost: string | null;
  priorityIngredients: string[];
  avoidExpensiveItems: boolean;
  preferStoreBrands: boolean;
  bulkBuyingEnabled: boolean;
  seasonalPriorityEnabled: boolean;
}

interface BudgetMealPlanResult {
  mealPlan: MealPlan;
  plannedMeals: PlannedMeal[];
  totalCost: number;
  savings: number;
}

interface OptimizationResult {
  optimizedMeals: PlannedMeal[];
  totalSavings: number;
  substitutions: { original: string; substitute: string; savings: number }[];
}

export default function BudgetMealPlanner() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [weeklyBudget, setWeeklyBudget] = useState<number>(50);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch user's meal plans
  const { data: mealPlans } = useQuery({
    queryKey: ["/api/meal-plans"],
    enabled: !!user,
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  // Fetch budget preferences
  const { data: budgetPreferences } = useQuery({
    queryKey: ["/api/budget-preferences"],
    enabled: !!user,
  });

  // Fetch planned meals for selected plan
  const { data: plannedMeals } = useQuery({
    queryKey: ["/api/meal-plans", selectedPlan?.id, "meals"],
    enabled: !!selectedPlan,
  });

  // Generate budget meal plan mutation
  const generateMealPlanMutation = useMutation({
    mutationFn: async ({ weeklyBudget, dietaryRestrictions }: { 
      weeklyBudget: number; 
      dietaryRestrictions: string[] 
    }) => {
      return await apiRequest("/api/generate-budget-meal-plan", "POST", {
        weeklyBudget,
        dietaryRestrictions,
      });
    },
    onSuccess: (data: BudgetMealPlanResult) => {
      toast({
        title: "Success!",
        description: `Generated budget meal plan with $${data.savings.toFixed(2)} in savings!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      setSelectedPlan(data.mealPlan);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to generate meal plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Optimize meal plan mutation
  const optimizeMealPlanMutation = useMutation({
    mutationFn: async (mealPlanId: number) => {
      return await apiRequest(`/api/meal-plans/${mealPlanId}/optimize`, "POST", {});
    },
    onSuccess: (data: OptimizationResult) => {
      toast({
        title: "Optimization Complete!",
        description: `Saved $${data.totalSavings.toFixed(2)} with smart substitutions!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans", selectedPlan?.id, "meals"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to optimize meal plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateMealPlan = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    try {
      await generateMealPlanMutation.mutateAsync({
        weeklyBudget,
        dietaryRestrictions: user.dietaryRestrictions || [],
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptimizePlan = async () => {
    if (!selectedPlan) return;
    await optimizeMealPlanMutation.mutateAsync(selectedPlan.id);
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const getDayName = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast': return '🥞';
      case 'lunch': return '🥗';
      case 'dinner': return '🍽️';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-8">
        <PiggyBank className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-bold">Budget-Friendly Meal Planner</h1>
          <p className="text-gray-600">Create personalized meal plans that fit your budget and taste</p>
        </div>
      </div>

      <Tabs defaultValue="planner" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="planner">Meal Planner</TabsTrigger>
          <TabsTrigger value="plans">My Plans</TabsTrigger>
          <TabsTrigger value="settings">Budget Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="planner" className="space-y-6">
          {/* Budget Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Set Your Weekly Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="budget">Weekly Budget ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="10"
                    max="500"
                    value={weeklyBudget}
                    onChange={(e) => setWeeklyBudget(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handleGenerateMealPlan}
                    disabled={isGenerating || !weeklyBudget}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isGenerating ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ChefHat className="h-4 w-4 mr-2" />
                        Generate Plan
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <div className="font-medium">Breakfast: 15%</div>
                  <div>{formatCurrency(weeklyBudget * 0.15)}</div>
                </div>
                <div>
                  <div className="font-medium">Lunch: 35%</div>
                  <div>{formatCurrency(weeklyBudget * 0.35)}</div>
                </div>
                <div>
                  <div className="font-medium">Dinner: 40%</div>
                  <div>{formatCurrency(weeklyBudget * 0.40)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Meal Plan Display */}
          {selectedPlan && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {selectedPlan.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      Budget: {formatCurrency(selectedPlan.totalBudget)}
                    </Badge>
                    <Badge variant="outline">
                      Actual: {formatCurrency(selectedPlan.actualCost)}
                    </Badge>
                    <Button
                      onClick={handleOptimizePlan}
                      variant="outline"
                      size="sm"
                      disabled={optimizeMealPlanMutation.isPending}
                    >
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Optimize
                    </Button>
                  </div>
                </div>
                <p className="text-gray-600">{selectedPlan.description}</p>
              </CardHeader>
              <CardContent>
                {plannedMeals && plannedMeals.length > 0 ? (
                  <div className="grid gap-4">
                    {/* Group meals by day */}
                    {Array.from(new Set(plannedMeals.map(meal => 
                      new Date(meal.scheduledDate).toDateString()
                    ))).map(dateString => {
                      const dayMeals = plannedMeals.filter(meal => 
                        new Date(meal.scheduledDate).toDateString() === dateString
                      );
                      const dayTotal = dayMeals.reduce((sum, meal) => 
                        sum + parseFloat(meal.estimatedCost), 0
                      );
                      
                      return (
                        <div key={dateString} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">
                              {getDayName(dayMeals[0].scheduledDate)}
                            </h3>
                            <Badge variant="outline">
                              Day Total: {formatCurrency(dayTotal)}
                            </Badge>
                          </div>
                          <div className="grid gap-2">
                            {dayMeals.map(meal => (
                              <div key={meal.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                                <div className="flex items-center gap-3">
                                  <span className="text-lg">{getMealIcon(meal.mealType)}</span>
                                  <div>
                                    <div className="font-medium capitalize">{meal.mealType}</div>
                                    <div className="text-sm text-gray-600">
                                      {meal.recipeId ? 'Custom Recipe' : 'AI Suggested'}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">{formatCurrency(meal.estimatedCost)}</div>
                                  {meal.isCooked && (
                                    <Badge variant="secondary" className="text-xs">Cooked</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No meals planned yet. Generate a meal plan to get started!
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Meal Plans</CardTitle>
            </CardHeader>
            <CardContent>
              {mealPlans && mealPlans.length > 0 ? (
                <div className="grid gap-4">
                  {mealPlans.map((plan: MealPlan) => (
                    <div 
                      key={plan.id} 
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedPlan?.id === plan.id ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{plan.name}</h3>
                          <p className="text-sm text-gray-600">{plan.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span>Budget: {formatCurrency(plan.totalBudget)}</span>
                            <span>Spent: {formatCurrency(plan.actualCost)}</span>
                            <span className="text-green-600">
                              Saved: {formatCurrency(parseFloat(plan.totalBudget) - parseFloat(plan.actualCost))}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {plan.isActive && (
                            <Badge variant="default">Active</Badge>
                          )}
                          <div className="text-sm text-gray-500 mt-1">
                            {new Date(plan.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No meal plans yet. Create your first budget-friendly meal plan!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Budget Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div>
                  <Label>Default Weekly Budget</Label>
                  <Input 
                    type="number" 
                    defaultValue={budgetPreferences?.weeklyBudget || weeklyBudget}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label>Maximum Cost Per Meal</Label>
                  <Input 
                    type="number" 
                    defaultValue={budgetPreferences?.maxMealCost || "15"}
                    className="mt-1"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Shopping Preferences</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        defaultChecked={budgetPreferences?.preferStoreBrands}
                        className="rounded border-gray-300"
                      />
                      <span>Prefer store brands</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        defaultChecked={budgetPreferences?.bulkBuyingEnabled}
                        className="rounded border-gray-300"
                      />
                      <span>Enable bulk buying</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        defaultChecked={budgetPreferences?.seasonalPriorityEnabled}
                        className="rounded border-gray-300"
                      />
                      <span>Prioritize seasonal ingredients</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        defaultChecked={budgetPreferences?.avoidExpensiveItems}
                        className="rounded border-gray-300"
                      />
                      <span>Avoid expensive items</span>
                    </label>
                  </div>
                </div>

                <Button className="w-full">
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}