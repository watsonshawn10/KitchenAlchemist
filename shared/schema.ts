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

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;
export type InsertIngredientSuggestion = z.infer<typeof insertIngredientSuggestionSchema>;
export type IngredientSuggestion = typeof ingredientSuggestions.$inferSelect;
