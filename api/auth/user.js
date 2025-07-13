import { db } from '../../lib/db.js';
import { users } from '../../lib/schema.js';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [userData] = await db.select().from(users).where(eq(users.id, user.id));
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
}
</invoke>

<action type="file" filePath="api/generate-recipes.js" contentType="content">
import { db } from '../lib/db.js';
import { users, recipes } from '../lib/schema.js';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '../lib/auth.js';
import { generateRecipes } from '../lib/openai.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [userData] = await db.select().from(users).where(eq(users.id, user.id));
    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check usage limits for free users
    if (userData.subscriptionStatus === "free") {
      const now = new Date();
      const lastReset = userData.lastResetDate ? new Date(userData.lastResetDate) : new Date();
      const monthsDiff = (now.getFullYear() - lastReset.getFullYear()) * 12 + (now.getMonth() - lastReset.getMonth());
      
      let currentCount = userData.monthlyRecipeCount || 0;
      if (monthsDiff >= 1) {
        currentCount = 0;
      }

      if (currentCount >= 2) {
        return res.status(403).json({ 
          message: "Monthly recipe limit reached. Upgrade to Pro for unlimited recipes.",
          limitReached: true
        });
      }
    }

    const { ingredients } = req.body;
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ message: 'At least one ingredient is required' });
    }
    
    // Generate recipes using OpenAI with user's dietary restrictions
    const generatedRecipes = await generateRecipes(ingredients, userData.dietaryRestrictions || []);
    
    // Save recipes to database
    const savedRecipes = [];
    for (const recipe of generatedRecipes) {
      const [savedRecipe] = await db.insert(recipes).values({
        userId: user.id,
        title: recipe.title,
        description: recipe.description,
        ingredients: JSON.stringify(recipe.ingredients),
        instructions: JSON.stringify(recipe.instructions),
        cookingTime: recipe.cookingTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        imageUrl: recipe.imageUrl || '',
        rating: recipe.rating,
        isSaved: false,
      }).returning();
      savedRecipes.push(savedRecipe);
    }

    // Increment usage count
    await db.update(users)
      .set({ 
        monthlyRecipeCount: (userData.monthlyRecipeCount || 0) + 1,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    res.json({ recipes: savedRecipes });
  } catch (error) {
    console.error('Error generating recipes:', error);
    res.status(500).json({ message: 'Failed to generate recipes: ' + error.message });
  }
}
</invoke>

<action type="file" filePath="lib/db.js" contentType="content">
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema.js';

neonConfig.webSocketConstructor = WebSocket;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
</invoke>

<action type="file" filePath="lib/schema.js" contentType="content">
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

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("free"),
  monthlyRecipeCount: integer("monthly_recipe_count").default(0),
  lastResetDate: timestamp("last_reset_date").defaultNow(),
  dietaryRestrictions: text("dietary_restrictions").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  ingredients: jsonb("ingredients").notNull(),
  instructions: jsonb("instructions").notNull(),
  cookingTime: integer("cooking_time").notNull(),
  servings: integer("servings").notNull(),
  difficulty: varchar("difficulty").notNull(),
  imageUrl: text("image_url"),
  rating: integer("rating").default(0),
  isSaved: boolean("is_saved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Session storage table for Vercel
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);
</invoke>

<action type="file" filePath="lib/openai.js" contentType="content">
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
}) : null;

export async function generateRecipes(ingredients, dietaryRestrictions = []) {
  if (!openai) {
    // Demo recipes when OpenAI API key is not available
    const dietaryNote = dietaryRestrictions.length > 0 ? ` (${dietaryRestrictions.join(", ")})` : "";
    const demoRecipes = [
      {
        title: `${ingredients[0] || "Herb"} Delight Bowl${dietaryNote}`,
        description: `A fresh and flavorful ${dietaryRestrictions.includes("vegan") ? "vegan " : ""}bowl featuring ${ingredients.slice(0, 3).join(", ")} with aromatic herbs and seasonings.`,
        ingredients: [
          { name: ingredients[0] || "Main ingredient", amount: "2", unit: "cups" },
          { name: ingredients[1] || "Secondary ingredient", amount: "1", unit: "cup" },
          { name: "Olive oil", amount: "2", unit: "tbsp" },
          { name: "Salt", amount: "1", unit: "tsp" },
        ],
        instructions: [
          { stepNumber: 1, instruction: "Prepare all ingredients by washing and chopping as needed.", duration: 5 },
          { stepNumber: 2, instruction: "Heat olive oil in a large pan over medium heat.", duration: 2 },
          { stepNumber: 3, instruction: `Add ${ingredients[0] || "main ingredient"} and cook until tender.`, duration: 8 },
          { stepNumber: 4, instruction: "Season with salt and pepper.", duration: 2 },
          { stepNumber: 5, instruction: "Serve hot and enjoy!", duration: 1 }
        ],
        cookingTime: 20,
        servings: 4,
        difficulty: "easy",
        rating: 5
      }
    ];
    
    return demoRecipes;
  }

  try {
    const dietaryNote = dietaryRestrictions.length > 0 ? `\n\nDietary restrictions to follow: ${dietaryRestrictions.join(", ")}` : "";
    const prompt = `
You are a professional chef and recipe creator. Given the following ingredients, create 3 unique and delicious recipes.

Ingredients available: ${ingredients.join(", ")}${dietaryNote}

Please provide 3 different recipes that use these ingredients. Each recipe should be practical, delicious, and achievable for home cooks.

Respond with a JSON object containing an array of recipes with this exact structure:
{
  "recipes": [
    {
      "title": "Recipe Name",
      "description": "A brief, appetizing description of the dish",
      "ingredients": [
        {
          "name": "ingredient name",
          "amount": "quantity",
          "unit": "measurement unit"
        }
      ],
      "instructions": [
        {
          "stepNumber": 1,
          "instruction": "Detailed step instruction",
          "duration": 5
        }
      ],
      "cookingTime": 30,
      "servings": 4,
      "difficulty": "easy",
      "rating": 5
    }
  ]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional chef that creates amazing recipes. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (!result.recipes || !Array.isArray(result.recipes)) {
      throw new Error("Invalid response format from OpenAI");
    }

    return result.recipes;
  } catch (error) {
    console.error("Error generating recipes:", error);
    throw new Error("Failed to generate recipes: " + error.message);
  }
}
</invoke>

<action type="file" filePath="lib/auth.js" contentType="content">
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function verifyAuth(req) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.auth_token;
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

export function generateAuthToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email 
    }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
}
</invoke>

<action type="file" filePath="api/auth/login.js" contentType="content">
import { generateAuthToken } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // For demo purposes - in production, implement proper OAuth or authentication
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Mock user for demo - replace with actual authentication
    const user = {
      id: 'demo-user-' + Date.now(),
      email: email,
      firstName: 'Demo',
      lastName: 'User'
    };

    const token = generateAuthToken(user);
    
    // Set HTTP-only cookie
    res.setHeader('Set-Cookie', `auth_token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`);
    
    res.json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
}
</invoke>

<action type="file" filePath="package.json" contentType="diff">
@@ .. @@
   "scripts": {
-    "dev": "NODE_ENV=development node --loader tsx server/index.ts",
-    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
-    "start": "NODE_ENV=production node dist/index.js",
+    "dev": "vercel dev",
+    "build": "cd client && npm run build",
+    "start": "vercel --prod",
     "check": "tsc",
-    "db:push": "drizzle-kit push"
+    "db:push": "drizzle-kit push",
+    "vercel-build": "cd client && npm install && npm run build"
   },
</invoke>

<action type="file" filePath="client/package.json" contentType="content">
{
  "name": "chefai-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.4",
    "@radix-ui/react-alert-dialog": "^1.1.7",
    "@radix-ui/react-aspect-ratio": "^1.1.3",
    "@radix-ui/react-avatar": "^1.1.4",
    "@radix-ui/react-checkbox": "^1.1.5",
    "@radix-ui/react-collapsible": "^1.1.4",
    "@radix-ui/react-context-menu": "^2.2.7",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-dropdown-menu": "^2.1.7",
    "@radix-ui/react-hover-card": "^1.1.7",
    "@radix-ui/react-label": "^2.1.3",
    "@radix-ui/react-menubar": "^1.1.7",
    "@radix-ui/react-navigation-menu": "^1.2.6",
    "@radix-ui/react-popover": "^1.1.7",
    "@radix-ui/react-progress": "^1.1.3",
    "@radix-ui/react-radio-group": "^1.2.4",
    "@radix-ui/react-scroll-area": "^1.2.4",
    "@radix-ui/react-select": "^2.1.7",
    "@radix-ui/react-separator": "^1.1.3",
    "@radix-ui/react-slider": "^1.2.4",
    "@radix-ui/react-slot": "^1.2.0",
    "@radix-ui/react-switch": "^1.1.4",
    "@radix-ui/react-tabs": "^1.1.4",
    "@radix-ui/react-toast": "^1.2.7",
    "@radix-ui/react-toggle": "^1.1.3",
    "@radix-ui/react-toggle-group": "^1.1.3",
    "@radix-ui/react-tooltip": "^1.2.0",
    "@stripe/react-stripe-js": "^3.7.0",
    "@stripe/stripe-js": "^7.4.0",
    "@tanstack/react-query": "^5.60.5",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.6.0",
    "framer-motion": "^11.13.1",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.453.0",
    "next-themes": "^0.4.6",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.55.0",
    "react-icons": "^5.4.0",
    "react-resizable-panels": "^2.1.7",
    "recharts": "^2.15.2",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "tw-animate-css": "^1.2.5",
    "vaul": "^1.1.2",
    "wouter": "^3.3.5",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@tailwindcss/typography": "^0.5.15",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.17",
    "typescript": "5.6.3",
    "vite": "^5.4.19"
  }
}
</invoke>

<action type="file" filePath="client/vite.config.ts" contentType="content">
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
</invoke>

<action type="file" filePath=".env.example" contentType="content">
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/chefai"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Stripe (optional)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
VITE_STRIPE_PUBLIC_KEY="pk_test_..."

# JWT Secret for authentication
JWT_SECRET="your-jwt-secret-key"

# Vercel Environment
VERCEL_ENV="development"
</invoke>

<action type="file" filePath="README.md" contentType="content">
# ChefAI - Vercel Deployment

This is a full-stack AI-powered recipe generator optimized for Vercel deployment.

## Deployment Steps

1. **Clone and Setup**
   ```bash
   git clone <your-repo>
   cd chefai
   npm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env.local` and fill in your values:
   - `DATABASE_URL`: Your PostgreSQL connection string (recommend Neon or Supabase)
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `JWT_SECRET`: A secure random string for JWT signing
   - Optional: Stripe keys for payments

3. **Database Setup**
   ```bash
   npm run db:push
   ```

4. **Deploy to Vercel**
   ```bash
   npx vercel
   ```
   
   Or connect your GitHub repo to Vercel dashboard.

5. **Configure Environment Variables in Vercel**
   - Go to your Vercel project dashboard
   - Add all environment variables from your `.env.local`

## Architecture Changes for Vercel

- **Serverless Functions**: Express routes converted to Vercel API routes in `/api` folder
- **Authentication**: Simplified JWT-based auth (replace with NextAuth.js for production)
- **Database**: Uses Neon PostgreSQL with connection pooling
- **Static Build**: Frontend builds to static files served by Vercel

## API Endpoints

- `POST /api/generate-recipes` - Generate AI recipes
- `GET /api/auth/user` - Get current user
- `POST /api/auth/login` - Login (demo implementation)

## Local Development

```bash
npm run dev  # Starts Vercel dev server
```

## Production Considerations

1. **Authentication**: Replace demo JWT auth with proper OAuth (NextAuth.js recommended)
2. **Database**: Use connection pooling for production
3. **Error Handling**: Add comprehensive error boundaries
4. **Rate Limiting**: Implement API rate limiting
5. **Monitoring**: Add logging and monitoring services

## Environment Variables Required

- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key
- `JWT_SECRET` - JWT signing secret
- `STRIPE_SECRET_KEY` (optional) - Stripe secret key
- `VITE_STRIPE_PUBLIC_KEY` (optional) - Stripe public key
</invoke>