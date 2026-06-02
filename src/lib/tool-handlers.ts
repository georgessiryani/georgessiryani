import { prisma } from "./db";
import type { Ingredient, Recipe, Step } from "@prisma/client";

type RecipeWithRelations = Recipe & { ingredients: Ingredient[]; steps: Step[] };

export async function handleToolCall(name: string, input: Record<string, unknown>) {
  switch (name) {
    case "list_recipes": {
      const { category, tag } = input as { category?: string; tag?: string };
      const recipes = await prisma.recipe.findMany({
        where: {
          ...(category ? { category } : {}),
          ...(tag ? { tags: { has: tag } } : {}),
        },
        include: { ingredients: true },
        orderBy: { updatedAt: "desc" },
      });
      return recipes.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        servings: r.servings,
        category: r.category,
        tags: r.tags,
        ingredientCount: r.ingredients.length,
        updatedAt: r.updatedAt,
      }));
    }

    case "get_recipe": {
      const { id } = input as { id: string };
      const recipe = await prisma.recipe.findUnique({
        where: { id },
        include: {
          ingredients: true,
          steps: { orderBy: { order: "asc" } },
        },
      });
      if (!recipe) return { error: "Recipe not found" };
      return recipe;
    }

    case "create_recipe": {
      const { ingredients, steps, ...rest } = input as {
        name: string;
        description?: string;
        servings: number;
        category?: string;
        tags?: string[];
        notes?: string;
        ingredients: { name: string; quantity: number; unit: string; costPerUnit?: number }[];
        steps: { order: number; instruction: string }[];
      };
      const recipe = await prisma.recipe.create({
        data: {
          ...rest,
          tags: rest.tags ?? [],
          ingredients: { create: ingredients },
          steps: { create: steps },
        },
        include: {
          ingredients: true,
          steps: { orderBy: { order: "asc" } },
        },
      });
      return recipe;
    }

    case "update_recipe": {
      const { id, ingredients, steps, ...rest } = input as {
        id: string;
        name?: string;
        description?: string;
        servings?: number;
        category?: string;
        tags?: string[];
        notes?: string;
        ingredients?: { name: string; quantity: number; unit: string; costPerUnit?: number }[];
        steps?: { order: number; instruction: string }[];
      };

      const recipe = await prisma.recipe.update({
        where: { id },
        data: {
          ...rest,
          ...(ingredients
            ? { ingredients: { deleteMany: {}, create: ingredients } }
            : {}),
          ...(steps
            ? { steps: { deleteMany: {}, create: steps } }
            : {}),
        },
        include: {
          ingredients: true,
          steps: { orderBy: { order: "asc" } },
        },
      });
      return recipe;
    }

    case "delete_recipe": {
      const { id } = input as { id: string };
      await prisma.recipe.delete({ where: { id } });
      return { success: true, message: "Recipe deleted" };
    }

    case "scale_recipe": {
      const { id, targetServings } = input as { id: string; targetServings: number };
      const recipe = await prisma.recipe.findUnique({
        where: { id },
        include: { ingredients: true, steps: { orderBy: { order: "asc" } } },
      }) as RecipeWithRelations | null;
      if (!recipe) return { error: "Recipe not found" };
      const factor = targetServings / recipe.servings;
      return {
        name: recipe.name,
        originalServings: recipe.servings,
        targetServings,
        scaleFactor: factor,
        ingredients: recipe.ingredients.map((ing: Ingredient) => ({
          name: ing.name,
          quantity: Math.round(ing.quantity * factor * 100) / 100,
          unit: ing.unit,
        })),
        steps: recipe.steps,
      };
    }

    case "calculate_cost": {
      const { id, targetServings } = input as { id: string; targetServings?: number };
      const recipe = await prisma.recipe.findUnique({
        where: { id },
        include: { ingredients: true },
      }) as RecipeWithRelations | null;
      if (!recipe) return { error: "Recipe not found" };
      const factor = targetServings ? targetServings / recipe.servings : 1;
      const servings = targetServings ?? recipe.servings;
      const breakdown = recipe.ingredients.map((ing: Ingredient) => {
        const qty = ing.quantity * factor;
        const cost = ing.costPerUnit != null ? qty * ing.costPerUnit : null;
        return { name: ing.name, quantity: qty, unit: ing.unit, costPerUnit: ing.costPerUnit, totalCost: cost };
      });
      const allHaveCost = breakdown.every((b) => b.totalCost != null);
      const totalCost = allHaveCost
        ? breakdown.reduce((sum: number, b) => sum + (b.totalCost ?? 0), 0)
        : null;
      return {
        recipeName: recipe.name,
        servings,
        breakdown,
        totalCost: totalCost != null ? Math.round(totalCost * 100) / 100 : null,
        costPerServing: totalCost != null ? Math.round((totalCost / servings) * 100) / 100 : null,
        note: !allHaveCost ? "Some ingredients are missing cost data" : undefined,
      };
    }

    case "get_business_summary": {
      const recipes = await prisma.recipe.findMany({ include: { ingredients: true } });
      const categories = [...new Set(recipes.map((r: Recipe) => r.category).filter(Boolean))];
      const allTags = [...new Set(recipes.flatMap((r: Recipe) => r.tags))];
      const recipesWithFullCost = recipes.filter((r) =>
        r.ingredients.every((i: Ingredient) => i.costPerUnit != null)
      );
      return {
        totalRecipes: recipes.length,
        categories,
        allTags,
        recipesWithCostData: recipesWithFullCost.length,
        recipeList: recipes.map((r: Recipe) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          servings: r.servings,
        })),
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
