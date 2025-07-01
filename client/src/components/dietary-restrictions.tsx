import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Save } from "lucide-react";

const DIETARY_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian", description: "No meat or fish" },
  { id: "vegan", label: "Vegan", description: "No animal products" },
  { id: "gluten-free", label: "Gluten Free", description: "No wheat, barley, or rye" },
  { id: "dairy-free", label: "Dairy Free", description: "No milk or dairy products" },
  { id: "keto", label: "Keto", description: "Low carb, high fat" },
  { id: "paleo", label: "Paleo", description: "No grains, legumes, or processed foods" },
  { id: "low-sodium", label: "Low Sodium", description: "Reduced salt content" },
  { id: "nut-free", label: "Nut Free", description: "No tree nuts or peanuts" },
  { id: "pescatarian", label: "Pescatarian", description: "Fish but no meat" },
  { id: "halal", label: "Halal", description: "Islamic dietary guidelines" },
  { id: "kosher", label: "Kosher", description: "Jewish dietary guidelines" }
];

interface DietaryRestrictionsProps {
  compact?: boolean;
}

export default function DietaryRestrictions({ compact = false }: DietaryRestrictionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>(
    user?.dietaryRestrictions || []
  );

  const updateRestrictionsMutation = useMutation({
    mutationFn: async (restrictions: string[]) => {
      await apiRequest("PUT", "/api/user/dietary-restrictions", { restrictions });
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your dietary preferences have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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
        description: "Failed to update dietary preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRestrictionChange = (restrictionId: string, checked: boolean) => {
    if (checked) {
      setSelectedRestrictions(prev => [...prev, restrictionId]);
    } else {
      setSelectedRestrictions(prev => prev.filter(id => id !== restrictionId));
    }
  };

  const handleSave = () => {
    updateRestrictionsMutation.mutate(selectedRestrictions);
  };

  const hasChanges = JSON.stringify(selectedRestrictions.sort()) !== JSON.stringify((user?.dietaryRestrictions || []).sort());

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Dietary Preferences</h3>
          {selectedRestrictions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedRestrictions.slice(0, 3).map((restriction) => {
                const option = DIETARY_OPTIONS.find(opt => opt.id === restriction);
                return (
                  <Badge key={restriction} variant="secondary" className="text-xs">
                    {option?.label}
                  </Badge>
                );
              })}
              {selectedRestrictions.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{selectedRestrictions.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600">
          AI will generate recipes that match your dietary preferences.
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="mr-2 h-5 w-5" />
          Dietary Preferences
        </CardTitle>
        <p className="text-sm text-gray-600">
          Select your dietary restrictions and preferences. The AI will generate recipes that match your needs.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DIETARY_OPTIONS.map((option) => (
            <div key={option.id} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <Checkbox
                id={option.id}
                checked={selectedRestrictions.includes(option.id)}
                onCheckedChange={(checked) => handleRestrictionChange(option.id, checked as boolean)}
                className="mt-1"
              />
              <div className="space-y-1 flex-1">
                <label 
                  htmlFor={option.id}
                  className="text-sm font-medium text-gray-900 cursor-pointer"
                >
                  {option.label}
                </label>
                <p className="text-xs text-gray-500">{option.description}</p>
              </div>
            </div>
          ))}
        </div>

        {selectedRestrictions.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Selected Preferences:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedRestrictions.map((restriction) => {
                const option = DIETARY_OPTIONS.find(opt => opt.id === restriction);
                return (
                  <Badge key={restriction} className="bg-blue-100 text-blue-800 border-blue-200">
                    {option?.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateRestrictionsMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {updateRestrictionsMutation.isPending ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}