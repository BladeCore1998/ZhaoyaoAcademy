import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getSession } from "@/lib/session";
import { putImage } from "@/lib/storage";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "请选择 JPG、PNG、WebP 或 GIF 图片" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "图片大小不能超过 5MB" }, { status: 400 });
  }

  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const key = `avatar/${session.user.id}/${randomUUID()}.${extension}`;
  await putImage({
    key,
    buffer: Buffer.from(await file.arrayBuffer()),
    contentType: file.type,
  });
  const url = `/api/media/${key}`;
  await db.update(user).set({ image: url }).where(eq(user.id, session.user.id));

  return NextResponse.json({ url });
}
