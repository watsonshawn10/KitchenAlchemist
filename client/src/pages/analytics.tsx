import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, TrendingUp, Star, Clock, ChefHat, Settings } from "lucide-react";
import { Link } from "wouter";

interface CookingAnalytics {
  totalRecipesCooked: number;
  averageRating: number;
  favoriteCuisines: string[];
  cookingFrequency: { month: string; count: number }[];
  topRatedRecipes: any[];
}

export default function Analytics() {
  const { user } = useAuth();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/analytics"],
    enabled: !!user,
  });

  const { data: cookingHistory } = useQuery({
    queryKey: ["/api/cooking-history"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const data: CookingAnalytics = analytics || {
    totalRecipesCooked: 0,
    averageRating: 0,
    favoriteCuisines: [],
    cookingFrequency: [],
    topRatedRecipes: [],
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
                <Link href="/analytics" className="text-primary font-medium">
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Cooking Analytics</h1>
          <p className="text-gray-600 mt-2">
            Track your cooking journey and discover your patterns
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Recipes Cooked</CardTitle>
                <ChefHat className="h-4 w-4 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {data.totalRecipesCooked}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Delicious meals prepared
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {data.averageRating.toFixed(1)}
                <span className="text-lg font-normal text-gray-500">/5.0</span>
              </div>
              <div className="flex items-center mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= Math.round(data.averageRating)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {data.cookingFrequency.length > 0 
                  ? data.cookingFrequency[data.cookingFrequency.length - 1]?.count || 0 
                  : 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Recipes cooked this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Cooking Streak</CardTitle>
                <Clock className="h-4 w-4 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">7</div>
              <p className="text-xs text-gray-500 mt-1">
                Days cooking this week
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Favorite Cuisines */}
          <Card>
            <CardHeader>
              <CardTitle>Favorite Cuisines</CardTitle>
            </CardHeader>
            <CardContent>
              {data.favoriteCuisines.length > 0 ? (
                <div className="space-y-4">
                  {data.favoriteCuisines.map((cuisine, index) => (
                    <div key={cuisine} className="flex items-center justify-between">
                      <span className="font-medium">{cuisine}</span>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={100 - (index * 20)} 
                          className="w-20 h-2"
                        />
                        <span className="text-sm text-gray-500">
                          {100 - (index * 20)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-sm">
                    Cook more recipes to see your favorite cuisines
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Cooking Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {data.cookingFrequency.length > 0 ? (
                <div className="space-y-3">
                  {data.cookingFrequency.slice(-6).map((month) => (
                    <div key={month.month} className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {new Date(month.month + "-01").toLocaleDateString('en-US', { 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={(month.count / Math.max(...data.cookingFrequency.map(m => m.count))) * 100} 
                          className="w-20 h-2"
                        />
                        <span className="text-sm text-gray-500 w-8">
                          {month.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-sm">
                    Start cooking to track your monthly activity
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Rated Recipes */}
        <Card>
          <CardHeader>
            <CardTitle>Your Top Rated Recipes</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topRatedRecipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.topRatedRecipes.map((recipe, index) => (
                  <div key={recipe.id || index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-gray-900 mb-2">
                      {recipe.title || "Delicious Recipe"}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {recipe.description || "A wonderful recipe you've cooked and rated highly."}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className="h-3 w-3 text-yellow-400 fill-current"
                          />
                        ))}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {recipe.difficulty || "Medium"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Rated Recipes Yet</h3>
                <p className="text-gray-600 mb-6">
                  Cook recipes and rate them to see your favorites here
                </p>
                <Link href="/">
                  <Button>
                    <ChefHat className="h-4 w-4 mr-2" />
                    Start Cooking
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Cooking History */}
        {cookingHistory && cookingHistory.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Cooking History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cookingHistory.slice(0, 5).map((entry: any, index: number) => (
                  <div key={entry.id || index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <span className="font-medium">Recipe #{entry.recipeId}</span>
                      {entry.notes && (
                        <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        {entry.rating && [1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= entry.rating
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        {entry.cookedAt ? new Date(entry.cookedAt).toLocaleDateString() : "Recently"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}