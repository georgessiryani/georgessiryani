import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { tools } from "@/lib/tools";
import { handleToolCall } from "@/lib/tool-handlers";
import { prisma } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a professional culinary assistant for a catering business. You help the owner manage recipes, develop new dishes, scale recipes for events, calculate costs, and grow the business.

You have access to the full recipe database through your tools. Use them proactively — when someone asks about a recipe, look it up. When they ask for a summary, call get_business_summary first.

Your personality: knowledgeable, practical, and warm. You understand both the culinary craft and the business side of catering. You give concrete advice, not vague suggestions.

When creating or updating recipes, always confirm what you've saved. When scaling or calculating costs, show the numbers clearly.`;

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  // Save user message
  await prisma.message.create({ data: { role: "user", content: message } });

  // Load conversation history (last 40 messages for context)
  const history = await prisma.message.findMany({
    orderBy: { createdAt: "asc" },
    take: 40,
  });

  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Agentic loop
  let response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools,
    messages,
  });

  while (response.stop_reason === "tool_use") {
    const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of toolUseBlocks) {
      if (block.type !== "tool_use") continue;
      const result = await handleToolCall(block.name, block.input as Record<string, unknown>);
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(result),
      });
    }

    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });

    response = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });
  }

  const textContent = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as Anthropic.TextBlock).text)
    .join("");

  // Save assistant reply
  await prisma.message.create({ data: { role: "assistant", content: textContent } });

  return Response.json({ message: textContent });
}
