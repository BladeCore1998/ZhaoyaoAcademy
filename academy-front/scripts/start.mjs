import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const standaloneServer = new URL("../server.js", import.meta.url);

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
