import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlist, songStyles } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

type SongStyle = (typeof songStyles)[number];

function isSongStyle(value: string): value is SongStyle {
  return songStyles.includes(value as SongStyle);
}

function readContentInput(body: unknown) {
  const value = body as Record<string, unknown>;
  const songName = typeof value.songName === "string" ? value.songName.trim() : "";
  const artist = typeof value.artist === "string" ? value.artist.trim() : "";
  const language = typeof value.language === "string" ? value.language.trim() : "";
  const styleValue = typeof value.style === "string" ? value.style.trim() : "";
  const style = isSongStyle(styleValue) ? styleValue : null;
  const summary = typeof value.summary === "string" ? value.summary.trim() : "";
  const coverUrl = typeof value.coverUrl === "string" ? value.coverUrl.trim() : "";

  return {
    songName,
    artist,
    language,
    style,
    summary: summary || null,
    coverUrl: coverUrl || null,
    isPublished: value.isPublished === true,
  };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const rows = await db.select().from(playlist).orderBy(desc(playlist.createdAt));
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const input = readContentInput(await request.json());
  if (!input.songName || !input.artist || !input.language || !input.style) {
    return NextResponse.json({ error: "歌名、歌手、语言和风格不能为空" }, { status: 400 });
  }
  const style = input.style;

  const [{ id }] = await db
    .insert(playlist)
    .values({ ...input, style })
    .$returningId();
  const [created] = await db.select().from(playlist).where(eq(playlist.id, id));
  return NextResponse.json(created, { status: 201 });
}
