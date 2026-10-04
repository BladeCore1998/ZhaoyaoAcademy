import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { ADMIN_RESET_PASSWORD, updateManagedUserPassword } from "@/lib/admin-users";

type RouteContext = { params: Promise<{ id: string }> };

async function getTargetUser(id: string) {
  const [target] = await db.select({ id: user.id }).from(user).where(eq(user.id, id)).limit(1);
  return target;
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (admin.response) return admin.response;

  const { id } = await context.params;
  if (!(await getTargetUser(id))) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (password.length < 8) {
    return NextResponse.json({ error: "密码至少需要 8 位" }, { status: 400 });
  }

  await updateManagedUserPassword(
    id,
    password,
    admin.session?.user.id === id ? admin.session.session.token : undefined,
  );
  return NextResponse.json({ status: true });
}

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (admin.response) return admin.response;

  const { id } = await context.params;
  if (!(await getTargetUser(id))) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  await updateManagedUserPassword(
    id,
    ADMIN_RESET_PASSWORD,
    admin.session?.user.id === id ? admin.session.session.token : undefined,
  );
  return NextResponse.json({
    status: true,
    password: ADMIN_RESET_PASSWORD,
  });
}
