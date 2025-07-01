import {
  users,
  recipes,
  ingredientSuggestions,
  type User,
  type UpsertUser,
  type Recipe,
  type InsertRecipe,
  type IngredientSuggestion,
  type InsertIngredientSuggestion,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User>;
  updateSubscriptionStatus(userId: string, status: string): Promise<User>;
  resetMonthlyUsage(userId: string): Promise<User>;
  incrementRecipeCount(userId: string): Promise<User>;
  
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
}

export const storage = new DatabaseStorage();
