import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ChefHat, 
  DollarSign, 
  Package, 
  Star, 
  ShoppingCart,
  Crown
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

  // Default stats for display
  const userStats = {
    recipesGenerated: 12,
    monthlyLimit: 999,
    totalSavings: 85.50,
    pantryItems: 24,
    averageRating: 4.3
  };

  const remainingRecipes = userStats.monthlyLimit - userStats.recipesGenerated;
  const isProUser = true;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ChefHat className="text-primary text-2xl mr-3" />
              <h1 className="text-2xl font-playfair font-bold text-gray-900">ChefAI</h1>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/collections" className="text-gray-700 hover:text-primary transition-colors">Collections</Link>
              <Link href="/shopping-lists" className="text-gray-700 hover:text-primary transition-colors">Shopping</Link>
              <Link href="/pantry" className="text-gray-700 hover:text-primary transition-colors">Pantry</Link>
              <Link href="/analytics" className="text-gray-700 hover:text-primary transition-colors">Analytics</Link>
              <Link href="/settings" className="text-gray-700 hover:text-primary transition-colors">Settings</Link>
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
              <Button onClick={() => window.location.href = "/api/logout"} variant="outline" size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
            Welcome back, {user?.firstName || 'Chef'}!
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your AI-powered kitchen companion is ready to help you create amazing meals from whatever ingredients you have.
          </p>
        </div>

        {/* Quick Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{userStats.recipesGenerated}</h3>
              <p className="text-gray-600 text-sm">Recipes Generated</p>
              <p className="text-xs text-gray-500 mt-1">
                {remainingRecipes > 0 ? `${remainingRecipes} remaining this month` : "Unlimited recipes"}
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">${userStats.totalSavings}</h3>
              <p className="text-gray-600 text-sm">Monthly Savings</p>
              <p className="text-xs text-gray-500 mt-1">Smart shopping optimization</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{userStats.pantryItems}</h3>
              <p className="text-gray-600 text-sm">Pantry Items</p>
              <p className="text-xs text-gray-500 mt-1">Ingredients tracked</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{userStats.averageRating}★</h3>
              <p className="text-gray-600 text-sm">Average Rating</p>
              <p className="text-xs text-gray-500 mt-1">Recipe satisfaction</p>
            </CardContent>
          </Card>
        </div>

        {/* Recipe Generation Section */}
        <section className="bg-gradient-warm py-16 -mx-4 sm:-mx-6 lg:-mx-8 mb-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-playfair font-bold text-gray-900 mb-4">
                Generate Your Next Meal
              </h2>
              <p className="text-xl text-gray-600">
                Add your available ingredients and let AI create personalized recipes just for you
              </p>
            </div>

            <Card className="shadow-xl">
              <CardContent className="p-8">
                <IngredientInput
                  selectedIngredients={selectedIngredients}
                  onIngredientsChange={setSelectedIngredients}
                  onGenerate={() => handleGenerate([])}
                  isGenerating={isGenerating}
                  remainingRecipes={remainingRecipes}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features Overview */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-playfair font-bold text-gray-900 mb-4">
              Your Complete Kitchen Assistant
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore all the tools available to enhance your cooking experience
            </p>
          </div>

          {/* Main Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/collections">
              <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-8">
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Recipe Collections</h3>
                  <p className="text-gray-600">
                    Organize and save your favorite recipes in custom collections for easy access.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/shopping-lists">
              <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-8">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Smart Shopping</h3>
                  <p className="text-gray-600">
                    Auto-generate shopping lists from recipes and track your grocery needs.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/pantry">
              <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-8">
                  <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Pantry Management</h3>
                  <p className="text-gray-600">
                    Track ingredients and get alerts before items expire in your pantry.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Generated Recipes Section */}
        {generatedRecipes.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-playfair font-bold text-gray-900 mb-6">Your Generated Recipes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedRecipes.map((recipe, index) => (
                <RecipeCard
                  key={index}
                  recipe={recipe}
                  onView={() => setSelectedRecipe(recipe)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recipe Modal */}
        {selectedRecipe && (
          <RecipeModal
            recipe={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <ChefHat className="text-primary text-2xl mr-3" />
                <h3 className="text-2xl font-playfair font-bold">ChefAI</h3>
              </div>
              <p className="text-gray-400">
                Your AI-powered kitchen companion for creating amazing meals from available ingredients.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/collections" className="hover:text-white transition-colors">Recipe Collections</Link></li>
                <li><Link href="/shopping-lists" className="hover:text-white transition-colors">Shopping Lists</Link></li>
                <li><Link href="/pantry" className="hover:text-white transition-colors">Pantry Management</Link></li>
                <li><Link href="/analytics" className="hover:text-white transition-colors">Analytics</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Account</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/settings" className="hover:text-white transition-colors">Settings</Link></li>
                <li><Link href="/subscribe" className="hover:text-white transition-colors">Upgrade Plan</Link></li>
                <li><button onClick={() => window.location.href = "/api/logout"} className="hover:text-white transition-colors text-left">Sign Out</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ChefAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}