import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { booklist, bookStatuses } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

function readContentInput(body: unknown) {
  const value = body as Record<string, unknown>;
  const bookName = typeof value.bookName === "string" ? value.bookName.trim() : "";
  const author = typeof value.author === "string" ? value.author.trim() : "";
  const category = typeof value.category === "string" ? value.category.trim() : "";
  const country = typeof value.country === "string" ? value.country.trim() : "";
  const statusValue = typeof value.status === "string" ? value.status.trim() : "";
  const status = bookStatuses.includes(statusValue as (typeof bookStatuses)[number])
    ? (statusValue as (typeof bookStatuses)[number])
    : "未读";
  const summary = typeof value.summary === "string" ? value.summary.trim() : "";
  const coverUrl = typeof value.coverUrl === "string" ? value.coverUrl.trim() : "";

  return {
    bookName,
    author,
    category,
    country,
    status,
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
  if (!input.bookName || !input.author || !input.category || !input.country) {
    return NextResponse.json({ error: "书名、作者、类型和国家不能为空" }, { status: 400 });
  }

  const [{ id }] = await db.insert(booklist).values(input).$returningId();
  const [created] = await db.select().from(booklist).where(eq(booklist.id, id));
  return NextResponse.json(created, { status: 201 });
}
