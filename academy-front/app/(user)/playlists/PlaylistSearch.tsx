"use client";

import { Dice5, Music2, Play, Search, Shuffle, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const [selectedSong, setSelectedSong] = useState<PlaylistSearchItem | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!selectedSong) {
      if (dialog.open) dialog.close();
      return;
    }

    if (!dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedSong]);

  const pickRandomSong = () => {
    if (filteredItems.length === 0) return;
    const candidates =
      filteredItems.length > 1 ? filteredItems.filter((item) => item.id !== selectedSong?.id) : filteredItems;
    setSelectedSong(candidates[Math.floor(Math.random() * candidates.length)]);
  };

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
        <button
          className="button-quiet min-h-[44px] shrink-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
          type="button"
          onClick={pickRandomSong}
          disabled={filteredItems.length === 0}
          aria-label="随机点歌"
          title="随机点歌"
        >
          <Shuffle size={16} aria-hidden="true" />
          随机点歌
        </button>
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
      <dialog
        ref={dialogRef}
        className="m-auto max-h-[calc(100dvh-40px)] w-[calc(100%-40px)] max-w-[520px] overflow-y-auto border border-line bg-paper p-0 text-ink shadow-[0_22px_70px_rgba(32,37,44,.24)] backdrop:bg-ink/35 backdrop:backdrop-blur-[2px]"
        aria-labelledby="random-song-title"
        aria-describedby="random-song-summary"
        onClose={() => setSelectedSong(null)}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          ) {
            event.currentTarget.close();
          }
        }}
      >
        {selectedSong ? (
          <div className="relative px-7 py-7 max-md:px-5 max-md:py-6">
            <button
              className="absolute right-4 top-4 grid size-8 place-items-center text-muted transition-colors hover:text-red"
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="关闭随机点歌弹窗"
              title="关闭"
            >
              <X size={18} aria-hidden="true" />
            </button>
            <p className="eyebrow mb-2 flex items-center gap-2">
              <Dice5 size={14} aria-hidden="true" />
              今夜点到
            </p>
            <div className="flex items-start gap-5 border-y border-line py-5 max-md:gap-4" aria-live="polite">
              <div className="shrink-0">
                <PlaylistCover src={selectedSong.coverUrl} songName={selectedSong.songName} />
              </div>
              <div className="min-w-0 pt-1">
                <h2 id="random-song-title" className="break-words text-2xl font-medium max-md:text-xl">
                  {selectedSong.songName}
                </h2>
                <p className="mt-2 break-words text-sm text-muted">
                  {selectedSong.artist} · {selectedSong.language}
                </p>
                <span className="mt-3 inline-block text-xs tracking-[0.08em] text-red">{selectedSong.style}</span>
              </div>
            </div>
            <p id="random-song-summary" className="mt-5 break-words leading-7 text-muted">
              {selectedSong.summary}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                className="button-primary disabled:cursor-not-allowed"
                type="button"
                onClick={pickRandomSong}
                disabled={filteredItems.length < 2}
              >
                <Shuffle size={16} aria-hidden="true" />
                再点一首
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
