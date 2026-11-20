import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { SOURCE_LABELS, getRegion, resolveCover, simplify, type CoverKind } from "@/lib/cover-search";
import { putImage } from "@/lib/storage";

/** 根据歌名/书名自动解析封面，上传 RustFS 后返回可直接写入 coverUrl 的地址。 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const kind = body?.kind;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const creator = typeof body?.creator === "string" ? body.creator.trim() : "";

  if ((kind !== "song" && kind !== "book") || !title) {
    return NextResponse.json({ error: "请先填写名称" }, { status: 400 });
  }

  const region = await getRegion();
  const { best, notes } = await resolveCover({
    kind: kind as CoverKind,
    title,
    creator,
    region: region.region,
  });

  if (!best) {
    return NextResponse.json({ error: "没有找到匹配的封面，可以手动上传或粘贴图片地址", notes }, { status: 404 });
  }

  const hash = createHash("sha1").update(best.image.buffer).digest("hex").slice(0, 12);
  const key = `cover/${kind}/${hash}.${best.image.extension}`;
  await putImage({ key, buffer: best.image.buffer, contentType: best.image.contentType });

  return NextResponse.json({
    url: `/api/media/${key}`,
    source: SOURCE_LABELS[best.source],
    score: best.score,
    title: simplify(best.title),
    creator: simplify(best.creator),
  });
}
