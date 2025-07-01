import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
}) : null;

interface RecipeIngredient {
  name: string;
  amount: string;
  unit: string;
}

interface RecipeStep {
  stepNumber: number;
  instruction: string;
  duration?: number; // in minutes
}

interface GeneratedRecipe {
  title: string;
  description: string;
  ingredients: RecipeIngredient[];
  instructions: RecipeStep[];
  cookingTime: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  rating: number;
}

export async function generateRecipes(ingredients: string[], dietaryRestrictions: string[] = []): Promise<GeneratedRecipe[]> {
  if (!openai) {
    // Demo recipes when OpenAI API key is not available
    const dietaryNote = dietaryRestrictions.length > 0 ? ` (${dietaryRestrictions.join(", ")})` : "";
    const demoRecipes: GeneratedRecipe[] = [
      {
        title: `${ingredients[0] || "Herb"} Delight Bowl${dietaryNote}`,
        description: `A fresh and flavorful ${dietaryRestrictions.includes("vegan") ? "vegan " : ""}bowl featuring ${ingredients.slice(0, 3).join(", ")} with aromatic herbs and seasonings.`,
        ingredients: [
          { name: ingredients[0] || "Main ingredient", amount: "2", unit: "cups" },
          { name: ingredients[1] || "Secondary ingredient", amount: "1", unit: "cup" },
          { name: ingredients[2] || "Fresh herbs", amount: "1/4", unit: "cup" },
          { name: "Olive oil", amount: "2", unit: "tbsp" },
          { name: "Salt", amount: "1", unit: "tsp" },
          { name: "Black pepper", amount: "1/2", unit: "tsp" }
        ],
        instructions: [
          { stepNumber: 1, instruction: "Prepare all ingredients by washing and chopping as needed.", duration: 5 },
          { stepNumber: 2, instruction: "Heat olive oil in a large pan over medium heat.", duration: 2 },
          { stepNumber: 3, instruction: `Add ${ingredients[0] || "main ingredient"} and cook until tender.`, duration: 8 },
          { stepNumber: 4, instruction: "Season with salt, pepper, and herbs.", duration: 2 },
          { stepNumber: 5, instruction: "Serve hot in bowls and enjoy!", duration: 1 }
        ],
        cookingTime: 20,
        servings: 4,
        difficulty: "easy",
        rating: 5
      },
      {
        title: `Savory ${ingredients[0] || "Garden"} Stir-Fry`,
        description: `Quick and healthy stir-fry combining ${ingredients.slice(0, 2).join(" and ")} with vibrant vegetables.`,
        ingredients: [
          { name: ingredients[0] || "Protein", amount: "1", unit: "lb" },
          { name: ingredients[1] || "Vegetables", amount: "2", unit: "cups" },
          { name: "Garlic", amount: "3", unit: "cloves" },
          { name: "Soy sauce", amount: "3", unit: "tbsp" },
          { name: "Sesame oil", amount: "1", unit: "tbsp" },
          { name: "Ginger", amount: "1", unit: "tsp" }
        ],
        instructions: [
          { stepNumber: 1, instruction: "Prepare ingredients by cutting into bite-sized pieces.", duration: 10 },
          { stepNumber: 2, instruction: "Heat oil in wok or large skillet over high heat.", duration: 2 },
          { stepNumber: 3, instruction: "Add garlic and ginger, stir-fry for 30 seconds.", duration: 1 },
          { stepNumber: 4, instruction: `Add ${ingredients[0] || "protein"} and cook until almost done.`, duration: 5 },
          { stepNumber: 5, instruction: "Add vegetables and stir-fry until crisp-tender.", duration: 4 },
          { stepNumber: 6, instruction: "Add soy sauce and sesame oil, toss to combine.", duration: 1 }
        ],
        cookingTime: 15,
        servings: 3,
        difficulty: "medium",
        rating: 4
      },
      {
        title: `Gourmet ${ingredients[0] || "Chef's"} Special`,
        description: `An elevated dish showcasing ${ingredients.slice(0, 3).join(", ")} with sophisticated flavors and presentation.`,
        ingredients: [
          { name: ingredients[0] || "Premium ingredient", amount: "1.5", unit: "lbs" },
          { name: ingredients[1] || "Accompaniment", amount: "1", unit: "cup" },
          { name: ingredients[2] || "Garnish", amount: "1/2", unit: "cup" },
          { name: "White wine", amount: "1/2", unit: "cup" },
          { name: "Butter", amount: "3", unit: "tbsp" },
          { name: "Fresh thyme", amount: "2", unit: "tsp" }
        ],
        instructions: [
          { stepNumber: 1, instruction: "Preheat oven to 400°F and prepare baking dish.", duration: 5 },
          { stepNumber: 2, instruction: "Season main ingredient generously with salt and pepper.", duration: 3 },
          { stepNumber: 3, instruction: "Sear in hot pan until golden brown on all sides.", duration: 8 },
          { stepNumber: 4, instruction: "Add wine and herbs, then transfer to oven.", duration: 2 },
          { stepNumber: 5, instruction: "Roast until cooked through, about 25-30 minutes.", duration: 30 },
          { stepNumber: 6, instruction: "Rest for 5 minutes before serving with garnish.", duration: 5 }
        ],
        cookingTime: 45,
        servings: 4,
        difficulty: "hard",
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

Guidelines:
- Use as many of the provided ingredients as possible
- Include common pantry staples (salt, pepper, oil, etc.) as needed
- Make sure instructions are clear and detailed
- Cooking time should be realistic
- Difficulty should be "easy", "medium", or "hard"
- Rating should be between 4-5 (whole numbers only)
- Each recipe should be unique and different from the others
`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
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
    throw new Error("Failed to generate recipes: " + (error as Error).message);
  }
}

export async function generateRecipeImage(recipeTitle: string, ingredients: string[]): Promise<string> {
  if (!openai) {
    // Return a demo food image when OpenAI is not available
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800";
  }

  try {
    const prompt = `A professional food photography shot of ${recipeTitle}, featuring ${ingredients.slice(0, 3).join(", ")}, beautifully plated and styled, warm lighting, appetizing, high quality, restaurant style presentation`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return response.data?.[0]?.url || "";
  } catch (error) {
    console.error("Error generating recipe image:", error);
    // Return a fallback image URL if image generation fails
    return "";
  }
}
