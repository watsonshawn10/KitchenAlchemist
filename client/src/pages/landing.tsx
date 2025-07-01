import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Utensils, Star, Clock, Users, CheckCircle } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

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
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-700 hover:text-primary transition-colors">Home</a>
              <a href="#features" className="text-gray-700 hover:text-primary transition-colors">Features</a>
              <a href="#pricing" className="text-gray-700 hover:text-primary transition-colors">Pricing</a>
            </div>
            <Button onClick={handleLogin} className="bg-primary hover:bg-primary/90">
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="bg-gradient-warm py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-playfair font-bold text-gray-900 mb-6">
              Turn Your Ingredients Into<br />
              <span className="text-primary">Culinary Magic</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              AI-powered recipe discovery that transforms whatever you have in your kitchen into delicious, step-by-step guided meals.
            </p>
            <Button onClick={handleLogin} size="lg" className="bg-primary hover:bg-primary/90 text-white px-12 py-4 text-lg">
              <Utensils className="mr-3 h-5 w-5" />
              Start Cooking with AI
            </Button>
            <p className="text-sm text-gray-500 mt-3">✨ Get 2 free recipes every month</p>
          </div>

          {/* Feature Preview */}
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-xl">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                  Simply add your ingredients and let AI do the magic
                </h3>
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <div className="flex flex-wrap gap-3">
                    <span className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      Chicken Breast
                    </span>
                    <span className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      Tomatoes
                    </span>
                    <span className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      Onions
                    </span>
                    <span className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      Garlic
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <Button onClick={handleLogin} className="bg-primary hover:bg-primary/90">
                    Generate AI Recipes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-playfair font-bold text-gray-900 mb-6">
              Why Choose ChefAI?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of cooking with our AI-powered platform designed for every home chef.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-8">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Utensils className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">AI-Powered Recipes</h3>
                <p className="text-gray-600">
                  Our advanced AI creates personalized recipes based on your available ingredients, dietary preferences, and cooking style.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-8">
                <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Step-by-Step Guidance</h3>
                <p className="text-gray-600">
                  Clear, detailed instructions with timing and tips to ensure your dishes turn out perfect every time.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-8">
                <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Save & Organize</h3>
                <p className="text-gray-600">
                  Keep your favorite recipes organized and easily accessible. Build your personal cookbook over time.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
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
                <Button onClick={handleLogin} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700">
                  Get Started Free
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
                </ul>
                <Button onClick={handleLogin} className="w-full bg-primary hover:bg-primary/90 text-white">
                  Start Pro Trial
                </Button>
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
                    <span className="text-gray-600">Priority support</span>
                  </li>
                </ul>
                <Button onClick={handleLogin} className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white">
                  Start Master Trial
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <Utensils className="text-primary text-2xl mr-3" />
                <h3 className="text-2xl font-playfair font-bold">ChefAI</h3>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Transform your ingredients into culinary masterpieces with the power of AI. Discover new flavors, learn new techniques, and become the chef you've always wanted to be.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ChefAI. All rights reserved. Made with ❤️ for food lovers everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
