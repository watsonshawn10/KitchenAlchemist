import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Zap, ChefHat, Settings, Trash2, Wifi, WifiOff } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface KitchenEquipment {
  id: number;
  name: string;
  type: string;
  brand: string;
  model: string;
  capacity: string;
  features: string[];
  isSmartDevice: boolean;
  apiEndpoint: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const equipmentTypes = [
  "instant-pot", "air-fryer", "slow-cooker", "oven", "microwave", 
  "blender", "food-processor", "stand-mixer", "rice-cooker", "pressure-cooker", "other"
];

const commonFeatures = [
  "pressure-cook", "sauté", "steam", "slow-cook", "rice", "yogurt", 
  "air-fry", "bake", "roast", "dehydrate", "broil", "reheat", "defrost"
];

export default function Equipment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEquipment, setNewEquipment] = useState({
    name: "",
    type: "instant-pot",
    brand: "",
    model: "",
    capacity: "",
    features: [] as string[],
    isSmartDevice: false,
    apiEndpoint: "",
  });

  const { data: equipment, isLoading } = useQuery({
    queryKey: ["/api/equipment"],
    enabled: !!user,
  });

  const createEquipment = useMutation({
    mutationFn: async (equipment: typeof newEquipment) => {
      return apiRequest("POST", "/api/equipment", equipment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      setIsCreateDialogOpen(false);
      setNewEquipment({
        name: "",
        type: "instant-pot",
        brand: "",
        model: "",
        capacity: "",
        features: [],
        isSmartDevice: false,
        apiEndpoint: "",
      });
      toast({
        title: "Equipment Added",
        description: "New kitchen equipment has been added.",
      });
    },
  });

  const deleteEquipment = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/equipment/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Equipment Removed",
        description: "Kitchen equipment has been removed.",
      });
    },
  });

  const handleCreateEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEquipment.name.trim()) return;
    createEquipment.mutate(newEquipment);
  };

  const handleFeatureToggle = (feature: string) => {
    setNewEquipment(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
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
                <Link href="/shopping-lists" className="text-gray-600 hover:text-gray-900">
                  Shopping Lists
                </Link>
                <Link href="/pantry" className="text-gray-600 hover:text-gray-900">
                  Pantry
                </Link>
                <Link href="/equipment" className="text-primary font-medium">
                  Equipment
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
            <h1 className="text-3xl font-bold text-gray-900">Kitchen Equipment</h1>
            <p className="text-gray-600 mt-2">
              Manage your kitchen appliances and get optimized cooking instructions
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Kitchen Equipment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateEquipment} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Equipment Name</label>
                    <Input
                      value={newEquipment.name}
                      onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                      placeholder="e.g., Instant Pot Duo"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <Select 
                      value={newEquipment.type} 
                      onValueChange={(value) => setNewEquipment({ ...newEquipment, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {equipmentTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Brand</label>
                    <Input
                      value={newEquipment.brand}
                      onChange={(e) => setNewEquipment({ ...newEquipment, brand: e.target.value })}
                      placeholder="e.g., Instant Pot"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Model</label>
                    <Input
                      value={newEquipment.model}
                      onChange={(e) => setNewEquipment({ ...newEquipment, model: e.target.value })}
                      placeholder="e.g., Duo 7-in-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Capacity</label>
                    <Input
                      value={newEquipment.capacity}
                      onChange={(e) => setNewEquipment({ ...newEquipment, capacity: e.target.value })}
                      placeholder="e.g., 6 Qt"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Features</label>
                  <div className="grid grid-cols-3 gap-2">
                    {commonFeatures.map((feature) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <Checkbox
                          id={feature}
                          checked={newEquipment.features.includes(feature)}
                          onCheckedChange={() => handleFeatureToggle(feature)}
                        />
                        <label htmlFor={feature} className="text-sm capitalize">
                          {feature.replace('-', ' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="smart-device"
                    checked={newEquipment.isSmartDevice}
                    onCheckedChange={(checked) => 
                      setNewEquipment({ ...newEquipment, isSmartDevice: !!checked })
                    }
                  />
                  <label htmlFor="smart-device" className="text-sm font-medium">
                    Smart Device (WiFi Connected)
                  </label>
                </div>

                {newEquipment.isSmartDevice && (
                  <div>
                    <label className="block text-sm font-medium mb-2">API Endpoint (Optional)</label>
                    <Input
                      value={newEquipment.apiEndpoint}
                      onChange={(e) => setNewEquipment({ ...newEquipment, apiEndpoint: e.target.value })}
                      placeholder="e.g., https://api.instantpot.com/devices/12345"
                    />
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button type="submit" disabled={createEquipment.isPending}>
                    {createEquipment.isPending ? "Adding..." : "Add Equipment"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Equipment Grid */}
        {equipment && equipment.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.map((item: KitchenEquipment) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ChefHat className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.isSmartDevice ? (
                        <Wifi className="h-4 w-4 text-green-500" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-gray-400" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEquipment.mutate(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Badge variant="secondary" className="mb-2">
                        {item.type.split('-').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </Badge>
                      {item.isSmartDevice && (
                        <Badge variant="outline" className="ml-2">
                          <Zap className="h-3 w-3 mr-1" />
                          Smart
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <div><strong>Brand:</strong> {item.brand || "Not specified"}</div>
                      <div><strong>Model:</strong> {item.model || "Not specified"}</div>
                      <div><strong>Capacity:</strong> {item.capacity || "Not specified"}</div>
                    </div>

                    {item.features && item.features.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-2">Features:</div>
                        <div className="flex flex-wrap gap-1">
                          {item.features.slice(0, 4).map((feature) => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature.replace('-', ' ')}
                            </Badge>
                          ))}
                          {item.features.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{item.features.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {item.isSmartDevice && (
                      <div className="pt-2 border-t">
                        <div className="text-xs text-gray-500">
                          Smart features enabled - recipes will be optimized for this device
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Equipment Added</h3>
            <p className="text-gray-600 mb-6">
              Add your kitchen appliances to get personalized cooking instructions and recipe optimizations
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Equipment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}