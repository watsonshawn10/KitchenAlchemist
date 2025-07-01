import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ShoppingCart, Trash2, Settings, Check } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ShoppingList {
  id: number;
  name: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ShoppingListItem {
  id: number;
  name: string;
  amount: string;
  unit: string;
  category: string;
  isChecked: boolean;
  recipeId?: number;
}

export default function ShoppingLists() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [selectedListId, setSelectedListId] = useState<number | null>(null);

  const { data: shoppingLists, isLoading } = useQuery({
    queryKey: ["/api/shopping-lists"],
    enabled: !!user,
  });

  const { data: listItems, isLoading: itemsLoading } = useQuery({
    queryKey: ["/api/shopping-lists", selectedListId, "items"],
    enabled: !!selectedListId,
  });

  const createList = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("POST", "/api/shopping-lists", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-lists"] });
      setIsCreateDialogOpen(false);
      setNewListName("");
      toast({
        title: "Shopping List Created",
        description: "Your new shopping list has been created.",
      });
    },
  });

  const toggleItem = useMutation({
    mutationFn: async ({ id, isChecked }: { id: number; isChecked: boolean }) => {
      return apiRequest("PUT", `/api/shopping-lists/items/${id}`, { isChecked });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-lists", selectedListId, "items"] });
    },
  });

  const deleteList = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/shopping-lists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-lists"] });
      if (selectedListId === arguments[0]) {
        setSelectedListId(null);
      }
      toast({
        title: "Shopping List Deleted",
        description: "Shopping list has been deleted.",
      });
    },
  });

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    createList.mutate(newListName);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="lg:col-span-2 h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                <Link href="/shopping-lists" className="text-primary font-medium">
                  Shopping Lists
                </Link>
                <Link href="/pantry" className="text-gray-600 hover:text-gray-900">
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
            <h1 className="text-3xl font-bold text-gray-900">Shopping Lists</h1>
            <p className="text-gray-600 mt-2">
              Manage your grocery shopping with organized lists
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New List
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Shopping List</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateList} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">List Name</label>
                  <Input
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="e.g., Weekly Groceries"
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={createList.isPending}>
                    {createList.isPending ? "Creating..." : "Create List"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shopping Lists Sidebar */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Your Lists</h2>
            {shoppingLists && shoppingLists.length > 0 ? (
              shoppingLists.map((list: ShoppingList) => (
                <Card
                  key={list.id}
                  className={`cursor-pointer transition-all ${
                    selectedListId === list.id ? "ring-2 ring-primary" : "hover:shadow-md"
                  }`}
                  onClick={() => setSelectedListId(list.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ShoppingCart className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm">{list.name}</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteList.mutate(list.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xs text-gray-500">
                      {new Date(list.createdAt).toLocaleDateString()}
                    </div>
                    {list.isCompleted && (
                      <Badge variant="secondary" className="mt-2">
                        <Check className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-sm">No shopping lists yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    Create First List
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Shopping List Items */}
          <div className="lg:col-span-2">
            {selectedListId ? (
              <Card>
                <CardHeader>
                  <CardTitle>Shopping Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {itemsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-6 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  ) : listItems && listItems.length > 0 ? (
                    <div className="space-y-3">
                      {listItems.map((item: ShoppingListItem) => (
                        <div key={item.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                          <Checkbox
                            checked={item.isChecked}
                            onCheckedChange={(checked) =>
                              toggleItem.mutate({ id: item.id, isChecked: !!checked })
                            }
                          />
                          <div className={`flex-1 ${item.isChecked ? "line-through text-gray-500" : ""}`}>
                            <span className="font-medium">{item.name}</span>
                            {item.amount && (
                              <span className="text-gray-600 ml-2">
                                {item.amount} {item.unit}
                              </span>
                            )}
                            <Badge variant="outline" className="ml-2 text-xs">
                              {item.category}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">This shopping list is empty</p>
                      <p className="text-gray-500 text-sm mt-2">
                        Generate shopping lists from your recipes or add items manually
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Shopping List</h3>
                  <p className="text-gray-600">
                    Choose a shopping list from the sidebar to view and manage items
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}