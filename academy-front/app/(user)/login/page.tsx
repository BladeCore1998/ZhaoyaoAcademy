"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { RefreshCw, X } from "lucide-react";

const captchaAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function createCaptcha() {
  return Array.from({ length: 4 }, () => captchaAlphabet[Math.floor(Math.random() * captchaAlphabet.length)]).join("");
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [captchaOpen, setCaptchaOpen] = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);

  async function attemptLogin() {
    setError("");
    setPending(true);
    const response = await fetch("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setPending(false);

    if (!response.ok) {
      setError("邮箱或密码不正确，请完成验证码后再试。");
      setCaptchaRequired(true);
      setCaptcha(createCaptcha());
      setCaptchaInput("");
      setCaptchaError("");
      setCaptchaOpen(true);
      return;
    }

    const sessionResponse = await fetch("/api/auth/get-session", { cache: "no-store" });
    const session = sessionResponse.ok ? ((await sessionResponse.json()) as { user?: { role?: string } }) : null;
    const next = new URLSearchParams(window.location.search).get("next");
    const destination = next?.startsWith("/") && !next.startsWith("//") ? next : "/";
    window.location.href = session?.user?.role === "admin" ? "/admin" : destination;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (captchaRequired) {
      setCaptchaOpen(true);
      return;
    }
    void attemptLogin();
  }

  function handleCaptchaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (captchaInput.trim().toUpperCase() !== captcha) {
      setCaptchaError("验证码不正确，请重新输入。");
      setCaptchaInput("");
      setCaptcha(createCaptcha());
      return;
    }
    setCaptchaOpen(false);
    setCaptchaRequired(false);
    setCaptchaError("");
    void attemptLogin();
  }

  return (
    <div className="grid min-h-screen place-items-center bg-paper p-6">
      <div className="relative w-[min(100%,430px)] border border-line bg-[rgba(255,251,241,.72)] p-10 max-md:p-7">
        <Link className="absolute right-6 top-5 text-sm text-red transition-colors hover:text-ink" href="/">
          返回首页
        </Link>
        <p className="eyebrow">回到书院</p>
        <h1 className="text-5xl">登录</h1>
        <p className="leading-[1.8] text-muted">登录后可以收藏歌单、书单，也可以查看自己的投递。</p>
        <div className="mt-6 grid grid-cols-2 border border-line text-sm" aria-label="登录方式">
          <span className="bg-red px-3 py-2 text-center text-[#fffaf0]">登录</span>
          <Link className="px-3 py-2 text-center text-red transition-colors hover:bg-red/8" href="/register">
            注册
          </Link>
        </div>
        <form className="my-7 grid gap-4" onSubmit={handleSubmit}>
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
          {error ? <p className="form-error">{error}</p> : null}
          <button className="button-primary" disabled={pending} type="submit">
            {pending ? "正在登录…" : "登录"}
          </button>
        </form>
        <p className="text-center text-sm text-muted">登录后即可进入你的书院。</p>
      </div>
      {captchaOpen ? (
        <div className="fixed inset-0 z-10 grid place-items-center bg-ink/35 p-6">
          <div
            className="relative w-[min(100%,380px)] border border-line bg-paper p-7 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="captcha-title"
          >
            <button
              className="absolute right-4 top-4 text-muted transition-colors hover:text-red"
              type="button"
              aria-label="关闭验证码"
              title="关闭"
              onClick={() => setCaptchaOpen(false)}
            >
              <X size={18} />
            </button>
            <p className="eyebrow">安全校验</p>
            <h2 id="captcha-title" className="text-2xl">
              请输入验证码
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted">登录失败后需要完成一次校验，验证通过会自动重试登录。</p>
            <form className="mt-5 grid gap-4" onSubmit={handleCaptchaSubmit}>
              <div className="flex items-stretch gap-3">
                <div
                  className="grid min-h-[48px] flex-1 place-items-center border border-line bg-paper-deep text-xl tracking-[0.35em] text-red"
                  aria-label={`验证码 ${captcha}`}
                >
                  {captcha}
                </div>
                <button
                  className="border border-line px-3 text-muted transition-colors hover:border-red hover:text-red"
                  type="button"
                  aria-label="换一张验证码"
                  title="换一张"
                  onClick={() => {
                    setCaptcha(createCaptcha());
                    setCaptchaInput("");
                    setCaptchaError("");
                  }}
                >
                  <RefreshCw size={17} />
                </button>
              </div>
              <input
                className="min-h-[42px] w-full border border-line bg-transparent px-3 uppercase outline-none transition focus:border-red"
                autoFocus
                value={captchaInput}
                onChange={(event) => setCaptchaInput(event.target.value)}
                placeholder="输入上方验证码"
                required
              />
              {captchaError ? <p className="form-error">{captchaError}</p> : null}
              <button className="button-primary" disabled={pending} type="submit">
                {pending ? "正在校验…" : "验证并重试"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
