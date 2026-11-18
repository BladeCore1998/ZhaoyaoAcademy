import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
await import("./copy-standalone-assets.mjs");
await import("../.next/standalone/server.js");
