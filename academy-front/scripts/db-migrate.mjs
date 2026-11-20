/**
 * 执行 drizzle-kit migrate，并在执行前明确打印迁移目标。
 *
 * 相比直接 `drizzle-kit migrate`，这里会：
 * 1. 按 Next.js 规则加载 .env / .env.production 等环境文件；
 * 2. 在 DATABASE_URL 缺失时直接失败，不再静默回落到 localhost；
 * 3. 展示脱敏后的目标主机和库名，避免迁错库。
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const drizzleKitBin = path.join(projectRoot, "node_modules", "drizzle-kit", "bin.cjs");

const { default: nextEnv } = await import("@next/env");
nextEnv.loadEnvConfig(projectRoot, process.env.NODE_ENV !== "production");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[db:migrate] DATABASE_URL 未设置。");
  console.error("[db:migrate] 本地请在 academy-front/.env 中配置，容器请通过环境变量注入。");
  console.error("[db:migrate] 已拒绝执行：不会回落到默认 localhost 数据库。");
  process.exit(1);
}

let target;
try {
  const parsed = new URL(databaseUrl);
  target = `${parsed.protocol}//${parsed.username ? `${parsed.username}@` : ""}${parsed.hostname}:${parsed.port || 3306}${parsed.pathname}`;
} catch {
  console.error("[db:migrate] DATABASE_URL 不是合法的连接串。");
  process.exit(1);
}

console.log(`[db:migrate] 迁移目标：${target}`);

if (!existsSync(drizzleKitBin)) {
  console.error(`[db:migrate] 找不到 drizzle-kit：${drizzleKitBin}`);
  process.exit(1);
}

if (target.includes("@mysql:")) {
  console.warn("[db:migrate] 注意：mysql 是 Docker 网络内的主机名，在宿主机上执行会连接失败。");
}

const result = spawnSync(process.execPath, [drizzleKitBin, "migrate"], {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
