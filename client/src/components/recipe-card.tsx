import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Star, ArrowRight } from "lucide-react";

interface Recipe {
  id: number;
  title: string;
  description: string;
  cookingTime: number;
  servings: number;
  difficulty: string;
  imageUrl?: string;
  rating: number;
}

interface RecipeCardProps {
  recipe: Recipe;
  onView: () => void;
}

export default function RecipeCard({ recipe, onView }: RecipeCardProps) {
  const defaultImage = "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";

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
    <Card className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
      <img 
        src={recipe.imageUrl || defaultImage} 
        alt={recipe.title}
        className="w-full h-64 object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = defaultImage;
        }}
      />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <Badge className={`px-3 py-1 text-sm font-medium ${getDifficultyColor(recipe.difficulty)}`}>
            <Clock className="w-3 h-3 mr-1" />
            {recipe.cookingTime} mins
          </Badge>
          <div className="flex items-center text-yellow-400">
            <Star className="w-4 h-4 mr-1 fill-current" />
            <span className="text-gray-600 text-sm">{recipe.rating}</span>
          </div>
        </div>
        
        <h4 className="text-xl font-semibold text-gray-900 mb-2">
          {recipe.title}
        </h4>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {recipe.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <Users className="w-4 h-4 mr-2" />
            <span>{recipe.servings} servings</span>
          </div>
          <Button 
            onClick={onView}
            variant="ghost"
            className="text-primary hover:text-primary/80 font-semibold p-0 h-auto"
          >
            View Recipe <ArrowRight className="ml-1 w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
