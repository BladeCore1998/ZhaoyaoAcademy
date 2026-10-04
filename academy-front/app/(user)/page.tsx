import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArrowUpRight, BookOpen, Feather, Mail, Music2, Radio, Sparkles } from "lucide-react";
import { db } from "@/db";
import { playlist } from "@/db/schema";
import { curatedBooks, curatedSongs, materialNotes } from "@/lib/curated-content";

export const dynamic = "force-dynamic";

const features = [
  {
    href: "/playlists",
    eyebrow: "听觉场景",
    title: "歌单",
    description: "把此刻的心绪交给一段旋律。",
    icon: Music2,
  },
  {
    href: "/books",
    eyebrow: "案头阅读",
    title: "书单",
    description: "收藏一些适合慢慢翻开的文字。",
    icon: BookOpen,
  },
  {
    href: "/mailbox",
    eyebrow: "招摇信箱",
    title: "棉花糖",
    description: "写一封信，等一盏灯亮起来。",
    icon: Mail,
  },
];

export default async function HomePage() {
  let publishedSong: typeof playlist.$inferSelect | undefined;
  try {
    [publishedSong] = await db
      .select()
      .from(playlist)
      .where(eq(playlist.isPublished, true))
      .orderBy(desc(playlist.createdAt))
      .limit(1);
  } catch {
    publishedSong = undefined;
  }

  const curatedSong = curatedSongs[0];
  const featuredSong = publishedSong
    ? {
        songName: publishedSong.songName,
        artist: publishedSong.artist,
        style: publishedSong.style,
        note: publishedSong.summary || "一段适合慢慢聆听的声音小景。",
        coverUrl: publishedSong.coverUrl || "/inspiration/3.webp",
      }
    : { ...curatedSong, coverUrl: "/inspiration/3.webp" };
  const featuredBook = curatedBooks[1];

  return (
    <>
      <section className="user-hero">
        <div className="user-hero-content">
          <p className="eyebrow flex items-center gap-2">
            <Feather size={14} />
            招摇书院 · 院藏开放日
          </p>
          <h1>
            一庭风月，
            <br />
            等你来坐。
          </h1>
          <p className="hero-lede">这里收藏歌声、书页和没有急着寄出的心事。沿着廊下灯影走走，或许正好遇见招摇夭夭。</p>
          <p className="user-hero-note">春有花信，夏有荷风，秋有桂香，冬有好梦。</p>
        </div>
      </section>
      <div className="user-page mx-auto max-w-[1180px] px-6 pb-20">
        <section className="grid gap-4 border-b border-line py-10 md:grid-cols-3" aria-label="今日院藏">
          {materialNotes.map((item) => (
            <div className="border-l-2 border-gold pl-4" key={item.label}>
              <p className="eyebrow mb-2">{item.label}</p>
              <p className="text-[17px] leading-8">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 py-12 md:grid-cols-[1.1fr_.9fr]">
          <article className="user-featured-song relative overflow-hidden p-7 md:p-9">
            <img
              className="absolute inset-y-0 right-0 h-full w-[38%] object-cover opacity-25 mix-blend-multiply"
              src={featuredSong.coverUrl}
              alt=""
            />
            <div className="absolute right-7 top-7 text-red/70">
              <Sparkles size={20} />
            </div>
            <p className="eyebrow">院藏一曲</p>
            <div className="relative max-w-[62%] max-md:max-w-[68%]">
              <h2 className="mt-8 text-3xl font-medium">{featuredSong.songName}</h2>
              <p className="mt-2 text-muted">
                {featuredSong.artist} · {featuredSong.style}
              </p>
              <p className="mt-8 max-w-[360px] leading-8 text-muted">{featuredSong.note}</p>
              <Link className="button-quiet mt-8" href="/playlists">
                浏览完整歌单 <ArrowUpRight size={16} />
              </Link>
            </div>
          </article>
          <article className="user-featured-book p-7 md:p-9">
            <p className="eyebrow">案头的一本</p>
            <h2 className="mt-8 text-3xl font-medium">{featuredBook.bookName}</h2>
            <p className="mt-2 opacity-85">
              {featuredBook.author} · {featuredBook.category}
            </p>
            <p className="mt-8 leading-8 opacity-85">{featuredBook.note}</p>
            <Link className="user-feature-link mt-8" href="/books">
              翻开书单 <ArrowUpRight size={16} />
            </Link>
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-4" aria-label="书院入口">
          {features.map(({ href, eyebrow, title, description, icon: Icon }) => (
            <Link
              className="relative min-h-[190px] border-t border-line py-6 pr-6 transition hover:border-red"
              href={href}
              key={href}
            >
              <Icon className="mb-7 text-red" size={22} strokeWidth={1.5} />
              <span className="eyebrow mb-1.5">{eyebrow}</span>
              <h2 className="mb-2 text-2xl font-medium">{title}</h2>
              <p className="text-sm text-muted">{description}</p>
              <ArrowUpRight className="absolute bottom-[22px] right-[22px] text-red" size={17} />
            </Link>
          ))}
          <a
            className="relative min-h-[190px] border-t border-line py-6 pr-6 transition hover:border-red"
            href="https://live.bilibili.com/31583828"
            rel="noopener noreferrer"
            target="_blank"
          >
            <Radio className="mb-7 text-red" size={22} strokeWidth={1.5} />
            <span className="eyebrow mb-1.5">实时相见</span>
            <h2 className="mb-2 text-2xl font-medium">直播间</h2>
            <p className="text-sm text-muted">来直播间坐坐，听夭夭和你说话。</p>
            <ArrowUpRight className="absolute bottom-[22px] right-[22px] text-red" size={17} />
          </a>
        </section>
      </div>
    </>
  );
}
