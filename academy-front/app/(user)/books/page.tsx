import { LibraryBig } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { booklist } from "@/db/schema";
import { curatedBooks } from "@/lib/curated-content";
import BookSearch from "./BookSearch";

export const dynamic = "force-dynamic";

async function getPublishedBooks() {
  try {
    return await db
      .select()
      .from(booklist)
      .where(eq(booklist.isPublished, true))
      .orderBy(desc(booklist.createdAt));
  } catch {
    return [];
  }
}

export default async function BooksPage() {
  const books = await getPublishedBooks();
  const hasDatabaseItems = books.length > 0;

  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-20 pt-20 max-md:pt-5">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-9">
        <div>
          <p className="eyebrow flex items-center gap-2"><LibraryBig size={14} />案头阅读</p>
          <h1>书单</h1>
          <p className="page-intro">从目标站公开书单中整理出的阅读路径，留给愿意慢慢翻开的人。</p>
        </div>
        <div className="border border-line px-4 py-3 text-sm text-muted">{hasDatabaseItems ? books.length : curatedBooks.length} 本院藏</div>
      </div>
      <BookSearch
        items={
          hasDatabaseItems
            ? books.map((book) => ({
                id: String(book.id),
                title: book.title,
                summary: book.summary || "留给愿意慢读的人。",
                searchText: [book.title, book.summary].filter(Boolean).join(" "),
                coverUrl: book.coverUrl,
              }))
            : curatedBooks.map((book) => ({
                id: book.title,
                title: book.title,
                summary: book.note,
                searchText: [book.title, book.author, book.country, book.category, book.status, book.note].join(" "),
                author: book.author,
                country: book.country,
                category: book.category,
                status: book.status,
              }))
        }
      />
    </div>
  );
}
