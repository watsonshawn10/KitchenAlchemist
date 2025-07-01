import {
  users,
  recipes,
  ingredientSuggestions,
  recipeCollections,
  recipeCollectionItems,
  shoppingLists,
  shoppingListItems,
  pantryItems,
  cookingHistory,
  type User,
  type UpsertUser,
  type Recipe,
  type InsertRecipe,
  type IngredientSuggestion,
  type InsertIngredientSuggestion,
  type RecipeCollection,
  type InsertRecipeCollection,
  type ShoppingList,
  type InsertShoppingList,
  type ShoppingListItem,
  type InsertShoppingListItem,
  type PantryItem,
  type InsertPantryItem,
  type CookingHistory,
  type InsertCookingHistory,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User>;
  updateSubscriptionStatus(userId: string, status: string): Promise<User>;
  resetMonthlyUsage(userId: string): Promise<User>;
  incrementRecipeCount(userId: string): Promise<User>;
  updateDietaryRestrictions(userId: string, restrictions: string[]): Promise<User>;
  
  // Recipe operations
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  getUserRecipes(userId: string): Promise<Recipe[]>;
  getRecipe(id: number): Promise<Recipe | undefined>;
  updateRecipe(id: number, updates: Partial<InsertRecipe>): Promise<Recipe>;
  deleteRecipe(id: number): Promise<void>;
  saveRecipe(id: number, userId: string): Promise<Recipe>;
  
  // Ingredient suggestions
  getIngredientSuggestions(query?: string): Promise<IngredientSuggestion[]>;
  createIngredientSuggestion(suggestion: InsertIngredientSuggestion): Promise<IngredientSuggestion>;

  // Recipe collections
  getUserCollections(userId: string): Promise<RecipeCollection[]>;
  createCollection(collection: InsertRecipeCollection): Promise<RecipeCollection>;
  updateCollection(id: number, updates: Partial<InsertRecipeCollection>): Promise<RecipeCollection>;
  deleteCollection(id: number): Promise<void>;
  addRecipeToCollection(collectionId: number, recipeId: number): Promise<void>;
  removeRecipeFromCollection(collectionId: number, recipeId: number): Promise<void>;
  getCollectionRecipes(collectionId: number): Promise<Recipe[]>;

  // Shopping lists
  getUserShoppingLists(userId: string): Promise<ShoppingList[]>;
  createShoppingList(list: InsertShoppingList): Promise<ShoppingList>;
  updateShoppingList(id: number, updates: Partial<InsertShoppingList>): Promise<ShoppingList>;
  deleteShoppingList(id: number): Promise<void>;
  getShoppingListItems(listId: number): Promise<ShoppingListItem[]>;
  addShoppingListItem(item: InsertShoppingListItem): Promise<ShoppingListItem>;
  updateShoppingListItem(id: number, updates: Partial<InsertShoppingListItem>): Promise<ShoppingListItem>;
  deleteShoppingListItem(id: number): Promise<void>;
  generateShoppingListFromRecipes(userId: string, recipeIds: number[], listName: string): Promise<ShoppingList>;

  // Pantry management
  getUserPantryItems(userId: string): Promise<PantryItem[]>;
  createPantryItem(item: InsertPantryItem): Promise<PantryItem>;
  updatePantryItem(id: number, updates: Partial<InsertPantryItem>): Promise<PantryItem>;
  deletePantryItem(id: number): Promise<void>;
  getExpiringItems(userId: string, days: number): Promise<PantryItem[]>;

  // Cooking history & analytics
  getUserCookingHistory(userId: string): Promise<CookingHistory[]>;
  addCookingHistory(history: InsertCookingHistory): Promise<CookingHistory>;
  updateCookingHistory(id: number, updates: Partial<InsertCookingHistory>): Promise<CookingHistory>;
  getCookingAnalytics(userId: string): Promise<{
    totalRecipesCooked: number;
    averageRating: number;
    favoriteCuisines: string[];
    cookingFrequency: { month: string; count: number }[];
    topRatedRecipes: Recipe[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateSubscriptionStatus(userId: string, status: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        subscriptionStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async resetMonthlyUsage(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        monthlyRecipeCount: 0,
        lastResetDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async incrementRecipeCount(userId: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    // Check if we need to reset monthly count
    const now = new Date();
    const lastReset = user.lastResetDate ? new Date(user.lastResetDate) : new Date();
    const monthsDiff = (now.getFullYear() - lastReset.getFullYear()) * 12 + (now.getMonth() - lastReset.getMonth());

    let newCount = user.monthlyRecipeCount || 0;
    let resetDate = user.lastResetDate;

    if (monthsDiff >= 1) {
      newCount = 1; // Reset to 1 (this recipe)
      resetDate = now;
    } else {
      newCount += 1;
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        monthlyRecipeCount: newCount,
        lastResetDate: resetDate,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateDietaryRestrictions(userId: string, restrictions: string[]): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        dietaryRestrictions: restrictions,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Recipe operations
  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const [newRecipe] = await db
      .insert(recipes)
      .values(recipe)
      .returning();
    return newRecipe;
  }

  async getUserRecipes(userId: string): Promise<Recipe[]> {
    return await db
      .select()
      .from(recipes)
      .where(eq(recipes.userId, userId))
      .orderBy(desc(recipes.createdAt));
  }

  async getRecipe(id: number): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe;
  }

  async updateRecipe(id: number, updates: Partial<InsertRecipe>): Promise<Recipe> {
    const [recipe] = await db
      .update(recipes)
      .set(updates)
      .where(eq(recipes.id, id))
      .returning();
    return recipe;
  }

  async deleteRecipe(id: number): Promise<void> {
    await db.delete(recipes).where(eq(recipes.id, id));
  }

  async saveRecipe(id: number, userId: string): Promise<Recipe> {
    const [recipe] = await db
      .update(recipes)
      .set({ isSaved: true })
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
      .returning();
    return recipe;
  }

  // Ingredient suggestions
  async getIngredientSuggestions(query?: string): Promise<IngredientSuggestion[]> {
    if (query) {
      return await db
        .select()
        .from(ingredientSuggestions)
        .where(eq(ingredientSuggestions.name, query))
        .limit(10);
    }
    return await db.select().from(ingredientSuggestions).limit(50);
  }

  async createIngredientSuggestion(suggestion: InsertIngredientSuggestion): Promise<IngredientSuggestion> {
    const [newSuggestion] = await db
      .insert(ingredientSuggestions)
      .values(suggestion)
      .returning();
    return newSuggestion;
  }

  // Recipe collections implementation
  async getUserCollections(userId: string): Promise<RecipeCollection[]> {
    const collections = await db
      .select()
      .from(recipeCollections)
      .where(eq(recipeCollections.userId, userId))
      .orderBy(recipeCollections.createdAt);
    return collections;
  }

  async createCollection(collection: InsertRecipeCollection): Promise<RecipeCollection> {
    const [created] = await db
      .insert(recipeCollections)
      .values(collection)
      .returning();
    return created;
  }

  async updateCollection(id: number, updates: Partial<InsertRecipeCollection>): Promise<RecipeCollection> {
    const [updated] = await db
      .update(recipeCollections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(recipeCollections.id, id))
      .returning();
    return updated;
  }

  async deleteCollection(id: number): Promise<void> {
    await db.delete(recipeCollections).where(eq(recipeCollections.id, id));
  }

  async addRecipeToCollection(collectionId: number, recipeId: number): Promise<void> {
    await db
      .insert(recipeCollectionItems)
      .values({ collectionId, recipeId })
      .onConflictDoNothing();
  }

  async removeRecipeFromCollection(collectionId: number, recipeId: number): Promise<void> {
    await db
      .delete(recipeCollectionItems)
      .where(
        and(
          eq(recipeCollectionItems.collectionId, collectionId),
          eq(recipeCollectionItems.recipeId, recipeId)
        )
      );
  }

  async getCollectionRecipes(collectionId: number): Promise<Recipe[]> {
    const result = await db
      .select({
        recipe: recipes,
      })
      .from(recipeCollectionItems)
      .innerJoin(recipes, eq(recipeCollectionItems.recipeId, recipes.id))
      .where(eq(recipeCollectionItems.collectionId, collectionId))
      .orderBy(recipeCollectionItems.addedAt);
    
    return result.map(r => r.recipe);
  }

  // Shopping lists implementation
  async getUserShoppingLists(userId: string): Promise<ShoppingList[]> {
    const lists = await db
      .select()
      .from(shoppingLists)
      .where(eq(shoppingLists.userId, userId))
      .orderBy(desc(shoppingLists.createdAt));
    return lists;
  }

  async createShoppingList(list: InsertShoppingList): Promise<ShoppingList> {
    const [created] = await db
      .insert(shoppingLists)
      .values(list)
      .returning();
    return created;
  }

  async updateShoppingList(id: number, updates: Partial<InsertShoppingList>): Promise<ShoppingList> {
    const [updated] = await db
      .update(shoppingLists)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(shoppingLists.id, id))
      .returning();
    return updated;
  }

  async deleteShoppingList(id: number): Promise<void> {
    await db.delete(shoppingLists).where(eq(shoppingLists.id, id));
  }

  async getShoppingListItems(listId: number): Promise<ShoppingListItem[]> {
    const items = await db
      .select()
      .from(shoppingListItems)
      .where(eq(shoppingListItems.listId, listId))
      .orderBy(shoppingListItems.category, shoppingListItems.name);
    return items;
  }

  async addShoppingListItem(item: InsertShoppingListItem): Promise<ShoppingListItem> {
    const [created] = await db
      .insert(shoppingListItems)
      .values(item)
      .returning();
    return created;
  }

  async updateShoppingListItem(id: number, updates: Partial<InsertShoppingListItem>): Promise<ShoppingListItem> {
    const [updated] = await db
      .update(shoppingListItems)
      .set(updates)
      .where(eq(shoppingListItems.id, id))
      .returning();
    return updated;
  }

  async deleteShoppingListItem(id: number): Promise<void> {
    await db.delete(shoppingListItems).where(eq(shoppingListItems.id, id));
  }

  async generateShoppingListFromRecipes(userId: string, recipeIds: number[], listName: string): Promise<ShoppingList> {
    // Create the shopping list
    const [list] = await db
      .insert(shoppingLists)
      .values({ userId, name: listName })
      .returning();

    // Get all ingredients from the selected recipes
    const selectedRecipes = await db
      .select()
      .from(recipes)
      .where(inArray(recipes.id, recipeIds));

    // Combine and categorize ingredients
    const ingredientMap = new Map<string, { amount: string; unit: string; category: string; recipeId: number }>();
    
    for (const recipe of selectedRecipes) {
      const ingredients = JSON.parse(recipe.ingredients as string);
      for (const ingredient of ingredients) {
        const key = ingredient.name.toLowerCase();
        if (ingredientMap.has(key)) {
          // Combine amounts if same ingredient (simplified logic)
          const existing = ingredientMap.get(key)!;
          existing.amount = `${existing.amount} + ${ingredient.amount}`;
        } else {
          ingredientMap.set(key, {
            amount: ingredient.amount,
            unit: ingredient.unit,
            category: this.categorizeIngredient(ingredient.name),
            recipeId: recipe.id
          });
        }
      }
    }

    // Add all ingredients to the shopping list
    const itemsToInsert = Array.from(ingredientMap.entries()).map(([name, details]) => ({
      listId: list.id,
      name: name,
      amount: details.amount,
      unit: details.unit,
      category: details.category,
      recipeId: details.recipeId,
      isChecked: false,
    }));

    if (itemsToInsert.length > 0) {
      await db.insert(shoppingListItems).values(itemsToInsert);
    }

    return list;
  }

  private categorizeIngredient(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('milk') || lowerName.includes('cheese') || lowerName.includes('yogurt') || lowerName.includes('butter')) return 'dairy';
    if (lowerName.includes('chicken') || lowerName.includes('beef') || lowerName.includes('pork') || lowerName.includes('fish') || lowerName.includes('turkey')) return 'meat';
    if (lowerName.includes('lettuce') || lowerName.includes('tomato') || lowerName.includes('onion') || lowerName.includes('carrot') || lowerName.includes('pepper')) return 'produce';
    if (lowerName.includes('bread') || lowerName.includes('pasta') || lowerName.includes('rice') || lowerName.includes('flour')) return 'pantry';
    return 'other';
  }

  // Pantry management implementation
  async getUserPantryItems(userId: string): Promise<PantryItem[]> {
    const items = await db
      .select()
      .from(pantryItems)
      .where(eq(pantryItems.userId, userId))
      .orderBy(pantryItems.category, pantryItems.name);
    return items;
  }

  async createPantryItem(item: InsertPantryItem): Promise<PantryItem> {
    const [created] = await db
      .insert(pantryItems)
      .values(item)
      .returning();
    return created;
  }

  async updatePantryItem(id: number, updates: Partial<InsertPantryItem>): Promise<PantryItem> {
    const [updated] = await db
      .update(pantryItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pantryItems.id, id))
      .returning();
    return updated;
  }

  async deletePantryItem(id: number): Promise<void> {
    await db.delete(pantryItems).where(eq(pantryItems.id, id));
  }

  async getExpiringItems(userId: string, days: number): Promise<PantryItem[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    const items = await db
      .select()
      .from(pantryItems)
      .where(
        and(
          eq(pantryItems.userId, userId),
          lte(pantryItems.expiryDate, futureDate)
        )
      )
      .orderBy(pantryItems.expiryDate);
    return items;
  }

  // Cooking history & analytics implementation
  async getUserCookingHistory(userId: string): Promise<CookingHistory[]> {
    const history = await db
      .select()
      .from(cookingHistory)
      .where(eq(cookingHistory.userId, userId))
      .orderBy(desc(cookingHistory.cookedAt));
    return history;
  }

  async addCookingHistory(history: InsertCookingHistory): Promise<CookingHistory> {
    const [created] = await db
      .insert(cookingHistory)
      .values(history)
      .returning();
    return created;
  }

  async updateCookingHistory(id: number, updates: Partial<InsertCookingHistory>): Promise<CookingHistory> {
    const [updated] = await db
      .update(cookingHistory)
      .set(updates)
      .where(eq(cookingHistory.id, id))
      .returning();
    return updated;
  }

  async getCookingAnalytics(userId: string): Promise<{
    totalRecipesCooked: number;
    averageRating: number;
    favoriteCuisines: string[];
    cookingFrequency: { month: string; count: number }[];
    topRatedRecipes: Recipe[];
  }> {
    // Get all cooking history for user
    const history = await db
      .select({
        history: cookingHistory,
        recipe: recipes,
      })
      .from(cookingHistory)
      .innerJoin(recipes, eq(cookingHistory.recipeId, recipes.id))
      .where(eq(cookingHistory.userId, userId));

    const totalRecipesCooked = history.length;
    
    // Calculate average rating
    const ratingsSum = history.reduce((sum, h) => sum + (h.history.rating || 0), 0);
    const averageRating = totalRecipesCooked > 0 ? ratingsSum / totalRecipesCooked : 0;

    // Get favorite cuisines (simplified - would need cuisine data in recipes)
    const favoriteCuisines = ['Italian', 'Mexican', 'Asian']; // Placeholder

    // Calculate cooking frequency by month
    const monthlyCount = new Map<string, number>();
    history.forEach(h => {
      if (h.history.cookedAt) {
        const month = h.history.cookedAt.toISOString().substring(0, 7); // YYYY-MM
        monthlyCount.set(month, (monthlyCount.get(month) || 0) + 1);
      }
    });
    
    const cookingFrequency = Array.from(monthlyCount.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Get top rated recipes
    const topRatedRecipes = history
      .filter(h => h.history.rating && h.history.rating >= 4)
      .sort((a, b) => (b.history.rating || 0) - (a.history.rating || 0))
      .slice(0, 5)
      .map(h => h.recipe);

    return {
      totalRecipesCooked,
      averageRating,
      favoriteCuisines,
      cookingFrequency,
      topRatedRecipes,
    };
  }
}

export const storage = new DatabaseStorage();
