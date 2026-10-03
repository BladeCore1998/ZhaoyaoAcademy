"use client";

import { Play, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { matchesSearch, normalizeSearchText } from "@/lib/content-search";

type PlaylistSearchItem = {
  id: string;
  title: string;
  summary: string;
  searchText: string;
  artist?: string;
  language?: string;
  style?: string;
};

type PlaylistSearchProps = {
  items: PlaylistSearchItem[];
};

export default function PlaylistSearch({ items }: PlaylistSearchProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeSearchText(query);
  const filteredItems = useMemo(
    () =>
      normalizedQuery
        ? items.filter((item) => matchesSearch(item.searchText, normalizedQuery))
        : items,
    [items, normalizedQuery],
  );

  return (
    <>
      <div className="mt-8 flex items-center gap-3 border border-line bg-[rgba(255,251,241,.42)] px-4 py-3 text-muted focus-within:border-red" role="search">
        <Search size={16} aria-hidden="true" />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          type="text"
          inputMode="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="按歌名、歌手或风格寻找今晚的声音"
          aria-label="搜索歌单"
        />
        {query ? (
          <button
            className="grid size-6 shrink-0 place-items-center text-muted transition-colors hover:text-red"
            type="button"
            onClick={() => setQuery("")}
            aria-label="清除搜索"
            title="清除搜索"
          >
            <X size={15} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-muted" role="status" aria-live="polite">
        {normalizedQuery ? `找到 ${filteredItems.length} 首院藏` : `共 ${items.length} 首院藏`}
      </p>
      <div className="mt-5 border-t border-line">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <article className="grid grid-cols-[64px_1fr_auto] items-center gap-[18px] border-b border-line py-6 max-md:grid-cols-[40px_1fr_auto]" key={item.id}>
              <span className="text-lg text-gold">{String(index + 1).padStart(2, "0")}</span>
              <div>
                {item.artist || item.style ? (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h2 className="font-medium">{item.title}</h2>
                    {item.style ? <span className="text-xs tracking-[0.08em] text-red">{item.style}</span> : null}
                  </div>
                ) : (
                  <h2 className="mb-2 font-medium">{item.title}</h2>
                )}
                <p className={item.artist ? "mt-2 text-muted" : "text-muted"}>
                  {item.artist ? `${item.artist} · ${item.language} · ${item.summary}` : item.summary}
                </p>
              </div>
              <button className="grid size-[38px] place-items-center border border-red bg-transparent text-red transition-colors hover:bg-red/8" type="button" aria-label={`播放${item.title}`}>
                <Play size={16} />
              </button>
            </article>
          ))
        ) : (
          <div className="border-b border-line py-12 text-center text-sm text-muted">没有找到匹配的歌单，请换个关键词试试。</div>
        )}
      </div>
    </>
  );
}
