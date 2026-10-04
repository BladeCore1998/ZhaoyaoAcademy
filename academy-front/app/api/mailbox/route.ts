import { NextResponse } from "next/server";
import { db } from "@/db";
import { marshmallow } from "@/db/schema";
import { getSession } from "@/lib/session";

const MAX_CONTENT_LENGTH = 2000;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求内容无效" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "请求内容无效" }, { status: 400 });
  }

  const content = "content" in body && typeof body.content === "string" ? body.content.trim() : "";
  const anonymous = "anonymous" in body && body.anonymous === true;

  if (!content) {
    return NextResponse.json({ error: "请写下想投递的内容" }, { status: 400 });
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ error: `内容不能超过 ${MAX_CONTENT_LENGTH} 字` }, { status: 400 });
  }

  let session: Awaited<ReturnType<typeof getSession>> = null;
  if (!anonymous) {
    try {
      session = await getSession();
    } catch {
      return NextResponse.json({ error: "登录状态暂时无法确认" }, { status: 503 });
    }
    if (!session) {
      return NextResponse.json({ error: "登录后才能使用实名投递" }, { status: 401 });
    }
  }

  const [created] = await db
    .insert(marshmallow)
    .values({
      content,
      userId: session?.user.id ?? null,
    })
    .$returningId();

  return NextResponse.json({ id: created.id }, { status: 201 });
}
