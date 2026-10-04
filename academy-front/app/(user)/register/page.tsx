"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致。");
      return;
    }

    setPending(true);
    const response = await fetch("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      error?: { message?: string };
    } | null;
    setPending(false);

    if (!response.ok) {
      setError(payload?.error?.message ?? payload?.message ?? "注册失败，请检查信息后再试。");
      return;
    }

    window.location.href = "/login?registered=1";
  }

  return (
    <div className="grid min-h-screen place-items-center bg-paper p-6">
      <div className="relative w-[min(100%,430px)] border border-line bg-[rgba(255,251,241,.72)] p-10 max-md:p-7">
        <Link className="absolute right-6 top-5 text-sm text-red transition-colors hover:text-ink" href="/">
          返回首页
        </Link>
        <p className="eyebrow">初见书院</p>
        <h1 className="text-5xl">注册</h1>
        <p className="leading-[1.8] text-muted">创建账号后，可以收藏歌单、书单，也可以查看自己的投递。</p>
        <form className="my-7 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-1.5 text-sm">
            昵称
            <input
              className="min-h-[42px] w-full border border-line bg-transparent px-3 outline-none transition focus:border-red"
              name="name"
              type="text"
              required
              maxLength={255}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            邮箱
            <input
              className="min-h-[42px] w-full border border-line bg-transparent px-3 outline-none transition focus:border-red"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            密码
            <input
              className="min-h-[42px] w-full border border-line bg-transparent px-3 outline-none transition focus:border-red"
              name="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            确认密码
            <input
              className="min-h-[42px] w-full border border-line bg-transparent px-3 outline-none transition focus:border-red"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="button-primary" disabled={pending} type="submit">
            {pending ? "正在注册…" : "注册"}
          </button>
        </form>
        <p className="text-center text-sm text-muted">
          已有账号？
          <Link className="ml-1 text-red hover:underline" href="/login">
            返回登录
          </Link>
        </p>
      </div>
    </div>
  );
}
