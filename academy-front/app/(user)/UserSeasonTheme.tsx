"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Flower2, Leaf, Library, Mail, Music2, Palette, Snowflake, Sun } from "lucide-react";
import { getCurrentSeason, isSeasonPreference, type Season, type SeasonPreference } from "@/lib/season";

const seasonOptions: Record<Season, { label: string; shortLabel: string; icon: React.ReactNode }> = {
  spring: { label: "春 · 桃花书院", shortLabel: "春日", icon: <Flower2 size={15} /> },
  summer: { label: "夏 · 荷风书院", shortLabel: "夏日", icon: <Sun size={15} /> },
  autumn: { label: "秋 · 金桂书院", shortLabel: "秋日", icon: <Leaf size={15} /> },
  winter: { label: "冬 · 瑞雪书院", shortLabel: "冬日", icon: <Snowflake size={15} /> },
};

const links = [
  { href: "/playlists", label: "歌单", icon: Music2 },
  { href: "/books", label: "书单", icon: Library },
  { href: "/mailbox", label: "棉花糖", icon: Mail },
];

export default function UserSeasonTheme({
  isLoggedIn,
  initialSeason,
  children,
}: Readonly<{ isLoggedIn: boolean; initialSeason: Season; children: React.ReactNode }>) {
  const [currentSeason, setCurrentSeason] = useState<Season>(initialSeason);
  const [seasonPreference, setSeasonPreference] = useState<SeasonPreference>("auto");
  const activeSeason = seasonPreference === "auto" ? currentSeason : seasonPreference;

  useEffect(() => {
    try {
      const savedPreference = window.localStorage.getItem("user-season-theme");
      if (isSeasonPreference(savedPreference)) setSeasonPreference(savedPreference);
    } catch {
      // The automatic theme still works when browser storage is unavailable.
    }
    const updateSeason = () => setCurrentSeason(getCurrentSeason());
    const timer = window.setInterval(updateSeason, 60_000);
    window.addEventListener("focus", updateSeason);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", updateSeason);
    };
  }, []);

  function selectSeason(preference: SeasonPreference) {
    setSeasonPreference(preference);
    try {
      window.localStorage.setItem("user-season-theme", preference);
    } catch {
      // Keep the selected theme for this visit without persistent storage.
    }
  }

  return (
    <div className="user-layout" data-season={activeSeason}>
      <header className="user-header">
        <Link className="user-brand" href="/">
          <span className="user-brand-seal">
            <img src="/inspiration/L.webp" alt="" />
          </span>
          <span>
            <strong className="block">招摇夭夭</strong>
            <small className="mt-0.5 block text-[11px] tracking-[0.12em] text-muted">点歌 · 读书 · 收信</small>
          </span>
        </Link>
        <nav className="user-nav" aria-label="用户导航">
          {links.map(({ href, label, icon: Icon }) => (
            <Link className="user-nav-link" href={href} key={href}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="user-header-actions">
          <details className="user-season-picker">
            <summary aria-label="切换四季主题" title="切换四季主题">
              <Palette size={15} />
              <span>{seasonOptions[activeSeason].shortLabel}</span>
            </summary>
            <div className="user-season-menu">
              <button
                className={seasonPreference === "auto" ? "is-active" : ""}
                aria-pressed={seasonPreference === "auto"}
                type="button"
                onClick={(event) => {
                  selectSeason("auto");
                  event.currentTarget.closest("details")?.removeAttribute("open");
                }}
              >
                <Palette size={15} />
                跟随时令 · {seasonOptions[currentSeason].shortLabel}
              </button>
              {(Object.entries(seasonOptions) as [Season, (typeof seasonOptions)[Season]][]).map(([key, option]) => (
                <button
                  className={seasonPreference === key ? "is-active" : ""}
                  aria-pressed={seasonPreference === key}
                  key={key}
                  type="button"
                  onClick={(event) => {
                    selectSeason(key);
                    event.currentTarget.closest("details")?.removeAttribute("open");
                  }}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </details>
          <Link className="user-account-link" href={isLoggedIn ? "/profile" : "/login"}>
            {isLoggedIn ? "我的" : "登录"}
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <footer className="user-footer">招摇书院 · 愿你今夜有好梦</footer>
    </div>
  );
}
