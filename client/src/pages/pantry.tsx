import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package, Trash2, Settings, AlertTriangle, Calendar } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PantryItem {
  id: number;
  name: string;
  category: string;
  amount: string;
  unit: string;
  expiryDate: string | null;
  isStaple: boolean;
  createdAt: string;
  updatedAt: string;
}

const categories = [
  "produce", "dairy", "meat", "pantry", "frozen", "beverages", "snacks", "condiments", "other"
];

export default function Pantry() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "pantry",
    amount: "",
    unit: "",
    expiryDate: "",
    isStaple: false,
  });

  const { data: pantryItems, isLoading } = useQuery({
    queryKey: ["/api/pantry"],
    enabled: !!user,
  });

  const { data: expiringItems } = useQuery({
    queryKey: ["/api/pantry/expiring"],
    enabled: !!user,
  });

  const createItem = useMutation({
    mutationFn: async (item: typeof newItem) => {
      return apiRequest("POST", "/api/pantry", {
        ...item,
        expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pantry"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pantry/expiring"] });
      setIsCreateDialogOpen(false);
      setNewItem({
        name: "",
        category: "pantry",
        amount: "",
        unit: "",
        expiryDate: "",
        isStaple: false,
      });
      toast({
        title: "Item Added",
        description: "New pantry item has been added.",
      });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/pantry/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pantry"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pantry/expiring"] });
      toast({
        title: "Item Removed",
        description: "Pantry item has been removed.",
      });
    },
  });

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;
    createItem.mutate(newItem);
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const groupedItems = pantryItems?.reduce((acc: Record<string, PantryItem[]>, item: PantryItem) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {}) || {};

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
                <Link href="/pantry" className="text-primary font-medium">
                  Pantry
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
            <h1 className="text-3xl font-bold text-gray-900">Pantry Management</h1>
            <p className="text-gray-600 mt-2">
              Keep track of ingredients and get expiration alerts
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Pantry Item</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Item Name</label>
                  <Input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="e.g., Tomatoes"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Amount</label>
                    <Input
                      value={newItem.amount}
                      onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                      placeholder="e.g., 2"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Unit</label>
                    <Input
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                      placeholder="e.g., lbs, pieces"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Expiry Date</label>
                    <Input
                      type="date"
                      value={newItem.expiryDate}
                      onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={createItem.isPending}>
                    {createItem.isPending ? "Adding..." : "Add Item"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Expiring Items Alert */}
        {expiringItems && expiringItems.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-orange-900">Items Expiring Soon</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expiringItems.slice(0, 3).map((item: PantryItem) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-orange-900">{item.name}</span>
                    <Badge variant="outline" className="text-orange-700 border-orange-300">
                      <Calendar className="h-3 w-3 mr-1" />
                      {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "No date"}
                    </Badge>
                  </div>
                ))}
                {expiringItems.length > 3 && (
                  <p className="text-sm text-orange-700">
                    And {expiringItems.length - 3} more items...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pantry Items by Category */}
        {Object.keys(groupedItems).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category}>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 capitalize">
                  {category} ({items.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item: PantryItem) => (
                    <Card
                      key={item.id}
                      className={`${
                        isExpired(item.expiryDate)
                          ? "border-red-200 bg-red-50"
                          : isExpiringSoon(item.expiryDate)
                          ? "border-orange-200 bg-orange-50"
                          : ""
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-gray-600" />
                            <CardTitle className="text-sm">{item.name}</CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteItem.mutate(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="text-sm text-gray-600">
                            {item.amount} {item.unit}
                          </div>
                          {item.expiryDate && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 text-gray-500" />
                              <span className={`text-xs ${
                                isExpired(item.expiryDate)
                                  ? "text-red-600 font-medium"
                                  : isExpiringSoon(item.expiryDate)
                                  ? "text-orange-600 font-medium"
                                  : "text-gray-500"
                              }`}>
                                {isExpired(item.expiryDate) ? "Expired " : "Expires "}
                                {new Date(item.expiryDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {item.isStaple && (
                            <Badge variant="secondary" className="text-xs">
                              Staple
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your Pantry is Empty</h3>
            <p className="text-gray-600 mb-6">
              Start tracking your ingredients to get expiration alerts and recipe suggestions
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Item
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}