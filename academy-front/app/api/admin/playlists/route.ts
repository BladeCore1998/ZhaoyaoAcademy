import { asc, desc, eq, max } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlist } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { readSongStyle, songStyleError } from "@/lib/song-style";

function readContentInput(body: unknown) {
  const value = body as Record<string, unknown>;
  const songName = typeof value.songName === "string" ? value.songName.trim() : "";
  const artist = typeof value.artist === "string" ? value.artist.trim() : "";
  const language = typeof value.language === "string" ? value.language.trim() : "";
  const style = readSongStyle(value.style);
  const summary = typeof value.summary === "string" ? value.summary.trim() : "";
  const coverUrl = typeof value.coverUrl === "string" ? value.coverUrl.trim() : "";
  const sortOrderValue = value.sortOrder;
  const sortOrder =
    typeof sortOrderValue === "number" && Number.isInteger(sortOrderValue) && sortOrderValue >= 0
      ? sortOrderValue
      : null;

  return {
    songName,
    artist,
    language,
    style,
    summary: summary || null,
    coverUrl: coverUrl || null,
    isPublished: value.isPublished === true,
    sortOrder,
  };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const rows = await db
    .select()
    .from(playlist)
    .orderBy(asc(playlist.sortOrder), desc(playlist.createdAt), desc(playlist.id));
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { style, ...input } = readContentInput(await request.json());
  if (!input.songName || !input.artist || !input.language) {
    return NextResponse.json({ error: "歌名、歌手和语言不能为空" }, { status: 400 });
  }
  if (!style) return NextResponse.json({ error: songStyleError }, { status: 400 });
  const [aggregate] = await db.select({ value: max(playlist.sortOrder) }).from(playlist);
  const sortOrder = input.sortOrder ?? (aggregate?.value == null ? 0 : Number(aggregate.value) + 1);

  const [{ id }] = await db
    .insert(playlist)
    .values({ ...input, style, sortOrder })
    .$returningId();
  const [created] = await db.select().from(playlist).where(eq(playlist.id, id));
  return NextResponse.json(created, { status: 201 });
}
