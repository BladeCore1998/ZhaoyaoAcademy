"use client";

import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { matchesSearch, normalizeSearchText } from "@/lib/content-search";
import Pagination from "@/components/Pagination";

const ITEMS_PER_PAGE = 8;

type BookSearchItem = {
  id: string;
  bookName: string;
  summary: string;
  searchText: string;
  author: string;
  country: string;
  category: string;
  status?: string;
  coverUrl?: string | null;
};

type BookSearchProps = {
  items: BookSearchItem[];
};

export default function BookSearch({ items }: BookSearchProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const normalizedQuery = normalizeSearchText(query);
  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category))).sort(), [items]);
  const countries = useMemo(() => Array.from(new Set(items.map((item) => item.country))).sort(), [items]);
  const statuses = useMemo(() => Array.from(new Set(items.map((item) => item.status).filter(Boolean))).sort(), [items]);
  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          (!normalizedQuery || matchesSearch(item.searchText, normalizedQuery)) &&
          (!category || item.category === category) &&
          (!country || item.country === country) &&
          (!status || item.status === status),
      ),
    [category, country, items, normalizedQuery, status],
  );
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [category, country, normalizedQuery, status]);

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
            placeholder="按书名、作者或简介寻找下一本书"
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
        <select
          className="border border-line bg-transparent px-3 py-3 text-sm text-ink"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="按类型筛选"
        >
          <option value="">全部类型</option>
          {categories.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          className="border border-line bg-transparent px-3 py-3 text-sm text-ink"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          aria-label="按国家筛选"
        >
          <option value="">全部国家</option>
          {countries.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          className="border border-line bg-transparent px-3 py-3 text-sm text-ink"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="按阅读状态筛选"
        >
          <option value="">全部阅读状态</option>
          {statuses.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-3 text-xs text-muted" role="status" aria-live="polite">
        {normalizedQuery || category || country || status
          ? `找到 ${filteredItems.length} 本院藏`
          : `共 ${items.length} 本院藏`}
      </p>
      <div className="mt-[22px] grid gap-4 md:grid-cols-2">
        {paginatedItems.length > 0 ? (
          paginatedItems.map((book) => (
            <article
              className="group flex min-h-[220px] items-start gap-6 border border-line bg-[rgba(255,251,241,.42)] p-6 transition hover:border-red max-md:min-h-[190px] max-md:gap-4 max-md:p-5"
              key={book.id}
            >
              {book.coverUrl ? (
                <img
                  className="h-40 w-28 min-w-28 object-cover object-[68%_center] max-md:h-32 max-md:w-[88px] max-md:min-w-[88px]"
                  src={book.coverUrl}
                  alt=""
                />
              ) : (
                <div className="grid h-40 w-28 min-w-28 place-items-center bg-red text-[#fffaf0] [writing-mode:vertical-rl] max-md:h-32 max-md:w-[88px] max-md:min-w-[88px]">
                  {book.category || "书"}
                </div>
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <h2 className="text-lg font-medium leading-tight">{book.bookName}</h2>
                  {book.status ? <span className="shrink-0 text-xs text-red">{book.status}</span> : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {book.author} · {book.country} · {book.category}
                </p>
                <small className="mt-8 block max-w-[38rem] leading-7 text-muted">{book.summary}</small>
              </div>
            </article>
          ))
        ) : (
          <div className="border border-line py-12 text-center text-sm text-muted md:col-span-2">
            没有找到匹配的书单，请换个关键词试试。
          </div>
        )}
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  );
}
