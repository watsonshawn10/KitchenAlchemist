import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Clock, Users, Utensils, Check, Bookmark, Share2, X } from "lucide-react";

interface Recipe {
  id: number;
  title: string;
  description: string;
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string;
  }>;
  instructions: Array<{
    stepNumber: number;
    instruction: string;
    duration?: number;
  }>;
  cookingTime: number;
  servings: number;
  difficulty: string;
  imageUrl?: string;
  rating: number;
  isSaved: boolean;
  createdAt: string;
}

interface RecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
}

export default function RecipeModal({ recipe, onClose }: RecipeModalProps) {
  const { toast } = useToast();
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  
  const defaultImage = "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400";

  const saveRecipeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/recipes/${recipe.id}/save`);
    },
    onSuccess: () => {
      toast({
        title: "Recipe Saved!",
        description: "Recipe has been saved to your collection.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
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
        description: "Failed to save recipe. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleStep = (stepNumber: number) => {
    const newCheckedSteps = new Set(checkedSteps);
    if (newCheckedSteps.has(stepNumber)) {
      newCheckedSteps.delete(stepNumber);
    } else {
      newCheckedSteps.add(stepNumber);
    }
    setCheckedSteps(newCheckedSteps);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: recipe.description,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied!",
          description: "Recipe link has been copied to your clipboard.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy link to clipboard.",
          variant: "destructive",
        });
      }
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-success/10 text-success";
      case "medium":
        return "bg-secondary/10 text-secondary";
      case "hard":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-accent/10 text-accent";
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="relative">
          <img 
            src={recipe.imageUrl || defaultImage} 
            alt={recipe.title}
            className="w-full h-80 object-cover rounded-t-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultImage;
            }}
          />
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-8">
          <DialogHeader className="mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-playfair font-bold text-gray-900 mb-3">
                  {recipe.title}
                </h2>
                <p className="text-gray-600 text-lg">{recipe.description}</p>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recipe Info */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Recipe Info</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Clock className="text-accent mr-3 h-5 w-5" />
                    <span className="text-gray-600">Cook Time: {recipe.cookingTime} minutes</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="text-accent mr-3 h-5 w-5" />
                    <span className="text-gray-600">Serves: {recipe.servings} people</span>
                  </div>
                  <div className="flex items-center">
                    <Utensils className="text-accent mr-3 h-5 w-5" />
                    <Badge className={`${getDifficultyColor(recipe.difficulty)} border-none`}>
                      {recipe.difficulty}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Ingredients</h3>
                <ul className="space-y-2 text-gray-600">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="text-accent mr-3 h-4 w-4 mt-1 flex-shrink-0" />
                      <span>
                        {ingredient.amount} {ingredient.unit} {ingredient.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Instructions */}
            <div className="lg:col-span-2">
              <h3 className="font-semibold text-gray-900 mb-6">Step-by-Step Instructions</h3>
              <div className="space-y-6">
                {recipe.instructions.map((step) => (
                  <div key={step.stepNumber} className="flex items-start">
                    <button
                      onClick={() => toggleStep(step.stepNumber)}
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold mr-4 mt-1 transition-colors ${
                        checkedSteps.has(step.stepNumber)
                          ? "bg-success text-white"
                          : "bg-primary text-white"
                      }`}
                    >
                      {checkedSteps.has(step.stepNumber) ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        step.stepNumber
                      )}
                    </button>
                    <div className={`flex-1 ${checkedSteps.has(step.stepNumber) ? "opacity-50 line-through" : ""}`}>
                      <p className="text-gray-700 mb-2">{step.instruction}</p>
                      {step.duration && (
                        <p className="text-sm text-gray-500">⏱️ {step.duration} minutes</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center space-x-4">
                <Button
                  onClick={() => saveRecipeMutation.mutate()}
                  disabled={saveRecipeMutation.isPending || recipe.isSaved}
                  className="bg-accent hover:bg-accent/90 text-white"
                >
                  <Bookmark className="mr-2 h-4 w-4" />
                  {recipe.isSaved ? "Saved" : "Save Recipe"}
                </Button>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="border-gray-200 hover:bg-gray-50"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
