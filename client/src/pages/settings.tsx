import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Utensils, ArrowLeft, User, Crown, LogOut } from "lucide-react";
import { Link } from "wouter";
import DietaryRestrictions from "@/components/dietary-restrictions";

export default function Settings() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
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
  }, [user, authLoading, toast]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Utensils className="text-primary text-2xl mr-3" />
              <h1 className="text-2xl font-playfair font-bold text-gray-900">ChefAI</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user.subscriptionStatus !== "free" && (
                <Badge className="bg-success/10 text-success border-success/20">
                  <Crown className="w-3 h-3 mr-1" />
                  {user.subscriptionStatus === "pro" ? "Pro Plan" : "Master Plan"}
                </Badge>
              )}
              <img 
                src={user.profileImageUrl || "https://pixabay.com/get/g97f69d5001156cc6cf5b3246e54483d6603ef8cd6db0c1ec1fb95b32c8fc84ed19b18b0f325b62f4ee515ecfc08e3a16db829214ac01305670107eeea47f61a3_1280.jpg"} 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover" 
              />
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-playfair font-bold text-gray-900 mb-2">
            Account Settings
          </h1>
          <p className="text-gray-600">
            Manage your account preferences and dietary restrictions.
          </p>
        </div>

        <div className="space-y-8">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <img 
                  src={user.profileImageUrl || "https://pixabay.com/get/g97f69d5001156cc6cf5b3246e54483d6603ef8cd6db0c1ec1fb95b32c8fc84ed19b18b0f325b62f4ee515ecfc08e3a16db829214ac01305670107eeea47f61a3_1280.jpg"} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full object-cover" 
                />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {user.firstName || user.lastName 
                      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                      : 'Chef User'
                    }
                  </h3>
                  <p className="text-gray-600">{user.email}</p>
                  <div className="flex items-center mt-2">
                    <Badge 
                      className={`${user.subscriptionStatus === "free" 
                        ? "bg-gray-100 text-gray-700" 
                        : "bg-success/10 text-success border-success/20"
                      }`}
                    >
                      {user.subscriptionStatus === "free" && "Free Plan"}
                      {user.subscriptionStatus === "pro" && (
                        <>
                          <Crown className="w-3 h-3 mr-1" />
                          Pro Plan
                        </>
                      )}
                      {user.subscriptionStatus === "premium" && (
                        <>
                          <Crown className="w-3 h-3 mr-1" />
                          Master Plan
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {user.subscriptionStatus === "free" && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Monthly Usage</h4>
                      <p className="text-sm text-blue-700">
                        {user.monthlyRecipeCount || 0} / 2 recipes used this month
                      </p>
                    </div>
                    <Link href="/subscribe">
                      <Button size="sm" className="bg-primary hover:bg-primary/90">
                        Upgrade
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dietary Restrictions */}
          <DietaryRestrictions />

          {/* Subscription Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="mr-2 h-5 w-5" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Current Plan: {user.subscriptionStatus === "free" ? "Free Explorer" : 
                                   user.subscriptionStatus === "pro" ? "Pro Chef" : "Master Chef"}
                    </h3>
                    <p className="text-gray-600">
                      {user.subscriptionStatus === "free" && "2 AI recipes per month"}
                      {user.subscriptionStatus === "pro" && "Unlimited AI recipes + advanced features"}
                      {user.subscriptionStatus === "premium" && "Everything in Pro + meal planning & priority support"}
                    </p>
                  </div>
                  {user.subscriptionStatus === "free" && (
                    <Link href="/subscribe">
                      <Button className="bg-primary hover:bg-primary/90">
                        <Crown className="mr-2 h-4 w-4" />
                        Upgrade Plan
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}