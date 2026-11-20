"use client";

import { useEffect, useState } from "react";
import Pagination from "@/components/Pagination";

const ITEMS_PER_PAGE = 8;

type PublicMessage = {
  id: number;
  content: string;
  adminReply: string | null;
  isPinned?: boolean;
  createdAt: Date | string;
};

function formatMessageTime(value: Date | string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function MailboxMessages({ messages }: { messages: PublicMessage[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(messages.length / ITEMS_PER_PAGE));
  const paginatedMessages = messages.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (messages.length === 0) {
    return <p>这里会放管理员选择公开的棉花糖。</p>;
  }

  return (
    <>
      <div className="grid gap-5">
        {paginatedMessages.map((message) => (
          <article key={message.id} className="border-t border-line pt-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <time className="text-xs text-muted" dateTime={new Date(message.createdAt).toISOString()}>
                {formatMessageTime(message.createdAt)}
              </time>
              {message.isPinned ? (
                <span className="text-xs tracking-[0.08em] text-red" aria-label="置顶来信">
                  置顶
                </span>
              ) : null}
            </div>
            <p className="whitespace-pre-wrap">{message.content}</p>
            {message.adminReply ? <p className="mt-3 text-red">夭夭回复：{message.adminReply}</p> : null}
          </article>
        ))}
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  );
}
