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
  decimal,
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

// Kitchen Equipment
export const kitchenEquipment = pgTable("kitchen_equipment", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // instant-pot, air-fryer, slow-cooker, oven, etc.
  brand: varchar("brand"),
  model: varchar("model"),
  capacity: varchar("capacity"),
  features: text("features").array(), // ["pressure-cook", "sauté", "rice", etc.]
  isSmartDevice: boolean("is_smart_device").default(false),
  apiEndpoint: varchar("api_endpoint"), // for smart device integration
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Grocery Stores & Pricing
export const groceryStores = pgTable("grocery_stores", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  chain: varchar("chain"),
  location: varchar("location"),
  apiKey: varchar("api_key"), // for delivery integration
  deliveryAvailable: boolean("delivery_available").default(false),
  minimumOrder: varchar("minimum_order"),
  deliveryFee: varchar("delivery_fee"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ingredient Prices
export const ingredientPrices = pgTable("ingredient_prices", {
  id: serial("id").primaryKey(),
  ingredientName: varchar("ingredient_name").notNull(),
  storeId: integer("store_id").references(() => groceryStores.id, { onDelete: "cascade" }),
  price: varchar("price").notNull(),
  unit: varchar("unit").notNull(), // lb, oz, each, etc.
  packageSize: varchar("package_size"), // "1 lb bag", "6-pack", etc.
  brand: varchar("brand"),
  isOrganic: boolean("is_organic").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Recipe Costs
export const recipeCosts = pgTable("recipe_costs", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  totalCost: varchar("total_cost").notNull(),
  costPerServing: varchar("cost_per_serving").notNull(),
  calculatedAt: timestamp("calculated_at").defaultNow(),
  ingredientCosts: jsonb("ingredient_costs").notNull(), // detailed breakdown
});

// Nutrition Data
export const nutritionData = pgTable("nutrition_data", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  calories: integer("calories"),
  protein: varchar("protein"), // grams
  carbs: varchar("carbs"), // grams
  fat: varchar("fat"), // grams
  fiber: varchar("fiber"), // grams
  sugar: varchar("sugar"), // grams
  sodium: varchar("sodium"), // mg
  cholesterol: varchar("cholesterol"), // mg
  vitaminA: varchar("vitamin_a"), // % daily value
  vitaminC: varchar("vitamin_c"), // % daily value
  calcium: varchar("calcium"), // % daily value
  iron: varchar("iron"), // % daily value
  servings: integer("servings").notNull(),
  calculatedAt: timestamp("calculated_at").defaultNow(),
});

// User Health Goals
export const userHealthGoals = pgTable("user_health_goals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dailyCalories: integer("daily_calories"),
  dailyProtein: varchar("daily_protein"),
  dailyCarbs: varchar("daily_carbs"),
  dailyFat: varchar("daily_fat"),
  dailyFiber: varchar("daily_fiber"),
  maxSodium: varchar("max_sodium"),
  healthConditions: text("health_conditions").array(), // ["diabetes", "hypertension", etc.]
  activityLevel: varchar("activity_level"), // sedentary, light, moderate, active, very-active
  weightGoal: varchar("weight_goal"), // maintain, lose, gain
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily Nutrition Tracking
export const dailyNutritionLog = pgTable("daily_nutrition_log", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  recipeId: integer("recipe_id").references(() => recipes.id, { onDelete: "set null" }),
  mealType: varchar("meal_type").notNull(), // breakfast, lunch, dinner, snack
  servings: varchar("servings").notNull(),
  calories: integer("calories").notNull(),
  protein: varchar("protein").notNull(),
  carbs: varchar("carbs").notNull(),
  fat: varchar("fat").notNull(),
  fiber: varchar("fiber"),
  sodium: varchar("sodium"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Meal Plans
export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  weekStartDate: timestamp("week_start_date").notNull(), // Monday of the planning week
  totalBudget: varchar("total_budget").notNull(), // weekly budget in dollars
  actualCost: varchar("actual_cost").default("0.00"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Planned Meals
export const plannedMeals = pgTable("planned_meals", {
  id: serial("id").primaryKey(),
  mealPlanId: integer("meal_plan_id").notNull().references(() => mealPlans.id, { onDelete: "cascade" }),
  recipeId: integer("recipe_id").references(() => recipes.id, { onDelete: "set null" }),
  mealType: varchar("meal_type").notNull(), // breakfast, lunch, dinner, snack
  scheduledDate: timestamp("scheduled_date").notNull(),
  servings: integer("servings").notNull().default(1),
  estimatedCost: varchar("estimated_cost").default("0.00"),
  actualCost: varchar("actual_cost"),
  isCooked: boolean("is_cooked").default(false),
  rating: integer("rating"), // user rating after cooking
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Budget Preferences
export const budgetPreferences = pgTable("budget_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  weeklyBudget: varchar("weekly_budget").notNull(),
  maxMealCost: varchar("max_meal_cost"), // maximum cost per meal
  priorityIngredients: text("priority_ingredients").array(), // ingredients user prefers to buy organic/premium
  avoidExpensiveItems: boolean("avoid_expensive_items").default(false),
  preferStoreBrands: boolean("prefer_store_brands").default(false),
  bulkBuyingEnabled: boolean("bulk_buying_enabled").default(true),
  seasonalPriorityEnabled: boolean("seasonal_priority_enabled").default(true), // prefer seasonal ingredients
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Smart Substitutions (for budget optimization)
export const smartSubstitutions = pgTable("smart_substitutions", {
  id: serial("id").primaryKey(),
  originalIngredient: varchar("original_ingredient").notNull(),
  substituteIngredient: varchar("substitute_ingredient").notNull(),
  costSavingsPercent: integer("cost_savings_percent"), // percentage saved
  nutritionImpact: varchar("nutrition_impact"), // better, same, slight-loss, significant-loss
  tasteImpact: varchar("taste_impact"), // same, slight-change, different
  dietaryRestrictions: text("dietary_restrictions").array(), // which restrictions this substitution supports
  season: varchar("season"), // when this substitution is most cost-effective
  isVerified: boolean("is_verified").default(false), // community or chef verified
  createdAt: timestamp("created_at").defaultNow(),
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

// New Schema Exports
export const insertKitchenEquipmentSchema = createInsertSchema(kitchenEquipment).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGroceryStoreSchema = createInsertSchema(groceryStores).omit({
  id: true,
  createdAt: true,
});

export const insertIngredientPriceSchema = createInsertSchema(ingredientPrices).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertRecipeCostSchema = createInsertSchema(recipeCosts).omit({
  id: true,
  calculatedAt: true,
});

export const insertNutritionDataSchema = createInsertSchema(nutritionData).omit({
  id: true,
  calculatedAt: true,
});

export const insertUserHealthGoalsSchema = createInsertSchema(userHealthGoals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDailyNutritionLogSchema = createInsertSchema(dailyNutritionLog).omit({
  id: true,
  createdAt: true,
});

export const insertMealPlanSchema = createInsertSchema(mealPlans).omit({
  id: true,
  actualCost: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlannedMealSchema = createInsertSchema(plannedMeals).omit({
  id: true,
  actualCost: true,
  isCooked: true,
  rating: true,
  createdAt: true,
});

export const insertBudgetPreferencesSchema = createInsertSchema(budgetPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSmartSubstitutionSchema = createInsertSchema(smartSubstitutions).omit({
  id: true,
  isVerified: true,
  createdAt: true,
});

export type InsertKitchenEquipment = z.infer<typeof insertKitchenEquipmentSchema>;
export type KitchenEquipment = typeof kitchenEquipment.$inferSelect;

export type InsertGroceryStore = z.infer<typeof insertGroceryStoreSchema>;
export type GroceryStore = typeof groceryStores.$inferSelect;

export type InsertIngredientPrice = z.infer<typeof insertIngredientPriceSchema>;
export type IngredientPrice = typeof ingredientPrices.$inferSelect;

export type InsertRecipeCost = z.infer<typeof insertRecipeCostSchema>;
export type RecipeCost = typeof recipeCosts.$inferSelect;

export type InsertNutritionData = z.infer<typeof insertNutritionDataSchema>;
export type NutritionData = typeof nutritionData.$inferSelect;

export type InsertUserHealthGoals = z.infer<typeof insertUserHealthGoalsSchema>;
export type UserHealthGoals = typeof userHealthGoals.$inferSelect;

export type InsertDailyNutritionLog = z.infer<typeof insertDailyNutritionLogSchema>;
export type DailyNutritionLog = typeof dailyNutritionLog.$inferSelect;

export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;
export type MealPlan = typeof mealPlans.$inferSelect;

export type InsertPlannedMeal = z.infer<typeof insertPlannedMealSchema>;
export type PlannedMeal = typeof plannedMeals.$inferSelect;

export type InsertBudgetPreferences = z.infer<typeof insertBudgetPreferencesSchema>;
export type BudgetPreferences = typeof budgetPreferences.$inferSelect;

export type InsertSmartSubstitution = z.infer<typeof insertSmartSubstitutionSchema>;
export type SmartSubstitution = typeof smartSubstitutions.$inferSelect;
