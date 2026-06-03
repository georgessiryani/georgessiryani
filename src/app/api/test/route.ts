import { prisma } from "@/lib/db";

export async function GET() {
  const checks: Record<string, string> = {};

  checks.anthropic_key = process.env.ANTHROPIC_API_KEY ? "set" : "MISSING";
  checks.database_url = process.env.DATABASE_URL ? "set" : "MISSING";

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "connected";
  } catch (e) {
    checks.database = `error: ${e instanceof Error ? e.message : String(e)}`;
  }

  try {
    const count = await prisma.message.count();
    checks.messages_table = `ok (${count} rows)`;
  } catch (e) {
    checks.messages_table = `error: ${e instanceof Error ? e.message : String(e)}`;
  }

  return Response.json(checks);
}
