/**
 * 检查迁移 SQL 是否满足 DDL 规约：
 *
 * 1. CREATE TABLE 的每个列和表本身都必须有 COMMENT。
 * 2. ALTER TABLE ADD/MODIFY/CHANGE COLUMN 必须带 COMMENT。
 * 3. 没有 drizzle/meta 快照的手写迁移必须包含 SET NAMES utf8mb4。
 *
 * drizzle-kit 的 MySQL 方言不输出 COMMENT，所以这一步必须在提交前人工补齐。
 * 用法：node scripts/check-sql-comments.mjs [迁移文件...]
 * 不传文件时检查相对 HEAD 变化或新增的 drizzle/*.sql。
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const drizzleDir = path.join(projectRoot, "drizzle");

function blankOut(match) {
  return match.replace(/[^\n]/g, " ");
}

function stripComments(sql) {
  const withoutBlocks = sql.replace(/\/\*[\s\S]*?\*\//g, blankOut);

  return withoutBlocks
    .split("\n")
    .map((line) => {
      let single = false;
      let double = false;
      let backtick = false;

      for (let index = 0; index < line.length; index += 1) {
        const char = line[index];

        if (char === "'" && !double && !backtick) single = !single;
        else if (char === '"' && !single && !backtick) double = !double;
        else if (char === "`" && !single && !double) backtick = !backtick;
        else if (!single && !double && !backtick && char === "-" && line[index + 1] === "-") {
          return `${line.slice(0, index)}${" ".repeat(line.length - index)}`;
        }
      }

      return line;
    })
    .join("\n");
}

function splitTopLevel(value, separator) {
  const parts = [];
  let start = 0;
  let depth = 0;
  let single = false;
  let double = false;
  let backtick = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (char === "'" && !double && !backtick) single = !single;
    else if (char === '"' && !single && !backtick) double = !double;
    else if (char === "`" && !single && !double) backtick = !backtick;
    else if (single || double || backtick) continue;
    else if (char === "(") depth += 1;
    else if (char === ")") depth -= 1;
    else if (char === separator && depth === 0) {
      parts.push({ text: value.slice(start, index), start });
      start = index + 1;
    }
  }

  parts.push({ text: value.slice(start), start });
  return parts;
}

function splitStatements(sql) {
  return splitTopLevel(sql, ";")
    .map((part) => {
      const leading = part.text.length - part.text.trimStart().length;
      return { text: part.text.trim(), offset: part.start + leading };
    })
    .filter((statement) => statement.text.length > 0);
}

function findClosingParen(value, openIndex) {
  let depth = 0;
  let single = false;
  let double = false;
  let backtick = false;

  for (let index = openIndex; index < value.length; index += 1) {
    const char = value[index];

    if (char === "'" && !double && !backtick) single = !single;
    else if (char === '"' && !single && !backtick) double = !double;
    else if (char === "`" && !single && !double) backtick = !backtick;
    else if (single || double || backtick) continue;
    else if (char === "(") depth += 1;
    else if (char === ")") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  return -1;
}

function lineOf(sql, offset) {
  return sql.slice(0, offset).split("\n").length;
}

const hasComment = (text) => /\bCOMMENT\s+/i.test(text);

function checkCreateTable(statement) {
  const openIndex = statement.text.indexOf("(");
  if (openIndex === -1) return [];

  const closeIndex = findClosingParen(statement.text, openIndex);
  if (closeIndex === -1) return [];

  const problems = [];
  const body = statement.text.slice(openIndex + 1, closeIndex);

  for (const column of splitTopLevel(body, ",")) {
    const definition = column.text.trim();
    if (!definition.startsWith("`")) continue;
    if (hasComment(definition)) continue;
    problems.push({
      offset: statement.offset + openIndex + 1 + column.start,
      message: `列 ${definition.split(/\s/)[0]} 缺少 COMMENT`,
    });
  }

  const tail = statement.text.slice(closeIndex + 1);
  if (!/COMMENT\s*=/i.test(tail)) {
    problems.push({ offset: statement.offset, message: "表本身缺少 COMMENT='...' " });
  }

  return problems;
}

function checkAlterTable(statement) {
  const match = statement.text.match(/^ALTER\s+TABLE\s+(`[^`]+`|\S+)/i);
  if (!match) return [];

  const problems = [];
  const actionsStart = statement.offset + match[0].length;

  for (const action of splitTopLevel(statement.text.slice(match[0].length), ",")) {
    const text = action.text.trim();
    const offset = actionsStart + action.start + (action.text.length - action.text.trimStart().length);

    const isAddColumn =
      /^ADD\s+/i.test(text) &&
      !/^ADD\s+(PRIMARY|UNIQUE|KEY|INDEX|CONSTRAINT|FOREIGN|FULLTEXT|SPATIAL|CHECK)\b/i.test(text);
    const isModifyColumn = /^(MODIFY|CHANGE)\s+(COLUMN\s+)?(`|\w+)/i.test(text);

    if (!isAddColumn && !isModifyColumn) continue;
    if (hasComment(text)) continue;

    const target = text.match(/(?:ADD|MODIFY|CHANGE)\s+(?:COLUMN\s+)?(`[^`]+`|\w+)(?:\s+(`[^`]+`))?/i);
    problems.push({
      offset,
      message: `变更列 ${target?.[2] ?? target?.[1] ?? ""} 缺少 COMMENT`.replace("变更列  缺少", "变更列缺少"),
    });
  }

  return problems;
}

function checkStatement(statement) {
  if (/^CREATE\s+TABLE\b/i.test(statement.text)) return checkCreateTable(statement);
  if (/^ALTER\s+TABLE\b/i.test(statement.text)) return checkAlterTable(statement);
  return [];
}

async function collectFiles(args) {
  const explicit = args.filter((file) => file.toLowerCase().endsWith(".sql"));
  if (explicit.length > 0) {
    return explicit.map((file) => path.resolve(process.cwd(), file));
  }

  const commands = [
    ["diff", "--name-only", "HEAD", "--", "drizzle"],
    ["ls-files", "--others", "--exclude-standard", "--", "drizzle"],
  ];

  const files = new Set();
  for (const [subcommand, ...rest] of commands) {
    const result = spawnSync("git", [subcommand, ...rest], { cwd: projectRoot, encoding: "utf8" });
    if (result.status !== 0) continue;
    for (const file of result.stdout.split("\n").map((line) => line.trim())) {
      if (file.endsWith(".sql")) files.add(path.join(projectRoot, file));
    }
  }

  return [...files];
}

const files = await collectFiles(process.argv.slice(2));

if (files.length === 0) {
  console.log("[db:lint] 没有需要检查的迁移文件。");
  process.exit(0);
}

const failures = [];

for (const file of files) {
  const relative = path.relative(projectRoot, file).replaceAll(path.sep, "/");
  const sql = await readFile(file, "utf8");
  const stripped = stripComments(sql);

  const tag = path.basename(file, ".sql");
  // drizzle-kit 的快照文件名是 {序号}_snapshot.json，例如 0004_snapshot.json。
  const sequence = tag.match(/^(\d+)/)?.[1];
  const hasSnapshot = sequence
    ? existsSync(path.join(drizzleDir, "meta", `${sequence.padStart(4, "0")}_snapshot.json`))
    : false;
  if (!hasSnapshot && !/SET\s+NAMES\s+utf8mb4/i.test(stripped)) {
    failures.push(`${relative}:1 手写迁移缺少 SET NAMES utf8mb4`);
  }

  for (const statement of splitStatements(stripped)) {
    for (const problem of checkStatement(statement)) {
      failures.push(`${relative}:${lineOf(stripped, problem.offset)} ${problem.message}`);
    }
  }
}

if (failures.length > 0) {
  console.error("[db:lint] 迁移 SQL 不满足 DDL 规约：");
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error("[db:lint] drizzle-kit 不会生成 MySQL COMMENT，请在生成的 SQL 中手工补齐表和字段注释。");
  process.exit(1);
}

console.log(`[db:lint] 已检查 ${files.length} 个迁移文件，COMMENT 与字符集符合规约。`);
