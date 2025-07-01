import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("free"), // free, pro, premium
  monthlyRecipeCount: integer("monthly_recipe_count").default(0),
  lastResetDate: timestamp("last_reset_date").defaultNow(),
  dietaryRestrictions: text("dietary_restrictions").array().default([]), // array of dietary restrictions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  ingredients: jsonb("ingredients").notNull(), // array of ingredient objects
  instructions: jsonb("instructions").notNull(), // array of step objects
  cookingTime: integer("cooking_time").notNull(), // in minutes
  servings: integer("servings").notNull(),
  difficulty: varchar("difficulty").notNull(), // easy, medium, hard
  imageUrl: text("image_url"),
  rating: integer("rating").default(0),
  isSaved: boolean("is_saved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ingredientSuggestions = pgTable("ingredient_suggestions", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  category: varchar("category").notNull(), // protein, vegetable, grain, dairy, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Recipe Collections
export const recipeCollections = pgTable("recipe_collections", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Recipe Collection Items (many-to-many)
export const recipeCollectionItems = pgTable("recipe_collection_items", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").notNull().references(() => recipeCollections.id, { onDelete: "cascade" }),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at").defaultNow(),
});

// Shopping Lists
export const shoppingLists = pgTable("shopping_lists", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shopping List Items
export const shoppingListItems = pgTable("shopping_list_items", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").notNull().references(() => shoppingLists.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  amount: varchar("amount"),
  unit: varchar("unit"),
  category: varchar("category").default("other"), // produce, dairy, meat, pantry, etc.
  isChecked: boolean("is_checked").default(false),
  recipeId: integer("recipe_id").references(() => recipes.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pantry Items
export const pantryItems = pgTable("pantry_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  category: varchar("category").notNull(),
  amount: varchar("amount"),
  unit: varchar("unit"),
  expiryDate: timestamp("expiry_date"),
  isStaple: boolean("is_staple").default(false), // frequently used items
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cooking History
export const cookingHistory = pgTable("cooking_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  rating: integer("rating"), // 1-5 stars
  notes: text("notes"),
  cookingTime: integer("cooking_time"), // actual time taken
  difficulty: varchar("difficulty"), // how user found it
  wouldMakeAgain: boolean("would_make_again"),
  cookedAt: timestamp("cooked_at").defaultNow(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  createdAt: true,
});

export const insertIngredientSuggestionSchema = createInsertSchema(ingredientSuggestions).omit({
  id: true,
  createdAt: true,
});

export const insertRecipeCollectionSchema = createInsertSchema(recipeCollections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShoppingListSchema = createInsertSchema(shoppingLists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShoppingListItemSchema = createInsertSchema(shoppingListItems).omit({
  id: true,
  createdAt: true,
});

export const insertPantryItemSchema = createInsertSchema(pantryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCookingHistorySchema = createInsertSchema(cookingHistory).omit({
  id: true,
  cookedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;
export type InsertIngredientSuggestion = z.infer<typeof insertIngredientSuggestionSchema>;
export type IngredientSuggestion = typeof ingredientSuggestions.$inferSelect;
export type InsertRecipeCollection = z.infer<typeof insertRecipeCollectionSchema>;
export type RecipeCollection = typeof recipeCollections.$inferSelect;
export type InsertShoppingList = z.infer<typeof insertShoppingListSchema>;
export type ShoppingList = typeof shoppingLists.$inferSelect;
export type InsertShoppingListItem = z.infer<typeof insertShoppingListItemSchema>;
export type ShoppingListItem = typeof shoppingListItems.$inferSelect;
export type InsertPantryItem = z.infer<typeof insertPantryItemSchema>;
export type PantryItem = typeof pantryItems.$inferSelect;
export type InsertCookingHistory = z.infer<typeof insertCookingHistorySchema>;
export type CookingHistory = typeof cookingHistory.$inferSelect;
