import { Headphones } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { playlist } from "@/db/schema";
import { curatedSongs } from "@/lib/curated-content";
import PlaylistSearch from "./PlaylistSearch";

export const dynamic = "force-dynamic";

async function getPublishedPlaylists() {
  try {
    return await db
      .select()
      .from(playlist)
      .where(eq(playlist.isPublished, true))
      .orderBy(desc(playlist.createdAt));
  } catch {
    return [];
  }
}

export default async function PlaylistsPage() {
  const playlists = await getPublishedPlaylists();
  const hasDatabaseItems = playlists.length > 0;

  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-20 pt-20 max-md:pt-5">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-9">
        <div>
          <p className="eyebrow flex items-center gap-2"><Headphones size={14} />听觉场景</p>
          <h1>歌单</h1>
          <p className="page-intro">从目标站公开歌单中整理出的院藏曲目，登录后可以收藏。</p>
        </div>
        <div className="border border-line px-4 py-3 text-sm text-muted">{hasDatabaseItems ? playlists.length : curatedSongs.length} 首院藏</div>
      </div>
      <PlaylistSearch
        items={
          hasDatabaseItems
            ? playlists.map((item) => ({
                id: String(item.id),
                title: item.title,
                summary: item.summary || "一段适合慢慢聆听的声音小景。",
                searchText: [item.title, item.summary].filter(Boolean).join(" "),
              }))
            : curatedSongs.map((song) => ({
                id: song.title,
                title: song.title,
                summary: song.note,
                searchText: [song.title, song.artist, song.language, song.style, song.note].join(" "),
                artist: song.artist,
                language: song.language,
                style: song.style,
              }))
        }
      />
    </div>
  );
}
