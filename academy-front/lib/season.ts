export type Season = "spring" | "summer" | "autumn" | "winter";
export type SeasonPreference = "auto" | Season;

export function getCurrentSeason(date = new Date()): Season {
  const month = Number(new Intl.DateTimeFormat("en-US", { month: "numeric", timeZone: "Asia/Shanghai" }).format(date));
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

export function isSeasonPreference(value: string | null): value is SeasonPreference {
  return value === "auto" || value === "spring" || value === "summer" || value === "autumn" || value === "winter";
}
