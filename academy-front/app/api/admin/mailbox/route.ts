import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { marshmallow } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const rows = await db.select().from(marshmallow).orderBy(desc(marshmallow.createdAt));
  return NextResponse.json(rows);
}
