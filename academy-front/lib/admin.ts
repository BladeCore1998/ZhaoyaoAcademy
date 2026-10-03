import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function requireAdmin() {
  const session = await getSession();

  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ error: "请先登录" }, { status: 401 }),
    };
  }

  if (session.user.role !== "admin") {
    return {
      session: null,
      response: NextResponse.json({ error: "没有管理员权限" }, { status: 403 }),
    };
  }

  return { session, response: null };
}
