import { Buffer } from "node:buffer";
import * as OpenCC from "opencc-js";

/**
 * 封面抓取的公共逻辑：多数据源搜索、匹配打分、图片下载校验。
 * 同时供管理端接口和 scripts/fetch-covers.ts 使用。
 */

export type CoverKind = "song" | "book";
export type CoverRegion = "cn" | "global" | "unknown";
export type CoverSource = "netease" | "douban" | "itunes" | "musicbrainz" | "openlibrary" | "googlebooks";

export type CoverQuery = {
  title: string;
  creator: string;
};

export type CoverCandidate = {
  title: string;
  creator: string;
  score: number;
  imageUrl: string;
  imageHeaders?: Record<string, string>;
  storefront?: string;
};

export type ImagePayload = {
  buffer: Buffer;
  contentType: string;
  extension: string;
};

export type ResolvedCover = CoverCandidate & {
  source: CoverSource;
  priority: number;
  image: ImagePayload;
};

export type CoverResolution = {
  best: ResolvedCover | null;
  notes: string[];
};

export type RegionInfo = {
  region: CoverRegion;
  ip: string;
  country: string;
  countryCode: string;
};

export type ResolveCoverOptions = {
  kind: CoverKind;
  title: string;
  creator: string;
  region?: CoverRegion;
  sources?: CoverSource[];
  minScore?: number;
};

export const DEFAULT_MIN_SCORE = 70;
export const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export const SOURCE_LABELS: Record<CoverSource, string> = {
  netease: "网易云音乐",
  douban: "豆瓣读书",
  itunes: "iTunes",
  musicbrainz: "MusicBrainz",
  openlibrary: "Open Library",
  googlebooks: "Google Books",
};

export const REGION_SOURCES: Record<"cn" | "global", Record<CoverKind, CoverSource[]>> = {
  cn: {
    song: ["netease", "itunes", "musicbrainz"],
    book: ["douban", "itunes", "openlibrary", "googlebooks"],
  },
  global: {
    song: ["itunes", "musicbrainz", "netease"],
    book: ["openlibrary", "googlebooks", "itunes", "douban"],
  },
};

const DEFAULT_SOURCES = REGION_SOURCES.cn;
const SOURCE_COOLDOWN_MS = 5 * 60 * 1000;
const REGION_CACHE_MS = 10 * 60 * 1000;

const twToCn = OpenCC.Converter({ from: "tw", to: "cn" });
const hkToCn = OpenCC.Converter({ from: "hk", to: "cn" });

// ---------------------------------------------------------------------------
// 文本归一化与匹配打分
// ---------------------------------------------------------------------------

export function simplify(value: string | null | undefined): string {
  return twToCn(hkToCn(String(value ?? "")));
}

/** 统一繁简、大小写，去掉括号补充说明（含作者国籍前缀）和所有标点。 */
export function normalize(value: string | null | undefined): string {
  return simplify(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/【[^】]*】|\[[^\]]*\]|（[^）]*）|\([^)]*\)/gu, " ")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function splitCreators(value: string | null | undefined): string[] {
  return String(value ?? "")
    .split(/[/、,，;；&]|\band\b/gi)
    .map((part) => normalize(part))
    .filter(Boolean);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }
  return previous[b.length];
}

function similarity(a: string, b: string): number {
  const longest = Math.max(a.length, b.length);
  return longest === 0 ? 0 : 1 - levenshtein(a, b) / longest;
}

function charOverlapRatio(a: string, b: string): number {
  const chars = [...new Set([...a])];
  if (chars.length === 0) return 0;
  const other = new Set([...b]);
  return chars.filter((char) => other.has(char)).length / chars.length;
}

const SUFFIX_PATTERN =
  /[（(【[][^()（）【】[\]]*(版|伴奏|翻唱|翻自|原唱|重制|重置|remix|live|cover|instrumental|demo)[^()（）【】[\]]*[)）】\]]/i;
const UNKNOWN_CREATORS = new Set(["未知作者", "未知", "佚名", "无名", "anonymous", "unknown", "n/a", "na", "无"]);

/** “(新版)”“(伴奏)”等后缀版本降权，保证同名原版优先。 */
function suffixPenalty(title: string): number {
  return SUFFIX_PATTERN.test(String(title ?? "")) ? 8 : 0;
}

/** 没有可靠作者/歌手时，只靠精确标题给一个及格分，避免整条记录直接漏抓。 */
function hasKnownCreator(value: string | null | undefined): boolean {
  const normalized = normalize(value);
  return Boolean(normalized) && !UNKNOWN_CREATORS.has(normalized);
}

/**
 * 标题 + 作者/歌手综合打分：
 *   标题完全相同 +60，包含关系 +34，相似度达标 +26；作者完全相同 +40，任一作者相同 +38，
 *   部分包含 +28，字符重合兜底 +18。默认阈值 70。
 */
export function scoreCandidate(
  candidateTitle: string | null | undefined,
  candidateCreator: string | null | undefined,
  query: CoverQuery,
): number {
  const candidate = normalize(candidateTitle);
  const expected = normalize(query.title);
  if (!candidate || !expected) return 0;
  const penalty = suffixPenalty(String(candidateTitle ?? ""));

  let score: number;
  if (candidate === expected) score = 60;
  else if (candidate.includes(expected) || expected.includes(candidate)) score = 34;
  else if (similarity(candidate, expected) >= 0.72) score = 26;
  else return 0;

  const candidateCreatorText = normalize(candidateCreator);
  const expectedCreatorText = normalize(query.creator);
  if (!hasKnownCreator(query.creator)) {
    return Math.max(0, score + (candidate === expected ? 10 : 0) - penalty);
  }

  if (candidateCreatorText === expectedCreatorText) {
    score += 40;
  } else {
    const candidateParts = splitCreators(candidateCreator);
    const expectedParts = splitCreators(query.creator);
    if (candidateParts.some((part) => expectedParts.includes(part))) {
      score += 38;
    } else if (
      candidateParts.some((part) => expectedParts.some((other) => part.includes(other) || other.includes(part)))
    ) {
      score += 28;
    } else if (charOverlapRatio(candidateCreatorText, expectedCreatorText) >= 0.3) {
      score += 18;
    }
  }

  return Math.max(0, score - penalty);
}

// ---------------------------------------------------------------------------
// 网络请求、限速与熔断
// ---------------------------------------------------------------------------

type SourceState = {
  failures: number;
  disabledUntil: number;
  reason: string;
};

const sourceStates = new Map<CoverSource, SourceState>();
const lastCallAt = new Map<CoverSource, number>();

function sourceState(source: CoverSource): SourceState {
  if (!sourceStates.has(source)) {
    sourceStates.set(source, { failures: 0, disabledUntil: 0, reason: "" });
  }
  return sourceStates.get(source) as SourceState;
}

export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === "TimeoutError" || error.name === "AbortError") return true;
  return /fetch failed|ENOTFOUND|ECONN|ETIMEDOUT|EAI_AGAIN|UND_ERR|socket hang up/i.test(error.message);
}

export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isSourceDisabled(source: CoverSource): boolean {
  const state = sourceState(source);
  return state.disabledUntil > Date.now();
}

function recordSourceSuccess(source: CoverSource): void {
  const state = sourceState(source);
  state.failures = 0;
  state.disabledUntil = 0;
  state.reason = "";
}

function recordSourceFailure(source: CoverSource, error: unknown): void {
  if (!isNetworkError(error)) return;
  const state = sourceState(source);
  state.failures += 1;
  if (state.failures >= 2) {
    state.disabledUntil = Date.now() + SOURCE_COOLDOWN_MS;
    state.reason = messageOf(error);
  }
}

export function disabledSources(): Array<{ source: CoverSource; reason: string }> {
  return [...sourceStates.entries()]
    .filter(([, state]) => state.disabledUntil > Date.now())
    .map(([source, state]) => ({ source, reason: state.reason }));
}

async function throttle(source: CoverSource, interval: number): Promise<void> {
  const now = Date.now();
  const last = lastCallAt.get(source) ?? 0;
  const wait = last + interval - now;
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastCallAt.set(source, Date.now());
}

export class HttpError extends Error {
  status: number;
  url: string;

  constructor(status: number, url: string) {
    super(`HTTP ${status}`);
    this.status = status;
    this.url = url;
  }
}

async function request(
  url: string,
  {
    method = "GET",
    headers = {},
    body,
    timeout = 15000,
  }: {
    method?: string;
    headers?: Record<string, string>;
    body?: BodyInit;
    timeout?: number;
  } = {},
): Promise<Response> {
  const response = await fetch(url, {
    method,
    headers: { "User-Agent": process.env.COVER_FETCH_USER_AGENT ?? DEFAULT_UA, ...headers },
    body,
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(timeout),
  });
  if (!response.ok) throw new HttpError(response.status, url);
  return response;
}

async function fetchJson<T>(url: string, options?: Parameters<typeof request>[1]): Promise<T> {
  const response = await request(url, options);
  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new Error(`响应不是合法 JSON（${url}）：${messageOf(error)}`);
  }
}

// ---------------------------------------------------------------------------
// 网络区域检测：决定国内源和国际源的优先顺序
// ---------------------------------------------------------------------------

type GeoProbe = () => Promise<{ ip: string; country: string; countryCode: string } | null>;

const GEO_PROBES: GeoProbe[] = [
  async () => {
    const response = await request("https://myip.ipip.net", { timeout: 5000 });
    const text = await response.text();
    const ip = text.match(/当前 IP[：:]\s*([0-9a-f.:]+)/i)?.[1] ?? "";
    const country = text.match(/来自于[：:]\s*(\S+)/)?.[1] ?? "";
    if (!country) return null;
    return { ip, country, countryCode: country.startsWith("中国") ? "CN" : "XX" };
  },
  async () => {
    const data = await fetchJson<{ ip?: string; country?: string; country_code?: string }>("https://api.ip.sb/geoip", {
      timeout: 5000,
    });
    return { ip: data.ip ?? "", country: data.country ?? "", countryCode: data.country_code ?? "" };
  },
  async () => {
    const data = await fetchJson<{ ip?: string; country?: string }>("https://ipinfo.io/json", { timeout: 5000 });
    return { ip: data.ip ?? "", country: data.country ?? "", countryCode: data.country ?? "" };
  },
  async () => {
    const data = await fetchJson<{ status?: string; country?: string; countryCode?: string; query?: string }>(
      "http://ip-api.com/json/?fields=status,country,countryCode,query&lang=zh-CN",
      { timeout: 5000 },
    );
    if (data.status !== "success") return null;
    return { ip: data.query ?? "", country: data.country ?? "", countryCode: data.countryCode ?? "" };
  },
];

export async function detectRegion(): Promise<RegionInfo> {
  for (const probe of GEO_PROBES) {
    try {
      const result = await probe();
      if (!result?.countryCode) continue;
      return {
        ...result,
        region: result.countryCode.toUpperCase() === "CN" ? "cn" : "global",
      };
    } catch {
      // 单个探测源失败时继续尝试下一个。
    }
  }
  return { region: "unknown", ip: "", country: "", countryCode: "" };
}

let regionCache: { at: number; info: RegionInfo } | null = null;

/** 供长驻服务复用检测结果，避免每次请求都探测一次。 */
export async function getRegion(): Promise<RegionInfo> {
  if (regionCache && Date.now() - regionCache.at < REGION_CACHE_MS) return regionCache.info;
  const info = await detectRegion();
  regionCache = { at: Date.now(), info };
  return info;
}

export function maskIp(ip: string): string {
  const parts = String(ip ?? "").split(".");
  return parts.length === 4 ? `${parts[0]}.${parts[1]}.*.*` : ip || "未知 IP";
}

export function describeRegion(info: RegionInfo, forced = false): string {
  if (forced) {
    return info.region === "cn" ? "手动指定国内网络 → 国内源优先" : "手动指定海外网络 → 国际源优先";
  }
  if (info.region === "cn") return `国内网络（${info.country || "中国"} · ${maskIp(info.ip)}）→ 国内源优先`;
  if (info.region === "global") {
    return `海外网络（${info.country || info.countryCode} · ${maskIp(info.ip)}）→ 国际源优先`;
  }
  return "网络区域检测失败 → 使用默认顺序（国内源优先）";
}

// ---------------------------------------------------------------------------
// 数据源
// ---------------------------------------------------------------------------

function withHttps(url: string): string {
  return url.replace(/^http:\/\//i, "https://");
}

type NeteaseSearchResult = {
  result?: {
    songs?: Array<{
      name?: string;
      ar?: Array<{ name?: string }>;
      al?: { picUrl?: string };
    }>;
  };
};

async function searchNetease(query: CoverQuery): Promise<CoverCandidate[]> {
  await throttle("netease", 500);
  const headers = {
    Referer: "https://music.163.com/",
    Cookie: "os=pc; appver=2.9.7",
  };
  const body = new URLSearchParams({
    s: `${query.title} ${query.creator}`,
    type: "1",
    limit: "10",
    offset: "0",
  });
  const data = await fetchJson<NeteaseSearchResult>("https://music.163.com/api/cloudsearch/pc", {
    method: "POST",
    headers,
    body,
  });
  const songs = data.result?.songs ?? [];

  return songs.flatMap((song) => {
    const picture = song.al?.picUrl;
    if (!picture) return [];
    const creators = (song.ar ?? []).map((artist) => artist.name ?? "").join(" / ");
    const imageUrl = withHttps(picture);
    return [
      {
        title: song.name ?? "",
        creator: creators,
        score: scoreCandidate(song.name, creators, query),
        imageUrl: imageUrl.includes("?") ? imageUrl : `${imageUrl}?param=600y600`,
        imageHeaders: headers,
      },
    ];
  });
}

type ITunesResult = {
  results?: Array<{
    trackName?: string;
    collectionName?: string;
    artistName?: string;
    artworkUrl60?: string;
    artworkUrl100?: string;
    artworkUrl600?: string;
  }>;
};

function pickITunesArtwork(item: NonNullable<ITunesResult["results"]>[number], kind: CoverKind): string | null {
  const raw = kind === "song" ? (item.artworkUrl600 ?? item.artworkUrl100) : (item.artworkUrl100 ?? item.artworkUrl60);
  if (!raw) return null;
  const size = kind === "song" ? 600 : 1000;
  return raw.replace(/\/\d+x\d+bb(-\d+)?\.(jpg|jpeg|png|webp)$/i, `/${size}x${size}bb.$2`);
}

async function searchITunes(query: CoverQuery, kind: CoverKind): Promise<CoverCandidate[]> {
  const entity = kind === "song" ? "song" : "ebook";
  const storefronts = kind === "song" ? ["TW", "HK", "US", "JP"] : ["US", "JP", "TW", "HK"];
  const candidates: CoverCandidate[] = [];
  let lastError: unknown = null;

  for (const country of storefronts) {
    await throttle("itunes", 400);
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
      `${query.title} ${query.creator}`,
    )}&entity=${entity}&limit=10&country=${country}&lang=zh_cn`;

    let data: ITunesResult;
    try {
      data = await fetchJson<ITunesResult>(url);
    } catch (error) {
      lastError = error;
      continue;
    }

    for (const item of data.results ?? []) {
      const title = item.trackName ?? item.collectionName ?? "";
      const creator = item.artistName ?? "";
      const imageUrl = pickITunesArtwork(item, kind);
      if (!imageUrl) continue;
      candidates.push({
        title,
        creator,
        score: scoreCandidate(title, creator, query),
        imageUrl,
        storefront: country,
      });
    }

    const bestHere = candidates
      .filter((candidate) => candidate.storefront === country)
      .sort((a, b) => b.score - a.score)[0];
    if (bestHere && bestHere.score >= 95) break;
  }

  if (candidates.length === 0 && lastError) throw lastError;
  return candidates;
}

function escapeLucene(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/[()]/g, " ");
}

type MusicBrainzResult = {
  recordings?: Array<{
    title?: string;
    "artist-credit"?: Array<{ name?: string }>;
    releases?: Array<{ id?: string }>;
  }>;
};

async function searchMusicBrainz(query: CoverQuery): Promise<CoverCandidate[]> {
  await throttle("musicbrainz", 1100);
  const userAgent =
    process.env.MUSICBRAINZ_USER_AGENT ?? "ZhaoyaoAcademyCoverFetcher/1.0 ( admin@zhaoyaoacademy.local )";
  const lucene = `recording:"${escapeLucene(query.title)}" AND artist:"${escapeLucene(query.creator)}"`;
  const url = `https://musicbrainz.org/ws/2/recording?query=${encodeURIComponent(lucene)}&fmt=json&limit=5&inc=releases`;
  const data = await fetchJson<MusicBrainzResult>(url, {
    headers: { "User-Agent": userAgent, Accept: "application/json" },
    timeout: 15000,
  });

  const candidates: CoverCandidate[] = [];
  const seenReleases = new Set<string>();
  for (const recording of data.recordings ?? []) {
    const creators = (recording["artist-credit"] ?? []).map((credit) => credit.name ?? "").join(" / ");
    const score = scoreCandidate(recording.title, creators, query);
    if (score < DEFAULT_MIN_SCORE) continue;

    for (const release of recording.releases ?? []) {
      if (!release.id || seenReleases.has(release.id)) continue;
      seenReleases.add(release.id);
      candidates.push({
        title: recording.title ?? "",
        creator: creators,
        score,
        imageUrl: `https://coverartarchive.org/release/${release.id}/front-500`,
        imageHeaders: { "User-Agent": userAgent },
      });
      if (candidates.length >= 3) break;
    }
    if (candidates.length >= 3) break;
  }

  return candidates;
}

type DoubanSubject = {
  title?: string;
  author_name?: string | string[];
  pic?: string;
  type?: string;
};

async function searchDouban(query: CoverQuery): Promise<CoverCandidate[]> {
  await throttle("douban", 900);
  const headers = { Referer: "https://book.douban.com/" };
  const url = `https://book.douban.com/j/subject_suggest?q=${encodeURIComponent(query.title)}`;
  const data = await fetchJson<DoubanSubject[] | DoubanSubject>(url, { headers });
  const subjects = Array.isArray(data) ? data : [];

  return subjects.flatMap((subject) => {
    if (subject.type && subject.type !== "b") return [];
    if (!subject.pic) return [];
    const creators = Array.isArray(subject.author_name) ? subject.author_name.join(" / ") : (subject.author_name ?? "");
    const imageUrl = withHttps(subject.pic).replace(/\/view\/subject\/[a-z]\/public\//i, "/view/subject/l/public/");
    return [
      {
        title: subject.title ?? "",
        creator: creators,
        score: scoreCandidate(subject.title, creators, query),
        imageUrl,
        imageHeaders: headers,
      },
    ];
  });
}

type OpenLibraryResult = {
  docs?: Array<{ title?: string; author_name?: string[]; cover_i?: number }>;
};

async function searchOpenLibrary(query: CoverQuery): Promise<CoverCandidate[]> {
  await throttle("openlibrary", 700);
  const primaryCreator = splitCreators(query.creator)[0];
  const params = new URLSearchParams({
    title: query.title,
    limit: "5",
    fields: "title,author_name,cover_i",
  });
  if (primaryCreator) params.set("author", primaryCreator);

  const data = await fetchJson<OpenLibraryResult>(`https://openlibrary.org/search.json?${params.toString()}`);
  return (data.docs ?? []).flatMap((doc) => {
    if (!doc.cover_i) return [];
    const creators = (doc.author_name ?? []).join(" / ");
    return [
      {
        title: doc.title ?? "",
        creator: creators,
        score: scoreCandidate(doc.title, creators, query),
        imageUrl: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
      },
    ];
  });
}

type GoogleBooksResult = {
  items?: Array<{
    volumeInfo?: {
      title?: string;
      authors?: string[];
      imageLinks?: Record<string, string | undefined>;
    };
  }>;
};

function pickGoogleBookImage(volumeInfo: NonNullable<GoogleBooksResult["items"]>[number]["volumeInfo"]): string | null {
  const links = volumeInfo?.imageLinks ?? {};
  const raw = links.extraLarge ?? links.large ?? links.medium ?? links.thumbnail ?? links.smallThumbnail;
  if (!raw) return null;
  return withHttps(raw)
    .replace(/zoom=\d+/i, "zoom=2")
    .replace(/&edge=curl/gi, "");
}

async function searchGoogleBooks(query: CoverQuery): Promise<CoverCandidate[]> {
  await throttle("googlebooks", 700);
  const primaryCreator = splitCreators(query.creator)[0];
  const expression = `intitle:"${query.title}"${primaryCreator ? `+inauthor:"${primaryCreator}"` : ""}`;
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(expression)}&maxResults=5&country=US`;
  const data = await fetchJson<GoogleBooksResult>(url);

  return (data.items ?? []).flatMap((item) => {
    const info = item.volumeInfo ?? {};
    const creators = (info.authors ?? []).join(" / ");
    const imageUrl = pickGoogleBookImage(info);
    if (!imageUrl) return [];
    return [
      {
        title: info.title ?? "",
        creator: creators,
        score: scoreCandidate(info.title, creators, query),
        imageUrl,
      },
    ];
  });
}

const ADAPTERS: Record<CoverSource, (query: CoverQuery, kind: CoverKind) => Promise<CoverCandidate[]>> = {
  netease: searchNetease,
  douban: searchDouban,
  itunes: searchITunes,
  musicbrainz: searchMusicBrainz,
  openlibrary: searchOpenLibrary,
  googlebooks: searchGoogleBooks,
};

// ---------------------------------------------------------------------------
// 图片下载与校验
// ---------------------------------------------------------------------------

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function detectImage(buffer: Buffer): { contentType: string; extension: string } | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { contentType: "image/jpeg", extension: "jpg" };
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return { contentType: "image/png", extension: "png" };
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { contentType: "image/webp", extension: "webp" };
  }
  if (buffer.length >= 6 && buffer.subarray(0, 3).toString("ascii") === "GIF") {
    return { contentType: "image/gif", extension: "gif" };
  }
  return null;
}

export async function downloadImage(candidate: CoverCandidate): Promise<ImagePayload> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(candidate.imageUrl, {
        headers: {
          "User-Agent": process.env.COVER_FETCH_USER_AGENT ?? DEFAULT_UA,
          ...(candidate.imageHeaders ?? {}),
        },
        redirect: "follow",
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new HttpError(response.status, candidate.imageUrl);

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 3 * 1024) throw new Error(`图片过小（${buffer.length} 字节）`);

      const detected = detectImage(buffer);
      if (!detected) throw new Error("响应不是受支持的图片");
      return { buffer, contentType: detected.contentType, extension: detected.extension };
    } catch (error) {
      lastError = error;
      // 图片 CDN 偶发超时，网络类错误重试一次；HTTP 错误和无效图片直接放弃。
      if (!isNetworkError(error) || attempt === 1) break;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  throw lastError;
}

// ---------------------------------------------------------------------------
// 对外入口
// ---------------------------------------------------------------------------

export function sourceOrder(kind: CoverKind, sources?: CoverSource[], region?: CoverRegion): CoverSource[] {
  const table = region && region !== "unknown" ? REGION_SOURCES[region] : DEFAULT_SOURCES;
  if (!sources || sources.length === 0) return table[kind];
  const selected = sources.filter((source) => table[kind].includes(source));
  return selected.length > 0 ? selected : table[kind];
}

type SourceAttempt = {
  resolved: ResolvedCover | null;
  notes: string[];
};

async function attemptSource(
  source: CoverSource,
  priority: number,
  query: CoverQuery,
  kind: CoverKind,
  minScore: number,
): Promise<SourceAttempt> {
  const notes: string[] = [];
  if (isSourceDisabled(source)) {
    return { resolved: null, notes: [`${SOURCE_LABELS[source]}：已跳过（${sourceState(source).reason}）`] };
  }

  let candidates: CoverCandidate[];
  try {
    candidates = await ADAPTERS[source](query, kind);
    recordSourceSuccess(source);
  } catch (error) {
    recordSourceFailure(source, error);
    return { resolved: null, notes: [`${SOURCE_LABELS[source]}：${messageOf(error)}`] };
  }

  const ranked = candidates
    .filter((candidate) => candidate.score >= minScore)
    .sort((a, b) => b.score - a.score || normalize(a.title).length - normalize(b.title).length)
    .slice(0, 3);

  if (ranked.length === 0) {
    const top = candidates.reduce((max, candidate) => Math.max(max, candidate.score), 0);
    return { resolved: null, notes: [`${SOURCE_LABELS[source]}：无匹配（最高 ${top} 分）`] };
  }

  for (const candidate of ranked) {
    try {
      const image = await downloadImage(candidate);
      return { resolved: { ...candidate, source, priority, image }, notes };
    } catch (error) {
      notes.push(`${SOURCE_LABELS[source]}：${messageOf(error)}`);
      if (isNetworkError(error)) recordSourceFailure(source, error);
    }
  }

  return { resolved: null, notes };
}

/**
 * 按批次查询数据源：同批次并行，兼顾响应速度和请求量。拿到 95 分以上的高置信图片即提前结束；
 * 某个源下载失败会继续尝试后续源，最终取分数最高的可用结果。
 */
const resolutionCache = new Map<string, { at: number; value: ResolvedCover }>();
const RESOLUTION_CACHE_MS = 10 * 60 * 1000;
const RESOLUTION_CACHE_LIMIT = 50;

function cacheKeyOf(
  kind: CoverKind,
  title: string,
  creator: string,
  region?: CoverRegion,
  sources?: CoverSource[],
  minScore?: number,
): string {
  return `${kind}|${region ?? "unknown"}|${sources?.join(",") ?? ""}|${minScore ?? DEFAULT_MIN_SCORE}|${normalize(
    title,
  )}|${normalize(creator)}`;
}

export async function resolveCover(options: ResolveCoverOptions): Promise<CoverResolution> {
  const { kind, title, creator, minScore = DEFAULT_MIN_SCORE, sources, region } = options;
  const query: CoverQuery = { title, creator };
  const cacheKey = cacheKeyOf(kind, title, creator, region, sources, minScore);
  const cached = resolutionCache.get(cacheKey);
  if (cached && Date.now() - cached.at < RESOLUTION_CACHE_MS) {
    return { best: cached.value, notes: [] };
  }

  const notes: string[] = [];
  let best: ResolvedCover | null = null;

  const order = sourceOrder(kind, sources, region);
  for (let index = 0; index < order.length; index += 2) {
    const batch = order.slice(index, index + 2);
    const results = await Promise.all(
      batch.map((source, offset) => attemptSource(source, index + offset, query, kind, minScore)),
    );

    for (const result of results) {
      notes.push(...result.notes);
      const resolved = result.resolved;
      if (
        resolved &&
        (!best || resolved.score > best.score || (resolved.score === best.score && resolved.priority < best.priority))
      ) {
        best = resolved;
      }
    }

    if (best && best.score >= 95) break;
  }

  if (best) {
    if (resolutionCache.size >= RESOLUTION_CACHE_LIMIT) {
      const oldest = resolutionCache.keys().next().value;
      if (oldest) resolutionCache.delete(oldest);
    }
    resolutionCache.set(cacheKey, { at: Date.now(), value: best });
  }

  return { best, notes };
}

export function describeCandidate(candidate: ResolvedCover): string {
  const storefront = candidate.storefront ? `/${candidate.storefront}` : "";
  const creator = simplify(candidate.creator);
  return `${SOURCE_LABELS[candidate.source]}${storefront} ${candidate.score} 分「${simplify(candidate.title)}」${
    creator ? ` - ${creator}` : ""
  }`;
}
