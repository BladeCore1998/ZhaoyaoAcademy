/**
 * 检查 db/schema.ts 是否还有未生成的迁移。
 *
 * 做法：把 drizzle/ 复制到临时目录，针对副本再跑一次 drizzle-kit generate。
 * 如果副本里出现了新文件或内容变化，说明有 schema 变更没有落成 drizzle/*.sql。
 *
 * 退出码：0 无漂移；1 存在未生成的变更；2 检查过程本身失败。
 */
import { spawnSync } from "node:child_process";
import { cp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const drizzleDir = path.join(projectRoot, "drizzle");
const drizzleKitBin = path.join(projectRoot, "node_modules", "drizzle-kit", "bin.cjs");
const tempConfigName = "drizzle-drift.tmp.config.ts";
const tempConfigPath = path.join(projectRoot, tempConfigName);
// drizzle-kit 会把 out 当成相对 cwd 的路径，这里放到 node_modules 下，避免污染仓库。
const tempDrizzleRelative = "node_modules/.cache/drizzle-drift-check";
const tempDrizzleDir = path.join(projectRoot, tempDrizzleRelative);

const toPosix = (value) => value.replaceAll(path.sep, "/");

async function listFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(root, entryPath)));
    } else {
      files.push(toPosix(path.relative(root, entryPath)));
    }
  }

  return files.sort();
}

async function findDrift(candidateDir) {
  const generated = await listFiles(candidateDir);
  const drifted = [];

  for (const relativePath of generated) {
    const targetPath = path.join(drizzleDir, relativePath);

    if (!existsSync(targetPath)) {
      drifted.push(relativePath);
      continue;
    }

    const [candidate, target] = await Promise.all([
      readFile(path.join(candidateDir, relativePath)),
      readFile(targetPath),
    ]);
    if (!candidate.equals(target)) drifted.push(relativePath);
  }

  return drifted;
}

function buildConfig() {
  return `import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema.ts",
  out: ${JSON.stringify(tempDrizzleRelative)},
  dialect: "mysql",
  dbCredentials: { url: "mysql://drift-check:drift-check@127.0.0.1:3306/drift_check" },
} satisfies Config;
`;
}

function fail(message, detail) {
  console.error(`[db:check] ${message}`);
  if (detail) console.error(detail.trim());
  process.exit(2);
}

if (!existsSync(drizzleDir)) fail("找不到 drizzle/ 目录。");
if (!existsSync(drizzleKitBin)) fail(`找不到 drizzle-kit：${drizzleKitBin}`);

await rm(tempDrizzleDir, { recursive: true, force: true });
await cp(drizzleDir, tempDrizzleDir, { recursive: true });

let spawned;
try {
  await writeFile(tempConfigPath, buildConfig(), "utf8");
  spawned = spawnSync(process.execPath, [drizzleKitBin, "generate", "--config", tempConfigName], {
    cwd: projectRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL ?? "mysql://drift-check:drift-check@127.0.0.1:3306/drift_check",
    },
    timeout: 120_000,
    stdio: ["ignore", "pipe", "pipe"],
  });
} finally {
  await rm(tempConfigPath, { force: true });
}

const output = `${spawned.stdout ?? ""}\n${spawned.stderr ?? ""}`;

try {
  if (spawned.error) fail("drizzle-kit generate 无法执行：", String(spawned.error));
  // 该版本 drizzle-kit 在快照读取失败时仍可能返回 0，所以同时检查 stderr。
  if (spawned.status !== 0 || /\bError\b/.test(spawned.stderr ?? "")) {
    fail(
      "drizzle-kit generate 执行失败，无法判断是否存在漂移。",
      `${output}\n如果是重命名或删除列，请手动运行 pnpm db:generate 并交互确认后再检查。`,
    );
  }

  const drifted = await findDrift(tempDrizzleDir);

  if (drifted.length > 0) {
    console.error("[db:check] db/schema.ts 存在未生成的变更：");
    for (const file of drifted) console.error(`  - ${file}`);
    console.error("[db:check] 请运行 pnpm db:generate 生成迁移 SQL，并检查 COMMENT 后再提交。");
    process.exit(1);
  }

  console.log("[db:check] schema 与 drizzle/ 一致，没有遗漏的迁移。");
} finally {
  await rm(tempDrizzleDir, { recursive: true, force: true });
}
