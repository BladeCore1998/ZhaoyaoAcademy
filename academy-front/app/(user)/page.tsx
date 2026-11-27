import Image from "next/image";
import Link from "next/link";
import { and, asc, desc, eq } from "drizzle-orm";
import { ArrowUpRight, BookOpen, Feather, Mail, Music2, Radio } from "lucide-react";
import { db } from "@/db";
import { booklist, playlist } from "@/db/schema";
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

async function getFeaturedSong() {
  try {
    const [song] = await db
      .select()
      .from(playlist)
      .where(eq(playlist.isPublished, true))
      .orderBy(asc(playlist.sortOrder), desc(playlist.createdAt), desc(playlist.id))
      .limit(1);
    return song;
  } catch {
    return undefined;
  }
}

async function getFeaturedBookCover(bookName: string) {
  try {
    const [book] = await db
      .select({ coverUrl: booklist.coverUrl })
      .from(booklist)
      .where(and(eq(booklist.bookName, bookName), eq(booklist.isPublished, true)))
      .orderBy(asc(booklist.sortOrder), desc(booklist.createdAt), desc(booklist.id))
      .limit(1);
    return book?.coverUrl;
  } catch {
    return undefined;
  }
}

type FeaturedCardProps = {
  kind: "song" | "book";
  coverUrl: string;
  label: string;
  title: string;
  details: string;
  note: string;
  link: { href: string; label: string };
};

function FeaturedCard({ kind, coverUrl, label, title, details, note, link }: FeaturedCardProps) {
  const isSong = kind === "song";
  const secondaryText = isSong ? "text-muted" : "opacity-85";

  return (
    <article
      className={`user-featured-${kind} relative grid grid-cols-[minmax(0,68%)] items-start overflow-hidden p-7 [overflow-wrap:anywhere] md:row-span-5 md:grid-cols-[minmax(0,62%)] md:grid-rows-subgrid md:p-9`}
    >
      <div className="absolute inset-y-0 right-0 w-[38%] opacity-25 mix-blend-multiply">
        <Image className="object-cover" src={coverUrl} alt="" fill unoptimized />
      </div>
      <p className="eyebrow relative">{label}</p>
      <h2 className="relative mt-8 text-3xl font-medium">{title}</h2>
      <p className={`relative mt-2 ${secondaryText}`}>{details}</p>
      <p className={`relative mt-8 leading-8 ${secondaryText}`}>{note}</p>
      <Link
        className={`relative mt-8 min-h-[42px] justify-self-start ${isSong ? "button-quiet" : "user-feature-link"}`}
        href={link.href}
      >
        {link.label} <ArrowUpRight size={16} />
      </Link>
    </article>
  );
}

export default async function HomePage() {
  const featuredBook = curatedBooks[1];
  const [publishedSong, bookCoverUrl] = await Promise.all([
    getFeaturedSong(),
    getFeaturedBookCover(featuredBook.bookName),
  ]);
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

        <section className="grid gap-4 py-12 md:grid-cols-2 md:gap-y-0">
          <FeaturedCard
            kind="song"
            coverUrl={featuredSong.coverUrl}
            label="院藏一曲"
            title={featuredSong.songName}
            details={`${featuredSong.artist} · ${featuredSong.style}`}
            note={featuredSong.note}
            link={{ href: "/playlists", label: "浏览歌单" }}
          />
          <FeaturedCard
            kind="book"
            coverUrl={bookCoverUrl || "/inspiration/3.2.webp"}
            label="案头的一本"
            title={featuredBook.bookName}
            details={`${featuredBook.author} · ${featuredBook.category}`}
            note={featuredBook.note}
            link={{ href: "/books", label: "翻开书单" }}
          />
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
