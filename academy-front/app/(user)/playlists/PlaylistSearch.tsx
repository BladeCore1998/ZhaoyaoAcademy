"use client";

import { Music2, Play, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { matchesSearch, normalizeSearchText } from "@/lib/content-search";
import Pagination from "@/components/Pagination";

const ITEMS_PER_PAGE = 8;

type PlaylistSearchItem = {
  id: string;
  songName: string;
  summary: string;
  searchText: string;
  artist: string;
  language: string;
  style: string;
  coverUrl?: string | null;
};

type PlaylistSearchProps = {
  items: PlaylistSearchItem[];
};

function PlaylistCover({ src, songName }: { src?: string | null; songName: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);

  return (
    <div className="relative grid aspect-square size-[72px] place-items-center overflow-hidden border border-line bg-paper-deep text-gold max-md:size-[58px]">
      {src && src !== failedSource ? (
        <img
          className="absolute inset-0 block size-full object-cover object-center"
          src={src}
          alt={`${songName}封面`}
          loading="lazy"
          onError={() => setFailedSource(src)}
        />
      ) : (
        <Music2 className="size-6 max-md:size-5" aria-hidden="true" />
      )}
    </div>
  );
}

export default function PlaylistSearch({ items }: PlaylistSearchProps) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("");
  const [style, setStyle] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const normalizedQuery = normalizeSearchText(query);
  const languages = useMemo(() => Array.from(new Set(items.map((item) => item.language))).sort(), [items]);
  const styles = useMemo(() => Array.from(new Set(items.map((item) => item.style))).sort(), [items]);
  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          (!normalizedQuery || matchesSearch(item.searchText, normalizedQuery)) &&
          (!language || item.language === language) &&
          (!style || item.style === style),
      ),
    [items, language, normalizedQuery, style],
  );
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [language, normalizedQuery, style]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-3" role="search">
        <div className="flex min-w-[220px] flex-1 items-center gap-3 border border-line bg-[rgba(255,251,241,.42)] px-4 py-3 text-muted focus-within:border-red">
          <Search size={16} aria-hidden="true" />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            type="text"
            inputMode="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="按歌名、歌手或简介寻找今晚的声音"
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
        <select
          className="border border-line bg-transparent px-3 py-3 text-sm text-ink"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          aria-label="按语言筛选"
        >
          <option value="">全部语言</option>
          {languages.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          className="border border-line bg-transparent px-3 py-3 text-sm text-ink"
          value={style}
          onChange={(event) => setStyle(event.target.value)}
          aria-label="按风格筛选"
        >
          <option value="">全部风格</option>
          {styles.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-3 text-xs text-muted" role="status" aria-live="polite">
        {normalizedQuery || language || style ? `找到 ${filteredItems.length} 首院藏` : `共 ${items.length} 首院藏`}
      </p>
      <div className="mt-5 border-t border-line">
        {paginatedItems.length > 0 ? (
          paginatedItems.map((item, index) => (
            <article
              className="grid grid-cols-[64px_72px_minmax(0,1fr)_auto] items-center gap-4 border-b border-line py-5 transition-colors hover:bg-[rgba(255,251,241,.32)] max-md:grid-cols-[34px_58px_minmax(0,1fr)_auto] max-md:gap-3"
              key={item.id}
            >
              <span className="text-lg text-gold">
                {String((currentPage - 1) * ITEMS_PER_PAGE + index + 1).padStart(2, "0")}
              </span>
              <PlaylistCover src={item.coverUrl} songName={item.songName} />
              <div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h2 className="font-medium">{item.songName}</h2>
                  <span className="text-xs tracking-[0.08em] text-red">{item.style}</span>
                </div>
                <p className="mt-2 text-muted">
                  {item.artist} · {item.language} · {item.summary}
                </p>
              </div>
              <button
                className="grid size-[38px] place-items-center border border-red bg-transparent text-red transition-colors hover:bg-red/8"
                type="button"
                aria-label={`播放${item.songName}`}
              >
                <Play size={16} />
              </button>
            </article>
          ))
        ) : (
          <div className="border-b border-line py-12 text-center text-sm text-muted">
            没有找到匹配的歌单，请换个关键词试试。
          </div>
        )}
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  );
}
