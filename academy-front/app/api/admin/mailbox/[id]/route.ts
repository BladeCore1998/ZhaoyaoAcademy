import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { marshmallow } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const id = parseId((await context.params).id);
  if (!id) return NextResponse.json({ error: "留言编号无效" }, { status: 400 });

  const body = (await request.json()) as Record<string, unknown>;
  const update: Partial<typeof marshmallow.$inferInsert> = {};
  if (typeof body.adminReply === "string") update.adminReply = body.adminReply.trim() || null;
  if (typeof body.status === "string" && ["pending", "replied", "archived"].includes(body.status)) {
    update.status = body.status;
  }
  if (typeof body.isPublic === "boolean") update.isPublic = body.isPublic;
  if (typeof body.isPinned === "boolean") update.isPinned = body.isPinned;
  if (typeof body.sortOrder === "number") {
    if (!Number.isInteger(body.sortOrder) || body.sortOrder < 0) {
      return NextResponse.json({ error: "排序值必须是非负整数" }, { status: 400 });
    }
    update.sortOrder = body.sortOrder;
  }

  await db.update(marshmallow).set(update).where(eq(marshmallow.id, id));
  const [updated] = await db.select().from(marshmallow).where(eq(marshmallow.id, id));
  return updated ? NextResponse.json(updated) : NextResponse.json({ error: "留言不存在" }, { status: 404 });
}
