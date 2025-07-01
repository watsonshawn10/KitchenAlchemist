import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Utensils, Plus, LogOut, Crown } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import IngredientInput from "@/components/ingredient-input";
import RecipeCard from "@/components/recipe-card";
import RecipeModal from "@/components/recipe-modal";
import PricingSection from "@/components/pricing-section";
import { Link } from "wouter";

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
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showPricing, setShowPricing] = useState(false);

  // Get user's recipes
  const { data: recipes = [], isLoading: recipesLoading, refetch: refetchRecipes } = useQuery({
    queryKey: ["/api/recipes"],
    enabled: !!user,
  });

  // Generate recipes mutation
  const generateRecipesMutation = useMutation({
    mutationFn: async (ingredients: string[]) => {
      const res = await apiRequest("POST", "/api/generate-recipes", { ingredients });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Recipes Generated!",
        description: `Generated ${data.recipes.length} delicious recipes for you.`,
      });
      refetchRecipes();
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
      
      const errorMessage = error.message;
      if (errorMessage.includes("limit reached")) {
        setShowPricing(true);
        toast({
          title: "Recipe Limit Reached",
          description: "Upgrade to Pro for unlimited AI recipes!",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  const handleGenerateRecipes = () => {
    if (selectedIngredients.length === 0) {
      toast({
        title: "No Ingredients",
        description: "Please add at least one ingredient to generate recipes.",
        variant: "destructive",
      });
      return;
    }
    generateRecipesMutation.mutate(selectedIngredients);
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const remainingRecipes = user?.subscriptionStatus === "free" ? Math.max(0, 2 - (user?.monthlyRecipeCount || 0)) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Utensils className="text-primary text-2xl mr-3" />
              <h1 className="text-2xl font-playfair font-bold text-gray-900">ChefAI</h1>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-700 hover:text-primary transition-colors">Home</a>
              <a href="#recipes" className="text-gray-700 hover:text-primary transition-colors">My Recipes</a>
              <Link href="/settings" className="text-gray-700 hover:text-primary transition-colors">Settings</Link>
              <a href="#pricing" className="text-gray-700 hover:text-primary transition-colors">Pricing</a>
            </div>
            <div className="flex items-center space-x-4">
              {user?.subscriptionStatus !== "free" && (
                <Badge className="bg-success/10 text-success border-success/20">
                  <Crown className="w-3 h-3 mr-1" />
                  {user?.subscriptionStatus === "pro" ? "Pro Plan" : "Master Plan"}
                </Badge>
              )}
              {user?.subscriptionStatus === "free" && (
                <Badge variant="outline" className="text-gray-600">
                  Free: {remainingRecipes} recipes left
                </Badge>
              )}
              <img 
                src={user?.profileImageUrl || "https://pixabay.com/get/g97f69d5001156cc6cf5b3246e54483d6603ef8cd6db0c1ec1fb95b32c8fc84ed19b18b0f325b62f4ee515ecfc08e3a16db829214ac01305670107eeea47f61a3_1280.jpg"} 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover" 
              />
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="bg-gradient-warm py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-playfair font-bold text-gray-900 mb-6">
              Turn Your Ingredients Into<br />
              <span className="text-primary">Culinary Magic</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AI-powered recipe discovery that transforms whatever you have in your kitchen into delicious, step-by-step guided meals.
            </p>
          </div>

          {/* Ingredient Input */}
          <IngredientInput
            selectedIngredients={selectedIngredients}
            onIngredientsChange={setSelectedIngredients}
            onGenerate={handleGenerateRecipes}
            isGenerating={generateRecipesMutation.isPending}
            remainingRecipes={remainingRecipes}
          />
        </div>
      </section>

      {/* Recipe Results */}
      <section id="recipes" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-3xl font-playfair font-bold text-gray-900">Your AI-Generated Recipes</h3>
          </div>

          {recipesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="w-full h-64 bg-gray-200 animate-pulse" />
                  <div className="p-6">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-3" />
                    <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-12">
              <Utensils className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes yet</h3>
              <p className="text-gray-500">
                Add some ingredients above to generate your first AI-powered recipes!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recipes.map((recipe: Recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onView={() => setSelectedRecipe(recipe)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Pricing Section */}
      {(showPricing || user?.subscriptionStatus === "free") && (
        <PricingSection currentPlan={user?.subscriptionStatus || "free"} />
      )}

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
