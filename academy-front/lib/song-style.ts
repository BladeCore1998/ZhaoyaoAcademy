export const songStyleMaxLength = 64;
export const songStyleError = `请输入 1 至 ${songStyleMaxLength} 个字符的风格`;

export function readSongStyle(value: unknown) {
  const style = typeof value === "string" ? value.trim() : "";
  return style && style.length <= songStyleMaxLength ? style : null;
}

export function getSongStyleOptions(songs: readonly { style: string }[]) {
  return Array.from(new Set(songs.map((song) => song.style).filter(Boolean))).sort();
}
