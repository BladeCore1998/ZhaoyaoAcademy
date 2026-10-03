import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { putImage } from "@/lib/storage";

const maxImageSize = 5 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请选择图片文件" }, { status: 400 });
  }
  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "仅支持 JPG、PNG、WebP 或 GIF 图片" }, { status: 400 });
  }
  if (file.size > maxImageSize) {
    return NextResponse.json({ error: "图片大小不能超过 5MB" }, { status: 400 });
  }

  const kind = form.get("kind") === "avatar" ? "avatar" : "cover";
  const key = `${kind}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extensions[file.type]}`;
  await putImage({
    key,
    buffer: Buffer.from(await file.arrayBuffer()),
    contentType: file.type,
  });

  return NextResponse.json({ key, url: `/api/media/${key}` }, { status: 201 });
}
