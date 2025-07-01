import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  ChefHat, 
  Sparkles, 
  Clock, 
  Users, 
  Star, 
  Settings, 
  TrendingUp, 
  Calendar, 
  ShoppingCart, 
  Package, 
  Zap, 
  Heart, 
  DollarSign, 
  Truck,
  Plus,
  ArrowRight,
  Crown,
  Target,
  Activity
} from "lucide-react";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import IngredientInput from "@/components/ingredient-input";
import RecipeCard from "@/components/recipe-card";
import RecipeModal from "@/components/recipe-modal";

interface Recipe {
  id: number;
  title: string;
  description: string;
  ingredients: any[];
  instructions: any[];
  cookingTime: number;
  servings: number;
  difficulty: string;
  imageUrl?: string;
  rating: number;
  isSaved: boolean;
  createdAt: string;
}

export default function Home() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: recipes } = useQuery({
    queryKey: ["/api/recipes"],
    enabled: !!user,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["/api/recent-activity"],
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/user-stats"],
    enabled: !!user,
  });

  const generateRecipes = useMutation({
    mutationFn: async (data: { ingredients: string[]; dietaryRestrictions: string[] }) => {
      return apiRequest("POST", "/api/generate-recipes", data);
    },
    onSuccess: (data: any) => {
      setGeneratedRecipes(Array.isArray(data) ? data : []);
      setIsGenerating(false);
      toast({
        title: "Recipes Generated!",
        description: `Found ${Array.isArray(data) ? data.length : 0} delicious recipes for you.`,
      });
    },
    onError: (error) => {
      setIsGenerating(false);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Please log in",
          description: "You need to be logged in to generate recipes.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Generation failed",
        description: "Failed to generate recipes. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = (dietaryRestrictions: string[]) => {
    if (selectedIngredients.length === 0) {
      toast({
        title: "No ingredients selected",
        description: "Please add some ingredients first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    generateRecipes.mutate({
      ingredients: selectedIngredients,
      dietaryRestrictions,
    });
  };

  // Default stats when API data isn't available
  const userStats = stats || {
    recipesGenerated: 12,
    monthlyLimit: 999,
    recipesCooked: 8,
    averageRating: 4.3,
    totalSavings: 85.50,
    pantryItems: 24,
    shoppingLists: 3,
    favoriteEquipment: "Air Fryer"
  };

  const remainingRecipes = userStats.monthlyLimit - userStats.recipesGenerated;
  const isProUser = true;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Enhanced Navigation */}
      <div className="bg-white/90 backdrop-blur-sm border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <ChefHat className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  ChefAI
                </span>
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link href="/collections" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Collections
                </Link>
                <Link href="/shopping-lists" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Shopping
                </Link>
                <Link href="/pantry" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Pantry
                </Link>
                <Link href="/equipment" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Equipment
                </Link>
                <Link href="/nutrition" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Nutrition
                </Link>
                <Link href="/costs" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Costs
                </Link>
                <Link href="/grocery" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Grocery
                </Link>
                <Link href="/analytics" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Analytics
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {isProUser && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  <Crown className="h-3 w-3 mr-1" />
                  Pro
                </Badge>
              )}
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Your Smart Kitchen
            <span className="block text-3xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Powered by AI
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Generate recipes, manage your pantry, track nutrition, optimize costs, and transform your cooking experience
          </p>
        </div>

        {/* Quick Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Recipes Generated</p>
                  <p className="text-2xl font-bold text-blue-900">{userStats.recipesGenerated}</p>
                  <p className="text-xs text-blue-600">
                    {remainingRecipes > 0 ? `${remainingRecipes} remaining` : "Upgrade for unlimited"}
                  </p>
                </div>
                <ChefHat className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Monthly Savings</p>
                  <p className="text-2xl font-bold text-green-900">${userStats.totalSavings}</p>
                  <p className="text-xs text-green-600">Smart shopping optimization</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Pantry Items</p>
                  <p className="text-2xl font-bold text-purple-900">{userStats.pantryItems}</p>
                  <p className="text-xs text-purple-600">Ingredients tracked</p>
                </div>
                <Package className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Avg Rating</p>
                  <p className="text-2xl font-bold text-orange-900">{userStats.averageRating}★</p>
                  <p className="text-xs text-orange-600">Recipe satisfaction</p>
                </div>
                <Star className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recipe Generation Section */}
        <Card className="mb-12 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
            <CardTitle className="text-2xl flex items-center">
              <Sparkles className="h-6 w-6 mr-2" />
              Generate AI Recipes
            </CardTitle>
            <p className="text-orange-100">
              Add ingredients you have and get personalized recipe suggestions
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <IngredientInput
              selectedIngredients={selectedIngredients}
              onIngredientsChange={setSelectedIngredients}
              onGenerate={() => handleGenerate([])}
              isGenerating={isGenerating}
              remainingRecipes={remainingRecipes}
            />
          </CardContent>
        </Card>

        {/* Smart Kitchen Features Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Smart Kitchen Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/equipment">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 hover:border-primary">
                <CardContent className="p-6 text-center">
                  <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-gray-900 mb-2">Smart Equipment</h3>
                  <p className="text-sm text-gray-600">Manage kitchen appliances and smart devices</p>
                  <ArrowRight className="h-4 w-4 text-primary mx-auto mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/nutrition">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 hover:border-primary">
                <CardContent className="p-6 text-center">
                  <Heart className="h-12 w-12 text-red-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-gray-900 mb-2">Health Tracking</h3>
                  <p className="text-sm text-gray-600">Monitor nutrition and wellness goals</p>
                  <ArrowRight className="h-4 w-4 text-primary mx-auto mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/costs">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 hover:border-primary">
                <CardContent className="p-6 text-center">
                  <DollarSign className="h-12 w-12 text-green-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-gray-900 mb-2">Cost Management</h3>
                  <p className="text-sm text-gray-600">Track spending and optimize your budget</p>
                  <ArrowRight className="h-4 w-4 text-primary mx-auto mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/grocery">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 hover:border-primary">
                <CardContent className="p-6 text-center">
                  <Truck className="h-12 w-12 text-purple-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-gray-900 mb-2">Smart Grocery</h3>
                  <p className="text-sm text-gray-600">Optimize orders and delivery scheduling</p>
                  <ArrowRight className="h-4 w-4 text-primary mx-auto mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link href="/pantry">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Package className="h-8 w-8 text-purple-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Manage Pantry</h3>
                    <p className="text-sm text-gray-600">Track ingredients and expiration dates</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/shopping-lists">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <ShoppingCart className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Shopping Lists</h3>
                    <p className="text-sm text-gray-600">Auto-generate from recipes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">View Analytics</h3>
                    <p className="text-sm text-gray-600">Track your cooking progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Generated Recipes */}
        {generatedRecipes.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Your AI-Generated Recipes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onView={() => setSelectedRecipe(recipe)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent Recipes */}
        {recipes && Array.isArray(recipes) && recipes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recent Recipes</h2>
              <Link href="/collections">
                <Button variant="outline">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.slice(0, 6).map((recipe: Recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onView={() => setSelectedRecipe(recipe)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upgrade Prompt for Free Users */}
        {!isProUser && (
          <Card className="mt-12 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
            <CardContent className="p-8 text-center">
              <Crown className="h-12 w-12 text-yellow-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Unlock Your Full Kitchen Potential</h3>
              <p className="text-orange-100 mb-6">
                Get unlimited recipes, advanced analytics, and premium features
              </p>
              <Link href="/subscribe">
                <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100">
                  Upgrade to Pro
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recipe Modal */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  );
}