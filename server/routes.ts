import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateRecipes, generateRecipeImage } from "./openai";
import { insertRecipeSchema } from "@shared/schema";
import { z } from "zod";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
}) : null;

const generateRecipesSchema = z.object({
  ingredients: z.array(z.string()).min(1, "At least one ingredient is required"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update dietary restrictions
  app.put('/api/user/dietary-restrictions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { restrictions } = req.body;
      
      if (!Array.isArray(restrictions)) {
        return res.status(400).json({ message: "Restrictions must be an array" });
      }

      const user = await storage.updateDietaryRestrictions(userId, restrictions);
      res.json(user);
    } catch (error) {
      console.error("Error updating dietary restrictions:", error);
      res.status(500).json({ message: "Failed to update dietary restrictions" });
    }
  });

  // Recipe generation endpoint
  app.post("/api/generate-recipes", isAuthenticated, async (req: any, res) => {
    try {
      console.log("Starting recipe generation for user:", req.user.claims.sub);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        console.log("User not found:", userId);
        return res.status(404).json({ message: "User not found" });
      }

      console.log("User found:", user.email, "subscription:", user.subscriptionStatus);

      // Check usage limits for free users
      if (user.subscriptionStatus === "free") {
        const now = new Date();
        const lastReset = user.lastResetDate ? new Date(user.lastResetDate) : new Date();
        const monthsDiff = (now.getFullYear() - lastReset.getFullYear()) * 12 + (now.getMonth() - lastReset.getMonth());
        
        let currentCount = user.monthlyRecipeCount || 0;
        if (monthsDiff >= 1) {
          currentCount = 0; // Reset count if it's a new month
        }

        console.log("Free user usage check - current count:", currentCount, "months diff:", monthsDiff);

        if (currentCount >= 2) {
          console.log("Usage limit reached for free user");
          return res.status(403).json({ 
            message: "Monthly recipe limit reached. Upgrade to Pro for unlimited recipes.",
            limitReached: true
          });
        }
      }

      const { ingredients } = generateRecipesSchema.parse(req.body);
      console.log("Generating recipes with ingredients:", ingredients, "dietary restrictions:", user.dietaryRestrictions);
      
      // Generate recipes using OpenAI with user's dietary restrictions
      const generatedRecipes = await generateRecipes(ingredients, user.dietaryRestrictions || []);
      console.log("Successfully generated", generatedRecipes.length, "recipes");
      
      // Save recipes to database and increment usage
      const savedRecipes = [];
      for (const recipe of generatedRecipes) {
        // Generate image for recipe (optional)
        let imageUrl = "";
        try {
          imageUrl = await generateRecipeImage(recipe.title, ingredients);
        } catch (error) {
          console.warn("Failed to generate image for recipe:", recipe.title);
        }

        const savedRecipe = await storage.createRecipe({
          userId,
          title: recipe.title,
          description: recipe.description,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          cookingTime: recipe.cookingTime,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          imageUrl,
          rating: recipe.rating,
          isSaved: false,
        });
        savedRecipes.push(savedRecipe);
      }

      // Increment usage count
      await storage.incrementRecipeCount(userId);

      res.json({ recipes: savedRecipes });
    } catch (error) {
      console.error("Error generating recipes:", error);
      res.status(500).json({ message: "Failed to generate recipes: " + (error as Error).message });
    }
  });

  // Get user's recipes
  app.get("/api/recipes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recipes = await storage.getUserRecipes(userId);
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  // Get single recipe
  app.get("/api/recipes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const recipeId = parseInt(req.params.id);
      const recipe = await storage.getRecipe(recipeId);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      // Check if user owns this recipe
      const userId = req.user.claims.sub;
      if (recipe.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(recipe);
    } catch (error) {
      console.error("Error fetching recipe:", error);
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  // Save recipe
  app.post("/api/recipes/:id/save", isAuthenticated, async (req: any, res) => {
    try {
      const recipeId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const recipe = await storage.saveRecipe(recipeId, userId);
      res.json(recipe);
    } catch (error) {
      console.error("Error saving recipe:", error);
      res.status(500).json({ message: "Failed to save recipe" });
    }
  });

  // Delete recipe
  app.delete("/api/recipes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const recipeId = parseInt(req.params.id);
      const recipe = await storage.getRecipe(recipeId);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      // Check if user owns this recipe
      const userId = req.user.claims.sub;
      if (recipe.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteRecipe(recipeId);
      res.json({ message: "Recipe deleted successfully" });
    } catch (error) {
      console.error("Error deleting recipe:", error);
      res.status(500).json({ message: "Failed to delete recipe" });
    }
  });

  // Get ingredient suggestions
  app.get("/api/ingredients/suggestions", async (req, res) => {
    try {
      const query = req.query.q as string;
      const suggestions = await storage.getIngredientSuggestions(query);
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching ingredient suggestions:", error);
      res.status(500).json({ message: "Failed to fetch suggestions" });
    }
  });

  // Stripe subscription route
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ 
        message: "Payment processing is currently unavailable. Please configure Stripe keys to enable subscriptions.",
        error: "STRIPE_NOT_CONFIGURED"
      });
    }

    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { priceId } = req.body; // pro or premium price ID

      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        res.json({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
        return;
      }
      
      if (!user.email) {
        return res.status(400).json({ message: 'No user email on file' });
      }

      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      });

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: priceId, // This should be set by the client (pro/premium price ID)
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(userId, customer.id, subscription.id);
  
      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      return res.status(400).json({ message: error.message });
    }
  });

  // Stripe webhook for subscription updates
  app.post('/api/stripe/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
    } catch (err: any) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        // Update user subscription status based on subscription status
        const status = subscription.status === 'active' ? 'pro' : 'free';
        // You would need to find the user by stripeSubscriptionId and update their status
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  // RECIPE COLLECTIONS API
  app.get('/api/collections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const collections = await storage.getUserCollections(userId);
      res.json(collections);
    } catch (error) {
      console.error("Error fetching collections:", error);
      res.status(500).json({ message: "Failed to fetch collections" });
    }
  });

  app.post('/api/collections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const collection = await storage.createCollection({
        ...req.body,
        userId,
      });
      res.json(collection);
    } catch (error) {
      console.error("Error creating collection:", error);
      res.status(500).json({ message: "Failed to create collection" });
    }
  });

  app.put('/api/collections/:id', isAuthenticated, async (req: any, res) => {
    try {
      const collection = await storage.updateCollection(
        parseInt(req.params.id),
        req.body
      );
      res.json(collection);
    } catch (error) {
      console.error("Error updating collection:", error);
      res.status(500).json({ message: "Failed to update collection" });
    }
  });

  app.delete('/api/collections/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteCollection(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting collection:", error);
      res.status(500).json({ message: "Failed to delete collection" });
    }
  });

  app.post('/api/collections/:id/recipes/:recipeId', isAuthenticated, async (req: any, res) => {
    try {
      await storage.addRecipeToCollection(
        parseInt(req.params.id),
        parseInt(req.params.recipeId)
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding recipe to collection:", error);
      res.status(500).json({ message: "Failed to add recipe to collection" });
    }
  });

  app.delete('/api/collections/:id/recipes/:recipeId', isAuthenticated, async (req: any, res) => {
    try {
      await storage.removeRecipeFromCollection(
        parseInt(req.params.id),
        parseInt(req.params.recipeId)
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing recipe from collection:", error);
      res.status(500).json({ message: "Failed to remove recipe from collection" });
    }
  });

  app.get('/api/collections/:id/recipes', isAuthenticated, async (req: any, res) => {
    try {
      const recipes = await storage.getCollectionRecipes(parseInt(req.params.id));
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching collection recipes:", error);
      res.status(500).json({ message: "Failed to fetch collection recipes" });
    }
  });

  // SHOPPING LISTS API
  app.get('/api/shopping-lists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const lists = await storage.getUserShoppingLists(userId);
      res.json(lists);
    } catch (error) {
      console.error("Error fetching shopping lists:", error);
      res.status(500).json({ message: "Failed to fetch shopping lists" });
    }
  });

  app.post('/api/shopping-lists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const list = await storage.createShoppingList({
        ...req.body,
        userId,
      });
      res.json(list);
    } catch (error) {
      console.error("Error creating shopping list:", error);
      res.status(500).json({ message: "Failed to create shopping list" });
    }
  });

  app.put('/api/shopping-lists/:id', isAuthenticated, async (req: any, res) => {
    try {
      const list = await storage.updateShoppingList(
        parseInt(req.params.id),
        req.body
      );
      res.json(list);
    } catch (error) {
      console.error("Error updating shopping list:", error);
      res.status(500).json({ message: "Failed to update shopping list" });
    }
  });

  app.delete('/api/shopping-lists/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteShoppingList(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting shopping list:", error);
      res.status(500).json({ message: "Failed to delete shopping list" });
    }
  });

  app.get('/api/shopping-lists/:id/items', isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getShoppingListItems(parseInt(req.params.id));
      res.json(items);
    } catch (error) {
      console.error("Error fetching shopping list items:", error);
      res.status(500).json({ message: "Failed to fetch shopping list items" });
    }
  });

  app.post('/api/shopping-lists/:id/items', isAuthenticated, async (req: any, res) => {
    try {
      const item = await storage.addShoppingListItem({
        ...req.body,
        listId: parseInt(req.params.id),
      });
      res.json(item);
    } catch (error) {
      console.error("Error adding shopping list item:", error);
      res.status(500).json({ message: "Failed to add shopping list item" });
    }
  });

  app.put('/api/shopping-lists/items/:id', isAuthenticated, async (req: any, res) => {
    try {
      const item = await storage.updateShoppingListItem(
        parseInt(req.params.id),
        req.body
      );
      res.json(item);
    } catch (error) {
      console.error("Error updating shopping list item:", error);
      res.status(500).json({ message: "Failed to update shopping list item" });
    }
  });

  app.delete('/api/shopping-lists/items/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteShoppingListItem(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting shopping list item:", error);
      res.status(500).json({ message: "Failed to delete shopping list item" });
    }
  });

  app.post('/api/shopping-lists/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { recipeIds, listName } = req.body;
      const list = await storage.generateShoppingListFromRecipes(userId, recipeIds, listName);
      res.json(list);
    } catch (error) {
      console.error("Error generating shopping list:", error);
      res.status(500).json({ message: "Failed to generate shopping list" });
    }
  });

  // PANTRY MANAGEMENT API
  app.get('/api/pantry', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const items = await storage.getUserPantryItems(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching pantry items:", error);
      res.status(500).json({ message: "Failed to fetch pantry items" });
    }
  });

  app.post('/api/pantry', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const item = await storage.createPantryItem({
        ...req.body,
        userId,
      });
      res.json(item);
    } catch (error) {
      console.error("Error creating pantry item:", error);
      res.status(500).json({ message: "Failed to create pantry item" });
    }
  });

  app.put('/api/pantry/:id', isAuthenticated, async (req: any, res) => {
    try {
      const item = await storage.updatePantryItem(
        parseInt(req.params.id),
        req.body
      );
      res.json(item);
    } catch (error) {
      console.error("Error updating pantry item:", error);
      res.status(500).json({ message: "Failed to update pantry item" });
    }
  });

  app.delete('/api/pantry/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deletePantryItem(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting pantry item:", error);
      res.status(500).json({ message: "Failed to delete pantry item" });
    }
  });

  app.get('/api/pantry/expiring', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const days = parseInt(req.query.days as string) || 7;
      const items = await storage.getExpiringItems(userId, days);
      res.json(items);
    } catch (error) {
      console.error("Error fetching expiring items:", error);
      res.status(500).json({ message: "Failed to fetch expiring items" });
    }
  });

  // COOKING HISTORY & ANALYTICS API
  app.get('/api/cooking-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const history = await storage.getUserCookingHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching cooking history:", error);
      res.status(500).json({ message: "Failed to fetch cooking history" });
    }
  });

  app.post('/api/cooking-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const history = await storage.addCookingHistory({
        ...req.body,
        userId,
      });
      res.json(history);
    } catch (error) {
      console.error("Error adding cooking history:", error);
      res.status(500).json({ message: "Failed to add cooking history" });
    }
  });

  app.put('/api/cooking-history/:id', isAuthenticated, async (req: any, res) => {
    try {
      const history = await storage.updateCookingHistory(
        parseInt(req.params.id),
        req.body
      );
      res.json(history);
    } catch (error) {
      console.error("Error updating cooking history:", error);
      res.status(500).json({ message: "Failed to update cooking history" });
    }
  });

  app.get('/api/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analytics = await storage.getCookingAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Meal Planning routes
  app.get('/api/meal-plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const mealPlans = await storage.getUserMealPlans(userId);
      res.json(mealPlans);
    } catch (error) {
      console.error("Error fetching meal plans:", error);
      res.status(500).json({ message: "Failed to fetch meal plans" });
    }
  });

  app.post('/api/meal-plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const mealPlan = await storage.createMealPlan({
        ...req.body,
        userId,
      });
      res.json(mealPlan);
    } catch (error) {
      console.error("Error creating meal plan:", error);
      res.status(500).json({ message: "Failed to create meal plan" });
    }
  });

  app.get('/api/meal-plans/:id', isAuthenticated, async (req: any, res) => {
    try {
      const mealPlan = await storage.getMealPlan(parseInt(req.params.id));
      if (!mealPlan) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      res.json(mealPlan);
    } catch (error) {
      console.error("Error fetching meal plan:", error);
      res.status(500).json({ message: "Failed to fetch meal plan" });
    }
  });

  app.put('/api/meal-plans/:id', isAuthenticated, async (req: any, res) => {
    try {
      const mealPlan = await storage.updateMealPlan(parseInt(req.params.id), req.body);
      res.json(mealPlan);
    } catch (error) {
      console.error("Error updating meal plan:", error);
      res.status(500).json({ message: "Failed to update meal plan" });
    }
  });

  app.delete('/api/meal-plans/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteMealPlan(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting meal plan:", error);
      res.status(500).json({ message: "Failed to delete meal plan" });
    }
  });

  app.get('/api/meal-plans/:id/meals', isAuthenticated, async (req: any, res) => {
    try {
      const plannedMeals = await storage.getPlannedMeals(parseInt(req.params.id));
      res.json(plannedMeals);
    } catch (error) {
      console.error("Error fetching planned meals:", error);
      res.status(500).json({ message: "Failed to fetch planned meals" });
    }
  });

  app.post('/api/meal-plans/:id/meals', isAuthenticated, async (req: any, res) => {
    try {
      const plannedMeal = await storage.createPlannedMeal({
        ...req.body,
        mealPlanId: parseInt(req.params.id),
      });
      res.json(plannedMeal);
    } catch (error) {
      console.error("Error creating planned meal:", error);
      res.status(500).json({ message: "Failed to create planned meal" });
    }
  });

  // Budget Preferences routes
  app.get('/api/budget-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = await storage.getUserBudgetPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching budget preferences:", error);
      res.status(500).json({ message: "Failed to fetch budget preferences" });
    }
  });

  app.post('/api/budget-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = await storage.createBudgetPreferences({
        ...req.body,
        userId,
      });
      res.json(preferences);
    } catch (error) {
      console.error("Error creating budget preferences:", error);
      res.status(500).json({ message: "Failed to create budget preferences" });
    }
  });

  // Generate Budget-Friendly Meal Plan
  app.post('/api/generate-budget-meal-plan', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { weeklyBudget, dietaryRestrictions } = req.body;
      
      if (!weeklyBudget || weeklyBudget <= 0) {
        return res.status(400).json({ message: "Valid weekly budget is required" });
      }

      const result = await storage.generateBudgetFriendlyMealPlan(
        userId,
        parseFloat(weeklyBudget),
        dietaryRestrictions || []
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error generating budget meal plan:", error);
      res.status(500).json({ message: "Failed to generate budget meal plan" });
    }
  });

  // Optimize Meal Plan Costs
  app.post('/api/meal-plans/:id/optimize', isAuthenticated, async (req: any, res) => {
    try {
      const result = await storage.optimizeMealPlanCosts(parseInt(req.params.id));
      res.json(result);
    } catch (error) {
      console.error("Error optimizing meal plan:", error);
      res.status(500).json({ message: "Failed to optimize meal plan" });
    }
  });

  // Smart Substitutions routes
  app.get('/api/substitutions/:ingredient', isAuthenticated, async (req: any, res) => {
    try {
      const { ingredient } = req.params;
      const { dietaryRestrictions } = req.query;
      
      const restrictions = typeof dietaryRestrictions === 'string' 
        ? dietaryRestrictions.split(',') 
        : [];
      
      const substitutions = await storage.getSmartSubstitutions(ingredient, restrictions);
      res.json(substitutions);
    } catch (error) {
      console.error("Error fetching smart substitutions:", error);
      res.status(500).json({ message: "Failed to fetch smart substitutions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
