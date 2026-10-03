import { count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { booklist, marshmallow, playlist } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const [[playlistTotal], [publishedPlaylists], [bookTotal], [publishedBooks], [pendingMarshmallows]] =
    await Promise.all([
      db.select({ value: count() }).from(playlist),
      db.select({ value: count() }).from(playlist).where(eq(playlist.isPublished, true)),
      db.select({ value: count() }).from(booklist),
      db.select({ value: count() }).from(booklist).where(eq(booklist.isPublished, true)),
      db.select({ value: count() }).from(marshmallow).where(eq(marshmallow.status, "pending")),
    ]);

  return NextResponse.json({
    playlistTotal: Number(playlistTotal?.value ?? 0),
    publishedPlaylists: Number(publishedPlaylists?.value ?? 0),
    bookTotal: Number(bookTotal?.value ?? 0),
    publishedBooks: Number(publishedBooks?.value ?? 0),
    pendingMarshmallows: Number(pendingMarshmallows?.value ?? 0),
  });
}
