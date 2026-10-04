"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function getPageItems(currentPage: number, totalPages: number): Array<number | "ellipsis-left" | "ellipsis-right"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const sortedPages = [...pages].filter((page) => page > 0 && page <= totalPages).sort((a, b) => a - b);
  const items: Array<number | "ellipsis-left" | "ellipsis-right"> = [];

  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1];
    if (previousPage && page - previousPage > 1) {
      items.push(index === 1 ? "ellipsis-left" : "ellipsis-right");
    }
    items.push(page);
  });

  return items;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2 border-t border-line pt-5" aria-label="分页">
      <button
        className="grid size-9 place-items-center border border-line text-muted transition-colors hover:border-red hover:text-red disabled:cursor-not-allowed disabled:opacity-40"
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="上一页"
        title="上一页"
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </button>
      {getPageItems(currentPage, totalPages).map((item) =>
        typeof item === "number" ? (
          <button
            className={`grid size-9 place-items-center border text-sm transition-colors ${
              item === currentPage
                ? "border-red bg-red text-[#fffaf0]"
                : "border-line text-muted hover:border-red hover:text-red"
            }`}
            type="button"
            key={item}
            onClick={() => onPageChange(item)}
            aria-current={item === currentPage ? "page" : undefined}
            aria-label={`第 ${item} 页`}
          >
            {item}
          </button>
        ) : (
          <span className="grid size-9 place-items-center text-sm text-muted" key={item}>
            …
          </span>
        ),
      )}
      <button
        className="grid size-9 place-items-center border border-line text-muted transition-colors hover:border-red hover:text-red disabled:cursor-not-allowed disabled:opacity-40"
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="下一页"
        title="下一页"
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
      <span className="ml-2 text-xs text-muted">
        第 {currentPage} / {totalPages} 页
      </span>
    </nav>
  );
}
