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
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Truck, Store, MapPin, Clock, DollarSign, Settings, Tag, Plus, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DeliveryOption {
  id: number;
  storeId: number;
  storeName: string;
  deliveryTime: string;
  deliveryFee: string;
  minimumOrder: string;
  available: boolean;
  estimatedDelivery: string;
  website?: string;
}

interface Deal {
  id: number;
  ingredient: string;
  discount: string;
  originalPrice: string;
  salePrice: string;
  store: string;
  expiresAt: string;
}

interface SmartOrder {
  ingredients: string[];
  stores: {
    storeName: string;
    items: Array<{
      name: string;
      price: string;
      quantity: string;
    }>;
    subtotal: string;
    deliveryFee: string;
    total: string;
  }[];
  totalCost: string;
  estimatedSavings: string;
}

export default function Grocery() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [isOptimizeDialogOpen, setIsOptimizeDialogOpen] = useState(false);

  console.log("Grocery page loaded, user:", user);

  const { data: deliveryOptions } = useQuery({
    queryKey: ["/api/delivery-options"],
    enabled: false, // Disabled to use mock data
  });

  const { data: currentDeals } = useQuery({
    queryKey: ["/api/current-deals"],
    enabled: false, // Disabled to use mock data
  });

  const { data: shoppingLists } = useQuery({
    queryKey: ["/api/shopping-lists"],
    enabled: !!user,
  });

  const optimizeOrder = useMutation({
    mutationFn: async (ingredients: string[]) => {
      return apiRequest("POST", "/api/optimize-grocery-order", { ingredients });
    },
    onSuccess: (data) => {
      setIsOptimizeDialogOpen(false);
      toast({
        title: "Order Optimized",
        description: `Found best prices across ${data.stores?.length || 1} stores`,
      });
    },
  });

  const createDeliveryOrder = useMutation({
    mutationFn: async (orderData: any) => {
      return apiRequest("POST", "/api/create-delivery-order", orderData);
    },
    onSuccess: () => {
      toast({
        title: "Delivery Scheduled",
        description: "Your grocery delivery has been scheduled.",
      });
    },
  });

  const handleAddIngredient = () => {
    if (newIngredient.trim() && !selectedIngredients.includes(newIngredient.trim())) {
      setSelectedIngredients([...selectedIngredients, newIngredient.trim()]);
      setNewIngredient("");
    }
  };

  const handleRemoveIngredient = (ingredient: string) => {
    setSelectedIngredients(selectedIngredients.filter(i => i !== ingredient));
  };

  const handleOptimizeOrder = () => {
    if (selectedIngredients.length === 0) {
      toast({
        title: "No Ingredients",
        description: "Please add ingredients to optimize your order.",
        variant: "destructive",
      });
      return;
    }
    optimizeOrder.mutate(selectedIngredients);
  };

  // Mock data when API isn't available
  const mockDeliveryOptions: DeliveryOption[] = (Array.isArray(deliveryOptions) && deliveryOptions.length > 0) ? deliveryOptions : [
    {
      id: 1,
      storeId: 1,
      storeName: "Whole Foods Market",
      deliveryTime: "2-4 hours",
      deliveryFee: "9.95",
      minimumOrder: "35.00",
      available: true,
      estimatedDelivery: "Today by 6:00 PM",
      website: "https://www.wholefoodsmarket.com"
    },
    {
      id: 2,
      storeId: 2,
      storeName: "Instacart",
      deliveryTime: "1-3 hours",
      deliveryFee: "7.99",
      minimumOrder: "25.00",
      available: true,
      estimatedDelivery: "Today by 4:00 PM",
      website: "https://www.instacart.com"
    },
    {
      id: 3,
      storeId: 3,
      storeName: "Amazon Fresh",
      deliveryTime: "Same day",
      deliveryFee: "0.00",
      minimumOrder: "50.00",
      available: true,
      estimatedDelivery: "Tomorrow by 10:00 AM",
      website: "https://www.amazon.com/fresh"
    },
    {
      id: 4,
      storeId: 4,
      storeName: "Kroger Fresh",
      deliveryTime: "2-3 hours",
      deliveryFee: "8.95",
      minimumOrder: "30.00",
      available: true,
      estimatedDelivery: "Today by 5:00 PM",
      website: "https://www.kroger.com/d/delivery"
    },
    {
      id: 5,
      storeId: 5,
      storeName: "DoorDash",
      deliveryTime: "30-60 min",
      deliveryFee: "4.99",
      minimumOrder: "15.00",
      available: true,
      estimatedDelivery: "Today by 3:00 PM",
      website: "https://www.doordash.com"
    },
    {
      id: 6,
      storeId: 6,
      storeName: "Uber Eats",
      deliveryTime: "25-45 min",
      deliveryFee: "3.99",
      minimumOrder: "12.00",
      available: true,
      estimatedDelivery: "Today by 2:30 PM",
      website: "https://www.ubereats.com"
    }
  ];

  console.log("Delivery options being used:", mockDeliveryOptions);

  const mockDeals: Deal[] = currentDeals || [
    {
      id: 1,
      ingredient: "Organic Chicken Breast",
      discount: "25%",
      originalPrice: "8.99",
      salePrice: "6.74",
      store: "Whole Foods",
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      ingredient: "Avocados",
      discount: "30%",
      originalPrice: "2.49",
      salePrice: "1.74",
      store: "Safeway",
      expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      ingredient: "Salmon Fillets",
      discount: "20%",
      originalPrice: "12.99",
      salePrice: "10.39",
      store: "Amazon Fresh",
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const mockOptimizedOrder: SmartOrder = {
    ingredients: selectedIngredients,
    stores: [
      {
        storeName: "Whole Foods Market",
        items: [
          { name: "Organic Chicken Breast", price: "6.74", quantity: "2 lbs" },
          { name: "Fresh Broccoli", price: "3.49", quantity: "1 bunch" }
        ],
        subtotal: "10.23",
        deliveryFee: "9.95",
        total: "20.18"
      },
      {
        storeName: "Amazon Fresh",
        items: [
          { name: "Salmon Fillets", price: "10.39", quantity: "1 lb" },
          { name: "Rice", price: "4.99", quantity: "2 lbs" }
        ],
        subtotal: "15.38",
        deliveryFee: "0.00",
        total: "15.38"
      }
    ],
    totalCost: "35.56",
    estimatedSavings: "12.44"
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
                <Link href="/costs" className="text-gray-600 hover:text-gray-900">
                  Costs
                </Link>
                <Link href="/grocery" className="text-primary font-medium">
                  Grocery
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
            <h1 className="text-3xl font-bold text-gray-900">Smart Grocery & Delivery</h1>
            <p className="text-gray-600 mt-2">
              Find the best deals and optimize your grocery shopping with smart delivery options
            </p>
          </div>
          
          <Dialog open={isOptimizeDialogOpen} onOpenChange={setIsOptimizeDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Optimize Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Smart Order Optimization</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Add Ingredients</label>
                  <div className="flex space-x-2">
                    <Input
                      value={newIngredient}
                      onChange={(e) => setNewIngredient(e.target.value)}
                      placeholder="e.g., Chicken breast"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddIngredient()}
                    />
                    <Button onClick={handleAddIngredient}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Selected Ingredients</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedIngredients.map((ingredient) => (
                      <Badge 
                        key={ingredient} 
                        variant="secondary" 
                        className="cursor-pointer"
                        onClick={() => handleRemoveIngredient(ingredient)}
                      >
                        {ingredient} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {optimizeOrder.data && (
                  <div className="border rounded-lg p-4 bg-green-50">
                    <h3 className="font-medium text-green-900 mb-3">Optimized Order Summary</h3>
                    <div className="space-y-3">
                      {mockOptimizedOrder.stores.map((store, index) => (
                        <div key={index} className="border rounded p-3 bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">{store.storeName}</div>
                            <div className="text-lg font-bold">${store.total}</div>
                          </div>
                          <div className="space-y-1 text-sm">
                            {store.items.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex justify-between">
                                <span>{item.name} ({item.quantity})</span>
                                <span>${item.price}</span>
                              </div>
                            ))}
                            <div className="border-t pt-1 mt-2">
                              <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>${store.subtotal}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Delivery:</span>
                                <span>${store.deliveryFee}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="text-center pt-3 border-t">
                        <div className="text-lg font-bold">Total: ${mockOptimizedOrder.totalCost}</div>
                        <div className="text-green-600">Savings: ${mockOptimizedOrder.estimatedSavings}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button onClick={handleOptimizeOrder} disabled={optimizeOrder.isPending}>
                    {optimizeOrder.isPending ? "Optimizing..." : "Find Best Prices"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsOptimizeDialogOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="delivery" className="space-y-6">
          <TabsList>
            <TabsTrigger value="delivery">Delivery Options</TabsTrigger>
            <TabsTrigger value="deals">Current Deals</TabsTrigger>
            <TabsTrigger value="stores">Store Partners</TabsTrigger>
            <TabsTrigger value="optimizer">Smart Shopping</TabsTrigger>
          </TabsList>

          <TabsContent value="delivery">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockDeliveryOptions.map((option) => (
                <Card key={option.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {option.website ? (
                          <a 
                            href={option.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                          >
                            {option.storeName}
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : (
                          option.storeName
                        )}
                      </CardTitle>
                      {option.available ? (
                        <Badge variant="default">Available</Badge>
                      ) : (
                        <Badge variant="secondary">Unavailable</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{option.deliveryTime}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          ${option.deliveryFee} delivery fee
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          ${option.minimumOrder} minimum order
                        </span>
                      </div>

                      <div className="pt-2 border-t">
                        <div className="text-sm font-medium text-green-600">
                          {option.estimatedDelivery}
                        </div>
                      </div>

                      <Button 
                        className="w-full" 
                        disabled={!option.available}
                        onClick={() => {
                          toast({
                            title: "Redirecting",
                            description: `Opening ${option.storeName} for shopping`,
                          });
                        }}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Shop Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="deals">
            <div className="space-y-4">
              {mockDeals.map((deal) => (
                <Card key={deal.id} className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Tag className="h-4 w-4 text-orange-600" />
                          <h3 className="font-medium text-orange-900">{deal.ingredient}</h3>
                          <Badge variant="destructive">{deal.discount} OFF</Badge>
                        </div>
                        <div className="text-sm text-orange-700">
                          <span className="line-through">${deal.originalPrice}</span>
                          <span className="ml-2 font-bold">${deal.salePrice}</span>
                          <span className="ml-2">at {deal.store}</span>
                        </div>
                        <div className="text-xs text-orange-600 mt-1">
                          Expires: {new Date(deal.expiresAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stores">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockDeliveryOptions.map((store) => (
                <Card key={store.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Store className="h-5 w-5 mr-2" />
                      {store.website ? (
                        <a 
                          href={store.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                        >
                          {store.storeName}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : (
                        store.storeName
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Delivery Time:</span>
                        <span className="text-sm font-medium">{store.deliveryTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Delivery Fee:</span>
                        <span className="text-sm font-medium">${store.deliveryFee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Minimum Order:</span>
                        <span className="text-sm font-medium">${store.minimumOrder}</span>
                      </div>
                      <div className="pt-2">
                        <Button variant="outline" className="w-full">
                          <MapPin className="h-4 w-4 mr-2" />
                          View Store Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="optimizer">
            <Card>
              <CardHeader>
                <CardTitle>Smart Shopping Assistant</CardTitle>
                <p className="text-sm text-gray-600">
                  Our AI analyzes prices across multiple stores to find you the best deals
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3">How it works:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <ShoppingCart className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <div className="font-medium">Add Ingredients</div>
                        <div className="text-sm text-gray-600">
                          Select what you need to buy
                        </div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <Truck className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <div className="font-medium">AI Optimization</div>
                        <div className="text-sm text-gray-600">
                          We find the best prices and delivery options
                        </div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <DollarSign className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                        <div className="font-medium">Save Money</div>
                        <div className="text-sm text-gray-600">
                          Get the best deals automatically
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Features:</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Compare prices across multiple stores</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Factor in delivery fees and minimum orders</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Apply available coupons and deals automatically</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Schedule deliveries for optimal timing</span>
                      </li>
                    </ul>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => setIsOptimizeDialogOpen(true)}
                  >
                    Start Smart Shopping
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}