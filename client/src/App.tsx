import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Subscribe from "@/pages/subscribe";
import Settings from "@/pages/settings";
import Collections from "@/pages/collections";
import ShoppingLists from "@/pages/shopping-lists";
import Pantry from "@/pages/pantry";
import Analytics from "@/pages/analytics";
import Equipment from "@/pages/equipment";
import Nutrition from "@/pages/nutrition";
import Costs from "@/pages/costs";
import Grocery from "@/pages/grocery";
import BudgetMealPlanner from "@/pages/budget-meal-planner";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/settings" component={Settings} />
          <Route path="/collections" component={Collections} />
          <Route path="/shopping-lists" component={ShoppingLists} />
          <Route path="/pantry" component={Pantry} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/equipment" component={Equipment} />
          <Route path="/nutrition" component={Nutrition} />
          <Route path="/costs" component={Costs} />
          <Route path="/grocery" component={Grocery} />
          <Route path="/budget-meal-planner" component={BudgetMealPlanner} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
