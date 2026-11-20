import { existsSync } from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const standaloneServer = new URL("../server.js", import.meta.url);

// Git Bash 会把 HOSTNAME 导出为机器名，standalone 服务器据此只绑定该地址，
// 导致 localhost 无法访问。未显式指定监听地址时统一监听所有网卡。
if (process.env.HOSTNAME === os.hostname()) process.env.HOSTNAME = "0.0.0.0";

if (existsSync(standaloneServer)) {
  await import(standaloneServer.href);
} else {
  const { default: nextEnv } = await import("@next/env");

  process.chdir(projectRoot);
  process.env.NODE_ENV = "production";
  nextEnv.loadEnvConfig(projectRoot);
  await import("./copy-standalone-assets.mjs");
  await import("../.next/standalone/server.js");
}
