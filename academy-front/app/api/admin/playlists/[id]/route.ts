import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlist } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const id = parseId((await context.params).id);
  if (!id) return NextResponse.json({ error: "内容编号无效" }, { status: 400 });

  const body = (await request.json()) as Record<string, unknown>;
  const update: Partial<typeof playlist.$inferInsert> = {};
  if (typeof body.title === "string") update.title = body.title.trim();
  if (typeof body.summary === "string") update.summary = body.summary.trim() || null;
  if (typeof body.coverUrl === "string") update.coverUrl = body.coverUrl.trim() || null;
  if (typeof body.isPublished === "boolean") update.isPublished = body.isPublished;
  if (update.title === "") return NextResponse.json({ error: "标题不能为空" }, { status: 400 });

  await db.update(playlist).set(update).where(eq(playlist.id, id));
  const [updated] = await db.select().from(playlist).where(eq(playlist.id, id));
  return updated
    ? NextResponse.json(updated)
    : NextResponse.json({ error: "内容不存在" }, { status: 404 });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const id = parseId((await context.params).id);
  if (!id) return NextResponse.json({ error: "内容编号无效" }, { status: 400 });

  await db.delete(playlist).where(eq(playlist.id, id));
  return new NextResponse(null, { status: 204 });
}
