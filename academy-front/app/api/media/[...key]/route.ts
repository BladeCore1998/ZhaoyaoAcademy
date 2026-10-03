import { NextResponse } from "next/server";
import { getImage } from "@/lib/storage";

export async function GET(_: Request, context: { params: Promise<{ key: string[] }> }) {
  const key = (await context.params).key.join("/");
  if (!key || key.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const { object, contentType } = await getImage(key);
    const chunks: Buffer[] = [];
    for await (const chunk of object) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return new NextResponse(Buffer.concat(chunks), {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentType,
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
