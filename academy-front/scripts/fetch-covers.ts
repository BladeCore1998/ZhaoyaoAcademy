#!/usr/bin/env node
/**
 * 抓取歌曲专辑封面 / 书籍封面，校验后上传 RustFS，并把结果回填到数据库。
 *
 * 用法：
 *   pnpm covers:fetch                         # 预览模式，只抓取和校验，不上传、不写库
 *   pnpm covers:fetch -- --type=song          # 只处理歌曲
 *   pnpm covers:fetch -- --limit=5            # 只处理前 5 条
 *   pnpm covers:fetch -- --apply              # 真正上传 RustFS 并回填 cover_url
 *   pnpm covers:fetch -- --apply --refresh    # 已有正式封面的记录也重新抓取
 *   pnpm covers:fetch -- --apply --ids=3,4    # 只处理指定 id
 *   pnpm covers:fetch -- --out-dir=./tmp/covers  # 额外把图片保存到本地，方便肉眼检查
 *
 * 数据源会根据当前出口 IP 自动决定优先级，也可以用 --region=cn|global 手动指定。
 */

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";
import mysql from "mysql2/promise";
import { Client } from "minio";
import {
  DEFAULT_MIN_SCORE,
  SOURCE_LABELS,
  describeCandidate,
  describeRegion,
  detectRegion,
  disabledSources,
  resolveCover,
  sourceOrder,
  type CoverKind,
  type CoverRegion,
  type CoverSource,
} from "../lib/cover-search";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
loadEnvConfig(projectRoot);

const PLACEHOLDER_PREFIX = "/inspiration/";

const TABLES: Record<CoverKind, { table: string; title: string; creator: string }> = {
  song: { table: "playlist", title: "song_name", creator: "artist" },
  book: { table: "booklist", title: "book_name", creator: "author" },
};

type CliOptions = {
  type: "all" | CoverKind;
  limit: number | null;
  ids: number[] | null;
  refresh: boolean;
  apply: boolean;
  outDir: string | null;
  sources: CoverSource[] | null;
  region: "auto" | "cn" | "global";
  regionResolved: CoverRegion;
  minScore: number;
  verbose: boolean;
  help: boolean;
};

function printHelp(): void {
  console.log(`用法：node scripts/fetch-covers.ts [选项]

选项：
  --type=song|book|all   处理类型，默认 all
  --limit=N              每种类型最多处理 N 条
  --ids=1,2,3            只处理指定记录 id
  --refresh              已有正式封面的记录也重新抓取
  --apply                上传 RustFS 并回填数据库（默认只预览）
  --out-dir=PATH         额外把抓到的图片保存到本地目录
  --sources=a,b          覆盖数据源顺序，可用：${Object.keys(SOURCE_LABELS).join("、")}
  --region=auto|cn|global 网络区域策略，默认 auto（自动检测 IP 归属）
  --min-score=N          匹配分数阈值，默认 ${DEFAULT_MIN_SCORE}
  --verbose              打印每个数据源的尝试过程
  --help                 显示本帮助

示例：
  pnpm covers:fetch -- --type=book --limit=3
  pnpm covers:fetch -- --apply`);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    type: "all",
    limit: null,
    ids: null,
    refresh: false,
    apply: false,
    outDir: null,
    sources: null,
    region: "auto",
    regionResolved: "unknown",
    minScore: DEFAULT_MIN_SCORE,
    verbose: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const [flag, inlineValue] = arg.split("=", 2);
    const readValue = (): string => {
      if (inlineValue !== undefined) return inlineValue;
      index += 1;
      if (index >= argv.length) throw new Error(`参数 ${flag} 缺少取值`);
      return argv[index];
    };

    switch (flag) {
      case "--":
        // pnpm 会把分隔符原样透传，直接忽略。
        break;
      case "--type":
        options.type = readValue() as CliOptions["type"];
        break;
      case "--limit":
        options.limit = Number(readValue());
        break;
      case "--ids":
        options.ids = readValue()
          .split(",")
          .map((value) => Number(value.trim()))
          .filter((value) => Number.isInteger(value) && value > 0);
        break;
      case "--refresh":
        options.refresh = true;
        break;
      case "--apply":
        options.apply = true;
        break;
      case "--out-dir":
        options.outDir = path.resolve(projectRoot, readValue());
        break;
      case "--sources":
        options.sources = readValue()
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean) as CoverSource[];
        break;
      case "--region":
        options.region = readValue() as CliOptions["region"];
        break;
      case "--min-score":
        options.minScore = Number(readValue());
        break;
      case "--verbose":
        options.verbose = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        throw new Error(`未知参数：${arg}`);
    }
  }

  if (!["all", "song", "book"].includes(options.type)) {
    throw new Error(`--type 只能是 all、song 或 book，收到：${options.type}`);
  }
  if (options.limit !== null && (!Number.isInteger(options.limit) || options.limit <= 0)) {
    throw new Error("--limit 必须是正整数");
  }
  if (!Number.isFinite(options.minScore) || options.minScore < 0 || options.minScore > 140) {
    throw new Error("--min-score 必须在 0 到 140 之间");
  }
  if (options.ids && options.ids.length === 0) {
    throw new Error("--ids 没有解析出有效的 id");
  }
  if (options.sources) {
    const unknown = options.sources.filter((name) => !(name in SOURCE_LABELS));
    if (unknown.length > 0) throw new Error(`未知数据源：${unknown.join("、")}`);
  }
  if (!["auto", "cn", "global"].includes(options.region)) {
    throw new Error(`--region 只能是 auto、cn 或 global，收到：${options.region}`);
  }

  return options;
}

function maskConnectionString(value: string): string {
  try {
    const url = new URL(value);
    if (url.password) url.password = "***";
    return url.toString();
  } catch {
    return value;
  }
}

type Row = {
  id: number;
  title: string;
  creator: string;
  coverUrl: string | null;
};

async function loadRows(connection: mysql.Connection, kind: CoverKind, options: CliOptions): Promise<Row[]> {
  const { table, title, creator } = TABLES[kind];
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (!options.refresh) {
    conditions.push("(cover_url IS NULL OR cover_url = '' OR cover_url LIKE ?)");
    params.push(`${PLACEHOLDER_PREFIX}%`);
  }
  if (options.ids) {
    conditions.push(`id IN (${options.ids.map(() => "?").join(", ")})`);
    params.push(...options.ids);
  }

  const where = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
  let sql = `SELECT id, ${title} AS title, ${creator} AS creator, cover_url AS coverUrl FROM ${table}${where} ORDER BY id`;
  if (options.limit) {
    sql += " LIMIT ?";
    params.push(options.limit);
  }

  const [rows] = await connection.query(sql, params);
  return rows as Row[];
}

type Storage = {
  client: Client;
  bucket: string;
  ready: boolean;
};

function createStorage(): Storage {
  const endpoint = new URL(process.env.RUSTFS_ENDPOINT ?? "http://127.0.0.1:9000");
  const client = new Client({
    endPoint: endpoint.hostname,
    port: endpoint.port ? Number(endpoint.port) : endpoint.protocol === "https:" ? 443 : 80,
    useSSL: endpoint.protocol === "https:",
    accessKey: process.env.RUSTFS_ACCESS_KEY ?? "academy",
    secretKey: process.env.RUSTFS_SECRET_KEY ?? "academy-secret",
  });
  return {
    client,
    bucket: process.env.RUSTFS_BUCKET ?? "zhaoyao-academy",
    ready: false,
  };
}

async function uploadImage(
  storage: Storage,
  kind: CoverKind,
  id: number,
  image: { buffer: Buffer; contentType: string; extension: string },
): Promise<string> {
  if (!storage.ready) {
    if (!(await storage.client.bucketExists(storage.bucket))) {
      await storage.client.makeBucket(storage.bucket);
    }
    storage.ready = true;
  }

  const hash = createHash("sha1").update(image.buffer).digest("hex").slice(0, 8);
  const key = `cover/${kind}/${id}-${hash}.${image.extension}`;
  await storage.client.putObject(storage.bucket, key, image.buffer, image.buffer.length, {
    "Content-Type": image.contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
  });
  return key;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("缺少 DATABASE_URL，请在 academy-front/.env.local 中配置");

  const kinds: CoverKind[] = options.type === "all" ? ["song", "book"] : [options.type];
  const forcedRegion = options.region !== "auto";
  const regionInfo = forcedRegion
    ? { region: options.region as CoverRegion, ip: "", country: "", countryCode: "" }
    : await detectRegion();
  options.regionResolved = regionInfo.region;

  console.log(`数据库：${maskConnectionString(databaseUrl)}`);
  console.log(`网络区域：${describeRegion(regionInfo, forcedRegion)}`);
  if (options.apply) {
    const endpoint = process.env.RUSTFS_ENDPOINT ?? "http://127.0.0.1:9000";
    console.log(`RustFS：${endpoint} / ${process.env.RUSTFS_BUCKET ?? "zhaoyao-academy"}`);
    console.log("模式：写入（会上传 RustFS 并回填 cover_url）");
  } else {
    console.log("模式：预览（不上传、不写库；加 --apply 才会落库）");
  }
  if (options.outDir) console.log(`本地副本：${options.outDir}`);
  console.log("");

  const connection = await mysql.createConnection(databaseUrl);
  const storage = options.apply ? createStorage() : null;

  try {
    const jobs: Array<{ kind: CoverKind; row: Row }> = [];
    for (const kind of kinds) {
      const rows = await loadRows(connection, kind, options);
      for (const row of rows) jobs.push({ kind, row });
    }

    if (jobs.length === 0) {
      console.log("没有需要处理的记录。已有正式封面时可用 --refresh 重新抓取。");
      return;
    }

    if (options.outDir) await mkdir(options.outDir, { recursive: true });

    const summary = { success: 0, failed: 0 };
    const failures: Array<{ kind: CoverKind; row: Row; notes: string[] }> = [];

    for (let index = 0; index < jobs.length; index += 1) {
      const { kind, row } = jobs[index];
      const prefix = `[${index + 1}/${jobs.length}] ${kind === "song" ? "歌曲" : "书籍"} #${row.id}`;
      const label = `${row.title}${row.creator ? ` - ${row.creator}` : ""}`;

      if (options.verbose) {
        const order = sourceOrder(kind, options.sources ?? undefined, options.regionResolved);
        console.log(`    数据源顺序：${order.map((source) => SOURCE_LABELS[source]).join(" → ")}`);
      }

      const { best, notes } = await resolveCover({
        kind,
        title: row.title,
        creator: row.creator,
        region: options.regionResolved,
        sources: options.sources ?? undefined,
        minScore: options.minScore,
      });

      if (!best) {
        summary.failed += 1;
        failures.push({ kind, row, notes });
        console.log(`${prefix} ${label} ✗`);
        for (const note of notes) console.log(`    · ${note}`);
        continue;
      }

      let key: string | null = null;

      if (options.outDir) {
        const localPath = path.join(options.outDir, `${kind}-${row.id}.${best.image.extension}`);
        await writeFile(localPath, best.image.buffer);
      }
      if (options.apply && storage) {
        key = await uploadImage(storage, kind, row.id, best.image);
        await connection.execute(`UPDATE ${TABLES[kind].table} SET cover_url = ? WHERE id = ?`, [
          `/api/media/${key}`,
          row.id,
        ]);
      }

      summary.success += 1;
      const size = `${Math.round(best.image.buffer.length / 1024)}KB`;
      console.log(`${prefix} ${label} → ${describeCandidate(best)} · ${size} ${key ? `· ${key}` : "· 预览"}`);
      if (options.verbose) {
        for (const note of notes) console.log(`    · ${note}`);
      }
    }

    console.log("");
    console.log(`完成：成功 ${summary.success}，失败 ${summary.failed}。`);
    if (!options.apply) console.log("这是预览结果，未写入数据库。确认无误后加 --apply 再执行。");

    const disabled = disabledSources();
    if (disabled.length > 0) {
      console.log("");
      console.log("本次运行中以下数据源因网络不可达被跳过：");
      for (const item of disabled) console.log(`  · ${SOURCE_LABELS[item.source]}（${item.reason}）`);
    }

    if (failures.length > 0) {
      console.log("");
      console.log("未抓取到封面的记录：");
      for (const failure of failures) {
        console.log(`  · ${TABLES[failure.kind].table} #${failure.row.id} ${failure.row.title}`);
      }
    }
  } finally {
    await connection.end();
  }
}

main().catch((error: unknown) => {
  console.error(`执行失败：${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
