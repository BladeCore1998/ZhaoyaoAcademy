import { cp } from "node:fs/promises";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
await cp(".next/static", ".next/standalone/.next/static", { recursive: true, force: true });
await cp("public", ".next/standalone/public", { recursive: true, force: true });
await import("../.next/standalone/server.js");
