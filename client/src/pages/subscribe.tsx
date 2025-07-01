import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Crown } from "lucide-react";
import { Link } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const PRICE_IDS = {
  pro: import.meta.env.VITE_STRIPE_PRO_PRICE_ID || "price_pro_monthly", // Replace with actual price ID
  premium: import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID || "price_premium_monthly", // Replace with actual price ID
};

const SubscribeForm = ({ plan, planPrice }: { plan: string; planPrice: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: `Welcome to ${plan} plan!`,
      });
    }
    
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-primary hover:bg-primary/90 text-white"
        size="lg"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            Processing...
          </>
        ) : (
          <>
            <Crown className="mr-2 h-4 w-4" />
            Subscribe to {plan} - {planPrice}
          </>
        )}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "premium">("pro");
  const [isLoading, setIsLoading] = useState(false);

  const plans = {
    pro: {
      name: "Pro Chef",
      price: "$9.99/month",
      features: [
        "Unlimited AI recipes",
        "Advanced ingredient matching",
        "Recipe saving & organization",
        "Dietary preference filters",
        "Nutritional information"
      ]
    },
    premium: {
      name: "Master Chef",
      price: "$19.99/month",
      features: [
        "Everything in Pro",
        "AI meal planning",
        "Shopping list generation",
        "Video cooking tutorials",
        "Priority support"
      ]
    }
  };

  const createSubscription = async (plan: "pro" | "premium") => {
    if (!stripePromise) {
      toast({
        title: "Payment Unavailable",
        description: "Payment processing is currently not configured. This is a demo version.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/create-subscription", { 
        priceId: PRICE_IDS[plan] 
      });
      const data = await res.json();
      setClientSecret(data.clientSecret);
    } catch (error: any) {
      if (error.message.includes("STRIPE_NOT_CONFIGURED")) {
        toast({
          title: "Payment Unavailable",
          description: "Payment processing is currently not configured. This is a demo version.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create subscription. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPlan) {
      createSubscription(selectedPlan);
    }
  }, [selectedPlan]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-playfair font-bold text-gray-900 mb-2">
            Upgrade Your Cooking Experience
          </h1>
          <p className="text-gray-600">
            Choose your plan and start creating unlimited AI-powered recipes today.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Selection */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Your Plan</h2>
            
            {Object.entries(plans).map(([key, plan]) => (
              <Card 
                key={key}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedPlan === key 
                    ? 'border-primary shadow-lg transform scale-[1.02]' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPlan(key as "pro" | "premium")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                      <p className="text-2xl font-bold text-primary">{plan.price}</p>
                    </div>
                    {selectedPlan === key && (
                      <Badge className="bg-primary text-white">Selected</Badge>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        ✓ {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Crown className="mr-2 h-5 w-5 text-primary" />
                  Complete Your Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : clientSecret ? (
                  <Elements 
                    stripe={stripePromise} 
                    options={{ 
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#FF6B35',
                        }
                      }
                    }}
                  >
                    <SubscribeForm 
                      plan={plans[selectedPlan].name}
                      planPrice={plans[selectedPlan].price}
                    />
                  </Elements>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Select a plan to continue
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>🔒 Your payment information is secure and encrypted.</p>
          <p>Cancel anytime from your account settings.</p>
        </div>
      </div>
    </div>
  );
}
