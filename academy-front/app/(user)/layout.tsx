import Link from "next/link";
import { Library, Mail, Music2 } from "lucide-react";
import { getSession } from "@/lib/session";

const links = [
  { href: "/playlists", label: "歌单", icon: Music2 },
  { href: "/books", label: "书单", icon: Library },
  { href: "/mailbox", label: "棉花糖", icon: Mail },
];

export default async function UserLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession().catch(() => null);

  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-4 px-6 py-[22px] md:gap-8">
        <Link className="mr-auto flex items-center gap-2.5" href="/">
          <span className="grid size-[34px] place-items-center overflow-hidden rounded-full border border-red text-red">
            <img src="/inspiration/L.webp" alt="" className="size-full object-cover" />
          </span>
          <span>
            <strong className="block">招摇夭夭</strong>
            <small className="mt-0.5 block text-[11px] tracking-[0.12em] text-muted">点歌 · 读书 · 收信</small>
          </span>
        </Link>
        <nav
          className="order-3 flex w-full justify-between gap-5 md:order-none md:w-auto md:justify-normal"
          aria-label="用户导航"
        >
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-red"
              href={href}
              key={href}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <Link
          className="inline-flex items-center gap-1.5 border-b border-red pb-[3px] text-sm text-red"
          href={session ? "/profile" : "/login"}
        >
          {session ? "我的" : "登录"}
        </Link>
      </header>
      <main>{children}</main>
      <footer className="mx-auto max-w-[1180px] px-6 pb-7 text-xs text-muted">招摇书院 · 愿你今夜有好梦</footer>
    </div>
  );
}
