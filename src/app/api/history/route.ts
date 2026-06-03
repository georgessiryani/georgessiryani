import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const messages = await prisma.message.findMany({
    where: { content: { not: "" } },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return Response.json({ messages });
}

export async function DELETE(_req: NextRequest) {
  await prisma.message.deleteMany();
  return Response.json({ success: true });
}
