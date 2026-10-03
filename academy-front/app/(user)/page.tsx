import Link from "next/link";
import { ArrowUpRight, BookOpen, Feather, Mail, Music2, Sparkles } from "lucide-react";
import { curatedBooks, curatedSongs, materialNotes } from "@/lib/curated-content";

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

export default function HomePage() {
  const featuredSong = curatedSongs[0];
  const featuredBook = curatedBooks[1];

  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-20 pt-8">
      <section className="relative grid items-center gap-10 overflow-hidden border-b border-line pb-16 pt-10 md:min-h-[520px] md:grid-cols-[1.1fr_.9fr] md:pb-20">
        <div className="max-w-[590px]">
          <p className="eyebrow flex items-center gap-2"><Feather size={14} />招摇书院 · 院藏开放日</p>
          <h1 className="text-[clamp(38px,7vw,76px)] font-semibold leading-[1.15] tracking-[0.03em]">一庭风月，等你来坐。</h1>
          <p className="hero-lede">
            这里收藏歌声、书页和没有急着寄出的心事。沿着廊下灯影走走，或许正好遇见夭夭。
          </p>
          <div className="mt-7 flex flex-wrap gap-4">
            <Link className="button-primary" href="/playlists">
              先听一曲 <ArrowUpRight size={16} />
            </Link>
            <Link className="button-quiet" href="/mailbox">
              投递棉花糖
            </Link>
          </div>
        </div>
        <div className="relative grid min-h-[280px] place-items-center overflow-hidden border-t border-line bg-[rgba(255,251,241,.28)] md:min-h-[380px] md:border-l md:border-t-0" aria-label="招摇夭夭剪影">
          <img src="/inspiration/Xia.webp" alt="" className="absolute inset-0 size-full object-cover opacity-20 mix-blend-multiply" />
          <div className="moon" />
          <div className="figure-seal">夭</div>
          <p className="absolute bottom-[42px] text-[13px] tracking-[0.18em] text-muted">今夜宜点歌 · 明日宜读书</p>
        </div>
      </section>

      <section className="grid gap-4 border-b border-line py-10 md:grid-cols-3" aria-label="今日院藏">
        {materialNotes.map((item) => (
          <div className="border-l-2 border-gold pl-4" key={item.label}>
            <p className="eyebrow mb-2">{item.label}</p>
            <p className="text-[17px] leading-8">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 py-12 md:grid-cols-[1.1fr_.9fr]">
        <article className="relative overflow-hidden border border-line bg-[rgba(255,251,241,.52)] p-7 md:p-9">
          <div className="absolute right-7 top-7 text-red/70"><Sparkles size={20} /></div>
          <p className="eyebrow">正在播放 · 院藏一曲</p>
          <h2 className="mt-8 text-3xl font-medium">{featuredSong.title}</h2>
          <p className="mt-2 text-muted">{featuredSong.artist} · {featuredSong.style}</p>
          <p className="mt-8 max-w-[360px] leading-8 text-muted">{featuredSong.note}</p>
          <Link className="button-quiet mt-8" href="/playlists">浏览完整歌单 <ArrowUpRight size={16} /></Link>
        </article>
        <article className="border border-line bg-red p-7 text-[#fffaf0] md:p-9">
          <p className="eyebrow !text-[#f4d7be]">案头的一本</p>
          <h2 className="mt-8 text-3xl font-medium">{featuredBook.title}</h2>
          <p className="mt-2 text-[#f4d7be]">{featuredBook.author} · {featuredBook.category}</p>
          <p className="mt-8 leading-8 text-[#f8e8d9]/80">{featuredBook.note}</p>
          <Link className="button-quiet mt-8 !border-[#f4d7be] !text-[#fffaf0] hover:!bg-[#fffaf0]/10" href="/books">翻开书单 <ArrowUpRight size={16} /></Link>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="书院入口">
        {features.map(({ href, eyebrow, title, description, icon: Icon }) => (
          <Link className="relative min-h-[190px] border border-line bg-[rgba(255,251,241,.42)] p-6 transition hover:-translate-y-0.5 hover:border-red" href={href} key={href}>
            <Icon className="mb-7 text-red" size={22} strokeWidth={1.5} />
            <span className="eyebrow mb-1.5">{eyebrow}</span>
            <h2 className="mb-2 text-2xl font-medium">{title}</h2>
            <p className="text-sm text-muted">{description}</p>
            <ArrowUpRight className="absolute bottom-[22px] right-[22px] text-red" size={17} />
          </Link>
        ))}
      </section>
    </div>
  );
}
