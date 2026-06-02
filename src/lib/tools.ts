import { Tool } from "@anthropic-ai/sdk/resources/messages";

export const tools: Tool[] = [
  {
    name: "list_recipes",
    description: "List all recipes in the system, optionally filtered by category or tag.",
    input_schema: {
      type: "object" as const,
      properties: {
        category: { type: "string", description: "Filter by category (optional)" },
        tag: { type: "string", description: "Filter by tag (optional)" },
      },
      required: [],
    },
  },
  {
    name: "get_recipe",
    description: "Get full details of a recipe including all ingredients, steps, and cost breakdown.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Recipe ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "create_recipe",
    description: "Create a new recipe with ingredients and steps.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        servings: { type: "number" },
        category: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        notes: { type: "string" },
        ingredients: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              quantity: { type: "number" },
              unit: { type: "string" },
              costPerUnit: { type: "number", description: "Cost per unit in dollars (optional)" },
            },
            required: ["name", "quantity", "unit"],
          },
        },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              order: { type: "number" },
              instruction: { type: "string" },
            },
            required: ["order", "instruction"],
          },
        },
      },
      required: ["name", "servings", "ingredients", "steps"],
    },
  },
  {
    name: "update_recipe",
    description: "Update an existing recipe. Only provide fields you want to change.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        servings: { type: "number" },
        category: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        notes: { type: "string" },
        ingredients: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              quantity: { type: "number" },
              unit: { type: "string" },
              costPerUnit: { type: "number" },
            },
            required: ["name", "quantity", "unit"],
          },
        },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              order: { type: "number" },
              instruction: { type: "string" },
            },
            required: ["order", "instruction"],
          },
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_recipe",
    description: "Delete a recipe permanently.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "scale_recipe",
    description: "Scale a recipe to a different number of servings and return the adjusted quantities.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string" },
        targetServings: { type: "number" },
      },
      required: ["id", "targetServings"],
    },
  },
  {
    name: "calculate_cost",
    description: "Calculate total ingredient cost for a recipe and cost per serving.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string" },
        targetServings: { type: "number", description: "Optional: calculate cost for a different serving count" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_business_summary",
    description: "Get an overview of the entire recipe collection: total recipes, categories, and cost data.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];
