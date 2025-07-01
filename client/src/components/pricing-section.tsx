import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Crown } from "lucide-react";
import { Link } from "wouter";

interface PricingSectionProps {
  currentPlan: string;
}

export default function PricingSection({ currentPlan }: PricingSectionProps) {
  return (
    <section id="pricing" className="bg-gradient-warm py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-playfair font-bold text-gray-900 mb-6">
            Choose Your Culinary Journey
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From curious cook to culinary master, we have the perfect plan to fuel your kitchen adventures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card className="border border-gray-100">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Free Explorer</h3>
                <div className="text-4xl font-playfair font-bold text-gray-900 mb-2">
                  $0<span className="text-lg font-normal text-gray-500">/month</span>
                </div>
                <p className="text-gray-600">Perfect for trying out AI recipes</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="text-success mr-3 h-5 w-5" />
                  <span className="text-gray-600">2 AI recipes per month</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-success mr-3 h-5 w-5" />
                  <span className="text-gray-600">Basic ingredient matching</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-success mr-3 h-5 w-5" />
                  <span className="text-gray-600">Step-by-step instructions</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                disabled={currentPlan === "free"}
              >
                {currentPlan === "free" ? "Current Plan" : "Downgrade"}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="border-2 border-primary relative transform scale-105 shadow-xl">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-white px-6 py-2 rounded-full text-sm font-semibold">
                Most Popular
              </span>
            </div>
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Pro Chef</h3>
                <div className="text-4xl font-playfair font-bold text-primary mb-2">
                  $9.99<span className="text-lg font-normal text-gray-500">/month</span>
                </div>
                <p className="text-gray-600">For serious cooking enthusiasts</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="text-success mr-3 h-5 w-5" />
                  <span className="text-gray-600">Unlimited AI recipes</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-success mr-3 h-5 w-5" />
                  <span className="text-gray-600">Advanced ingredient matching</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-success mr-3 h-5 w-5" />
                  <span className="text-gray-600">Recipe saving & organization</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-success mr-3 h-5 w-5" />
                  <span className="text-gray-600">Dietary preference filters</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-success mr-3 h-5 w-5" />
                  <span className="text-gray-600">Nutritional information</span>
                </li>
              </ul>
              <Link href="/subscribe">
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  disabled={currentPlan === "pro"}
                >
                  {currentPlan === "pro" ? (
                    <>
                      <Crown className="mr-2 h-4 w-4" />
                      Current Plan
                    </>
                  ) : (
                    "Upgrade to Pro"
                  )}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="border border-gray-100">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Master Chef</h3>
                <div className="text-4xl font-playfair font-bold text-gray-900 mb-2">
                  $19.99<span className="text-lg font-normal text-gray-500">/month</span>
                </div>
                <p className="text-gray-600">Ultimate culinary experience</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="text-success mr-3 h-5 w-5" />
                  <span className="text-gray-600">Everything in Pro</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-success mr-3 h-5 w-5" />
                  <span className="text-gray-600">AI meal planning</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-success mr-3 h-5 w-5" />
                  <span className="text-gray-600">Shopping list generation</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-success mr-3 h-5 w-5" />
                  <span className="text-gray-600">Video cooking tutorials</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-success mr-3 h-5 w-5" />
                  <span className="text-gray-600">Priority support</span>
                </li>
              </ul>
              <Link href="/subscribe">
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white"
                  disabled={currentPlan === "premium"}
                >
                  {currentPlan === "premium" ? (
                    <>
                      <Crown className="mr-2 h-4 w-4" />
                      Current Plan
                    </>
                  ) : (
                    "Upgrade to Master"
                  )}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
