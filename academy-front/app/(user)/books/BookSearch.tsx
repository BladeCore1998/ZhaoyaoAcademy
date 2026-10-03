"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { matchesSearch, normalizeSearchText } from "@/lib/content-search";

type BookSearchItem = {
  id: string;
  title: string;
  summary: string;
  searchText: string;
  author?: string;
  country?: string;
  category?: string;
  status?: string;
  coverUrl?: string | null;
};

type BookSearchProps = {
  items: BookSearchItem[];
};

export default function BookSearch({ items }: BookSearchProps) {
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
          placeholder="按书名、作者或分类寻找下一本书"
          aria-label="搜索书单"
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
        {normalizedQuery ? `找到 ${filteredItems.length} 本院藏` : `共 ${items.length} 本院藏`}
      </p>
      <div className="mt-[22px] grid gap-4 md:grid-cols-2">
        {filteredItems.length > 0 ? (
          filteredItems.map((book) => (
            <article className="group flex min-h-[180px] gap-5 border border-line bg-[rgba(255,251,241,.42)] p-[22px] transition hover:border-red" key={book.id}>
              {book.coverUrl ? (
                <img className="h-[136px] w-[42px] min-w-[42px] object-cover" src={book.coverUrl} alt="" />
              ) : book.category ? (
                <div className="grid h-[136px] w-[48px] min-w-[48px] place-items-center bg-red text-[#fffaf0] [writing-mode:vertical-rl]">{book.category}</div>
              ) : (
                <div className="grid h-[136px] w-[42px] min-w-[42px] place-items-center bg-red text-[#fffaf0] [writing-mode:vertical-rl]">书</div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-medium">{book.title}</h2>
                  {book.status ? <span className="text-xs text-red">{book.status}</span> : null}
                </div>
                <p className="mt-2 text-sm text-muted">
                  {book.author ? `${book.author} · ${book.country}` : "招摇书院推荐"}
                </p>
                <small className="mt-7 block leading-[1.7] text-muted">{book.summary}</small>
              </div>
            </article>
          ))
        ) : (
          <div className="border border-line py-12 text-center text-sm text-muted md:col-span-2">没有找到匹配的书单，请换个关键词试试。</div>
        )}
      </div>
    </>
  );
}
