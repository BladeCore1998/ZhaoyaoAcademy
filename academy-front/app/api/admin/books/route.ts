import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { booklist } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

function readContentInput(body: unknown) {
  const value = body as Record<string, unknown>;
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const summary = typeof value.summary === "string" ? value.summary.trim() : "";
  const coverUrl = typeof value.coverUrl === "string" ? value.coverUrl.trim() : "";

  return {
    title,
    summary: summary || null,
    coverUrl: coverUrl || null,
    isPublished: value.isPublished === true,
  };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const rows = await db.select().from(booklist).orderBy(desc(booklist.createdAt));
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const input = readContentInput(await request.json());
  if (!input.title) {
    return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
  }

  const [{ id }] = await db.insert(booklist).values(input).$returningId();
  const [created] = await db.select().from(booklist).where(eq(booklist.id, id));
  return NextResponse.json(created, { status: 201 });
}
