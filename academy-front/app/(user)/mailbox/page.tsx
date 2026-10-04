import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { marshmallow } from "@/db/schema";
import { getSession } from "@/lib/session";
import MailboxComposer from "./MailboxComposer";
import MailboxMessages from "./MailboxMessages";

export const dynamic = "force-dynamic";

export default async function MailboxPage() {
  let publicMessages: { id: number; content: string; adminReply: string | null; createdAt: Date }[] = [];
  let isLoggedIn = false;
  try {
    publicMessages = await db
      .select({
        id: marshmallow.id,
        content: marshmallow.content,
        adminReply: marshmallow.adminReply,
        createdAt: marshmallow.createdAt,
      })
      .from(marshmallow)
      .where(eq(marshmallow.isPublic, true))
      .orderBy(desc(marshmallow.createdAt));
  } catch {
    publicMessages = [];
  }
  try {
    isLoggedIn = Boolean(await getSession());
  } catch {
    isLoggedIn = false;
  }

  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-20 pt-20 max-md:pt-5">
      <p className="eyebrow">招摇信箱</p>
      <h1>棉花糖</h1>
      <p className="page-intro">你的来信默认只有夭夭和管理员能看见。被管理员设置为公开后，才会出现在信箱墙。</p>
      <MailboxComposer isLoggedIn={isLoggedIn} />
      <div className="mt-[58px] border border-dashed border-line p-[26px] text-muted">
        <p className="eyebrow">公开回信</p>
        <MailboxMessages messages={publicMessages} />
      </div>
    </div>
  );
}
