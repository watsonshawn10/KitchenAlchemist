import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, Sparkles } from "lucide-react";

interface IngredientInputProps {
  selectedIngredients: string[];
  onIngredientsChange: (ingredients: string[]) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  remainingRecipes: number | null;
}

export default function IngredientInput({ 
  selectedIngredients, 
  onIngredientsChange, 
  onGenerate, 
  isGenerating,
  remainingRecipes 
}: IngredientInputProps) {
  const [currentIngredient, setCurrentIngredient] = useState("");

  const handleAddIngredient = () => {
    if (currentIngredient.trim() && !selectedIngredients.includes(currentIngredient.trim())) {
      onIngredientsChange([...selectedIngredients, currentIngredient.trim()]);
      setCurrentIngredient("");
    }
  };

  const handleRemoveIngredient = (ingredient: string) => {
    onIngredientsChange(selectedIngredients.filter(i => i !== ingredient));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddIngredient();
    }
  };

  const commonIngredients = [
    "Chicken Breast", "Ground Beef", "Salmon", "Eggs", "Rice", "Pasta",
    "Tomatoes", "Onions", "Garlic", "Bell Peppers", "Potatoes", "Carrots",
    "Broccoli", "Spinach", "Mushrooms", "Cheese", "Milk", "Butter",
    "Olive Oil", "Salt", "Black Pepper", "Basil", "Oregano", "Thyme"
  ];

  return (
    <Card className="max-w-4xl mx-auto shadow-xl">
      <CardContent className="p-8">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          What ingredients do you have?
        </h3>
        
        {/* Input Field */}
        <div className="mb-6">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Start typing ingredients... (e.g., chicken, tomatoes, onions)"
              value={currentIngredient}
              onChange={(e) => setCurrentIngredient(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-lg py-3"
            />
            <Button 
              onClick={handleAddIngredient}
              disabled={!currentIngredient.trim()}
              size="lg"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Common Ingredients */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-3">Quick add:</p>
          <div className="flex flex-wrap gap-2">
            {commonIngredients.slice(0, 12).map((ingredient) => (
              <Button
                key={ingredient}
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!selectedIngredients.includes(ingredient)) {
                    onIngredientsChange([...selectedIngredients, ingredient]);
                  }
                }}
                disabled={selectedIngredients.includes(ingredient)}
                className="text-xs"
              >
                {ingredient}
              </Button>
            ))}
          </div>
        </div>

        {/* Selected Ingredients */}
        {selectedIngredients.length > 0 && (
          <div className="mb-8">
            <p className="text-sm text-gray-600 mb-3">Selected ingredients:</p>
            <div className="flex flex-wrap gap-3">
              {selectedIngredients.map((ingredient) => (
                <Badge
                  key={ingredient}
                  className="bg-primary/10 text-primary border-primary/20 px-4 py-2 text-sm"
                >
                  {ingredient}
                  <button
                    onClick={() => handleRemoveIngredient(ingredient)}
                    className="ml-2 hover:text-primary/70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="text-center">
          <Button
            onClick={onGenerate}
            disabled={selectedIngredients.length === 0 || isGenerating}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-12 py-4 text-lg"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-3" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-3 h-5 w-5" />
                Generate AI Recipes
              </>
            )}
          </Button>
          {remainingRecipes !== null && (
            <p className="text-sm text-gray-500 mt-3">
              {remainingRecipes > 0 
                ? `✨ ${remainingRecipes} free recipe${remainingRecipes === 1 ? '' : 's'} remaining this month`
                : "🔒 Upgrade to Pro for unlimited recipes"
              }
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
