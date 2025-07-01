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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check usage limits for free users
      if (user.subscriptionStatus === "free") {
        const now = new Date();
        const lastReset = user.lastResetDate ? new Date(user.lastResetDate) : new Date();
        const monthsDiff = (now.getFullYear() - lastReset.getFullYear()) * 12 + (now.getMonth() - lastReset.getMonth());
        
        let currentCount = user.monthlyRecipeCount || 0;
        if (monthsDiff >= 1) {
          currentCount = 0; // Reset count if it's a new month
        }

        if (currentCount >= 2) {
          return res.status(403).json({ 
            message: "Monthly recipe limit reached. Upgrade to Pro for unlimited recipes.",
            limitReached: true
          });
        }
      }

      const { ingredients } = generateRecipesSchema.parse(req.body);
      
      // Generate recipes using OpenAI with user's dietary restrictions
      const generatedRecipes = await generateRecipes(ingredients, user.dietaryRestrictions || []);
      
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

  const httpServer = createServer(app);
  return httpServer;
}
