import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { marshmallow } from "@/db/schema";
import { getSession } from "@/lib/session";
import MailboxComposer from "./MailboxComposer";

export const dynamic = "force-dynamic";

export default async function MailboxPage() {
  let publicMessages: { id: number; content: string; adminReply: string | null }[] = [];
  let isLoggedIn = false;
  try {
    publicMessages = await db
      .select({
        id: marshmallow.id,
        content: marshmallow.content,
        adminReply: marshmallow.adminReply,
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
      <p className="eyebrow">月下信箱</p>
      <h1>棉花糖</h1>
      <p className="page-intro">
        你的来信默认只有夭夭和管理员能看见。被管理员设置为公开后，才会出现在信箱墙。
      </p>
      <MailboxComposer isLoggedIn={isLoggedIn} />
      <div className="mt-[58px] border border-dashed border-line p-[26px] text-muted">
        <p className="eyebrow">公开回信</p>
        {publicMessages.length === 0 ? <p>这里会放管理员选择公开的棉花糖。</p> : null}
        <div className="grid gap-5">
          {publicMessages.map((message) => (
            <article key={message.id} className="border-t border-line pt-4">
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.adminReply ? <p className="mt-3 text-red">夭夭回复：{message.adminReply}</p> : null}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
