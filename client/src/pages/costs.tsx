import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, DollarSign, TrendingDown, TrendingUp, Store, Settings, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RecipeCost {
  id: number;
  recipeId: number;
  recipeName: string;
  totalCost: string;
  costPerServing: string;
  calculatedAt: string;
  ingredientCosts: any;
}

interface IngredientPrice {
  id: number;
  ingredientName: string;
  storeId: number;
  storeName: string;
  price: string;
  unit: string;
  packageSize: string;
  brand: string;
  isOrganic: boolean;
  lastUpdated: string;
}

interface GroceryStore {
  id: number;
  name: string;
  chain: string;
  location: string;
  deliveryAvailable: boolean;
  minimumOrder: string;
  deliveryFee: string;
}

export default function Costs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isStoreDialogOpen, setIsStoreDialogOpen] = useState(false);
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);

  const [newStore, setNewStore] = useState({
    name: "",
    chain: "",
    location: "",
    deliveryAvailable: false,
    minimumOrder: "",
    deliveryFee: "",
  });

  const [newPrice, setNewPrice] = useState({
    ingredientName: "",
    storeId: 0,
    price: "",
    unit: "",
    packageSize: "",
    brand: "",
    isOrganic: false,
  });

  const { data: recipeCosts } = useQuery({
    queryKey: ["/api/recipe-costs"],
    enabled: !!user,
  });

  const { data: ingredientPrices } = useQuery({
    queryKey: ["/api/ingredient-prices"],
    enabled: !!user,
  });

  const { data: groceryStores } = useQuery({
    queryKey: ["/api/grocery-stores"],
    enabled: !!user,
  });

  const { data: costAnalytics } = useQuery({
    queryKey: ["/api/cost-analytics"],
    enabled: !!user,
  });

  const addStore = useMutation({
    mutationFn: async (store: typeof newStore) => {
      return apiRequest("POST", "/api/grocery-stores", store);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grocery-stores"] });
      setIsStoreDialogOpen(false);
      setNewStore({
        name: "",
        chain: "",
        location: "",
        deliveryAvailable: false,
        minimumOrder: "",
        deliveryFee: "",
      });
      toast({
        title: "Store Added",
        description: "New grocery store has been added.",
      });
    },
  });

  const addPrice = useMutation({
    mutationFn: async (price: typeof newPrice) => {
      return apiRequest("POST", "/api/ingredient-prices", price);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredient-prices"] });
      setIsPriceDialogOpen(false);
      setNewPrice({
        ingredientName: "",
        storeId: 0,
        price: "",
        unit: "",
        packageSize: "",
        brand: "",
        isOrganic: false,
      });
      toast({
        title: "Price Added",
        description: "Ingredient price has been updated.",
      });
    },
  });

  const handleAddStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStore.name.trim()) return;
    addStore.mutate(newStore);
  };

  const handleAddPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrice.ingredientName.trim() || !newPrice.price) return;
    addPrice.mutate(newPrice);
  };

  // Mock data when API isn't available
  const mockRecipeCosts: RecipeCost[] = recipeCosts || [
    {
      id: 1,
      recipeId: 1,
      recipeName: "Chicken Stir Fry",
      totalCost: "12.50",
      costPerServing: "3.13",
      calculatedAt: new Date().toISOString(),
      ingredientCosts: {}
    },
    {
      id: 2,
      recipeId: 2,
      recipeName: "Pasta Marinara",
      totalCost: "8.75",
      costPerServing: "2.19",
      calculatedAt: new Date().toISOString(),
      ingredientCosts: {}
    }
  ];

  const mockIngredientPrices: IngredientPrice[] = ingredientPrices || [
    {
      id: 1,
      ingredientName: "Chicken Breast",
      storeId: 1,
      storeName: "Whole Foods",
      price: "8.99",
      unit: "lb",
      packageSize: "1 lb",
      brand: "Organic Valley",
      isOrganic: true,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 2,
      ingredientName: "Tomatoes",
      storeId: 1,
      storeName: "Whole Foods",
      price: "3.49",
      unit: "lb",
      packageSize: "1 lb",
      brand: "",
      isOrganic: false,
      lastUpdated: new Date().toISOString()
    }
  ];

  const mockStores: GroceryStore[] = groceryStores || [
    {
      id: 1,
      name: "Whole Foods Market",
      chain: "Whole Foods",
      location: "Downtown",
      deliveryAvailable: true,
      minimumOrder: "35.00",
      deliveryFee: "9.95"
    }
  ];

  const analytics = costAnalytics || {
    averageCostPerMeal: 8.50,
    monthlySpending: 255.0,
    cheapestRecipes: mockRecipeCosts.slice(0, 3),
    mostExpensiveIngredients: mockIngredientPrices.slice(0, 3),
    savingsOpportunities: [
      { ingredient: "Chicken Breast", currentPrice: 8.99, bestPrice: 6.99, store: "Costco", savings: 2.00 },
      { ingredient: "Olive Oil", currentPrice: 12.99, bestPrice: 9.99, store: "Trader Joe's", savings: 3.00 }
    ]
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
                <Link href="/nutrition" className="text-gray-600 hover:text-gray-900">
                  Nutrition
                </Link>
                <Link href="/costs" className="text-primary font-medium">
                  Costs
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
            <h1 className="text-3xl font-bold text-gray-900">Cost Management</h1>
            <p className="text-gray-600 mt-2">
              Track ingredient prices and recipe costs to optimize your food budget
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Dialog open={isStoreDialogOpen} onOpenChange={setIsStoreDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Store className="h-4 w-4 mr-2" />
                  Add Store
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Grocery Store</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddStore} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Store Name</label>
                      <Input
                        value={newStore.name}
                        onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                        placeholder="e.g., Whole Foods Market"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Chain</label>
                      <Input
                        value={newStore.chain}
                        onChange={(e) => setNewStore({ ...newStore, chain: e.target.value })}
                        placeholder="e.g., Whole Foods"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Location</label>
                    <Input
                      value={newStore.location}
                      onChange={(e) => setNewStore({ ...newStore, location: e.target.value })}
                      placeholder="e.g., Downtown, 123 Main St"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Minimum Order</label>
                      <Input
                        value={newStore.minimumOrder}
                        onChange={(e) => setNewStore({ ...newStore, minimumOrder: e.target.value })}
                        placeholder="e.g., 35.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Delivery Fee</label>
                      <Input
                        value={newStore.deliveryFee}
                        onChange={(e) => setNewStore({ ...newStore, deliveryFee: e.target.value })}
                        placeholder="e.g., 9.95"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button type="submit" disabled={addStore.isPending}>
                      {addStore.isPending ? "Adding..." : "Add Store"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsStoreDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isPriceDialogOpen} onOpenChange={setIsPriceDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Price
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Ingredient Price</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddPrice} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Ingredient Name</label>
                    <Input
                      value={newPrice.ingredientName}
                      onChange={(e) => setNewPrice({ ...newPrice, ingredientName: e.target.value })}
                      placeholder="e.g., Chicken Breast"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Store</label>
                    <Select 
                      value={newPrice.storeId.toString()} 
                      onValueChange={(value) => setNewPrice({ ...newPrice, storeId: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a store" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockStores.map((store) => (
                          <SelectItem key={store.id} value={store.id.toString()}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Price</label>
                      <Input
                        value={newPrice.price}
                        onChange={(e) => setNewPrice({ ...newPrice, price: e.target.value })}
                        placeholder="e.g., 8.99"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Unit</label>
                      <Input
                        value={newPrice.unit}
                        onChange={(e) => setNewPrice({ ...newPrice, unit: e.target.value })}
                        placeholder="e.g., lb"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Package Size</label>
                      <Input
                        value={newPrice.packageSize}
                        onChange={(e) => setNewPrice({ ...newPrice, packageSize: e.target.value })}
                        placeholder="e.g., 1 lb"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button type="submit" disabled={addPrice.isPending}>
                      {addPrice.isPending ? "Adding..." : "Add Price"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsPriceDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Cost Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-500" />
                Average Cost Per Meal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.averageCostPerMeal.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">
                Based on your recent recipes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                Monthly Spending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.monthlySpending.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">
                Estimated based on meal frequency
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <TrendingDown className="h-5 w-5 mr-2 text-orange-500" />
                Potential Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$25.00</div>
              <p className="text-xs text-gray-500 mt-1">
                By switching to better priced stores
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="recipes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="recipes">Recipe Costs</TabsTrigger>
            <TabsTrigger value="ingredients">Ingredient Prices</TabsTrigger>
            <TabsTrigger value="stores">Grocery Stores</TabsTrigger>
            <TabsTrigger value="savings">Savings Opportunities</TabsTrigger>
          </TabsList>

          <TabsContent value="recipes">
            <Card>
              <CardHeader>
                <CardTitle>Recipe Cost Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRecipeCosts.map((recipe) => (
                    <div key={recipe.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{recipe.recipeName}</h3>
                        <div className="text-right">
                          <div className="text-lg font-bold">${recipe.totalCost}</div>
                          <div className="text-sm text-gray-600">${recipe.costPerServing}/serving</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Last calculated: {new Date(recipe.calculatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ingredients">
            <Card>
              <CardHeader>
                <CardTitle>Current Ingredient Prices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockIngredientPrices.map((price) => (
                    <div key={price.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{price.ingredientName}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">{price.storeName}</Badge>
                            {price.isOrganic && (
                              <Badge variant="secondary">Organic</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">${price.price}</div>
                          <div className="text-sm text-gray-600">per {price.unit}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>Package: {price.packageSize}</div>
                        <div>Updated: {new Date(price.lastUpdated).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stores">
            <Card>
              <CardHeader>
                <CardTitle>Your Grocery Stores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockStores.map((store) => (
                    <div key={store.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{store.name}</h3>
                          <p className="text-sm text-gray-600">{store.location}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {store.deliveryAvailable && (
                            <Badge variant="outline">
                              <ShoppingCart className="h-3 w-3 mr-1" />
                              Delivery
                            </Badge>
                          )}
                        </div>
                      </div>
                      {store.deliveryAvailable && (
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>Min Order: ${store.minimumOrder}</div>
                          <div>Delivery Fee: ${store.deliveryFee}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="savings">
            <Card>
              <CardHeader>
                <CardTitle>Savings Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.savingsOpportunities.map((opportunity, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-green-50 border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{opportunity.ingredient}</h3>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            Save ${opportunity.savings.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">per purchase</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Current Price:</span>
                          <div className="font-medium">${opportunity.currentPrice}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Best Price at {opportunity.store}:</span>
                          <div className="font-medium text-green-600">${opportunity.bestPrice}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}