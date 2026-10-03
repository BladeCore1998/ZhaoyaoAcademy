"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type SubmissionMode = "anonymous" | "member" | null;

export default function MailboxComposer({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [mode, setMode] = useState<SubmissionMode>(null);
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isLoggedIn && new URLSearchParams(window.location.search).get("compose") === "member") {
      setMode("member");
    }
  }, [isLoggedIn]);

  function openAnonymousComposer() {
    setMode("anonymous");
    setError("");
    setSuccess(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mode) return;

    setPending(true);
    setError("");
    setSuccess(false);
    const response = await fetch("/api/mailbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        anonymous: mode === "anonymous",
      }),
    });
    setPending(false);

    if (response.status === 401 && mode === "member") {
      window.location.href = `/login?next=${encodeURIComponent("/mailbox?compose=member")}`;
      return;
    }
    if (!response.ok) {
      setError((await response.json().catch(() => null))?.error ?? "投递失败，请稍后再试。");
      return;
    }

    setContent("");
    setSuccess(true);
  }

  return (
    <section className="mt-7 max-w-[680px]">
      <div className="flex flex-wrap gap-4">
        {isLoggedIn ? (
          <button className="button-primary" type="button" onClick={() => setMode("member")}>
            登录后投递
          </button>
        ) : (
          <Link className="button-primary" href="/login?next=%2Fmailbox%3Fcompose%3Dmember">
            登录后投递
          </Link>
        )}
        <button className="button-quiet" type="button" onClick={openAnonymousComposer}>
          匿名投递
        </button>
      </div>

      {mode ? (
        <form className="mt-6 grid gap-3 border border-line bg-[rgba(255,251,241,.52)] p-5" onSubmit={submit}>
          <div>
            <p className="eyebrow">{mode === "anonymous" ? "匿名投递" : "登录投递"}</p>
            <p className="mt-2 text-sm text-muted">
              {mode === "anonymous"
                ? "不需要登录，内容默认只有夭夭和管理员能看见。"
                : "这封信会和你的账号关联，内容默认只有夭夭和管理员能看见。"}
            </p>
          </div>
          <label className="grid gap-1.5 text-sm">
            想说的话
            <textarea
              className="min-h-[150px] w-full resize-y border border-line bg-transparent px-3 py-2 outline-none transition focus:border-red"
              name="content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={2000}
              required
              placeholder="把想说的话写在这里……"
            />
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <button className="button-primary" disabled={pending} type="submit">
              {pending ? "正在投递…" : "投递棉花糖"}
            </button>
            <button className="button-quiet" type="button" onClick={() => setMode(null)}>
              暂不投递
            </button>
            <span className="text-xs text-muted">{content.length}/2000</span>
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          {success ? <p className="text-sm text-red">已经收到你的棉花糖，谢谢你写下来。</p> : null}
        </form>
      ) : null}
    </section>
  );
}
