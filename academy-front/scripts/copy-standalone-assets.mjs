import { existsSync } from "node:fs";
import { cp, readlink, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

async function repairWindowsLinks(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isSymbolicLink()) {
      const targetPath = path.resolve(path.dirname(entryPath), await readlink(entryPath));
      const targetInfo = await stat(targetPath);

      await unlink(entryPath);
      await cp(targetPath, entryPath, { recursive: true, dereference: true });
      if (targetInfo.isDirectory()) await repairWindowsLinks(entryPath);
    } else if (entry.isDirectory()) {
      await repairWindowsLinks(entryPath);
    }
  }
}

async function copyVirtualStoreDependencies(directory) {
  const virtualStoreDependencies = path.join(directory, ".pnpm", "node_modules");

  if (existsSync(virtualStoreDependencies)) {
    await cp(virtualStoreDependencies, directory, { recursive: true, force: false });
  }
}

if (process.platform === "win32") {
  await repairWindowsLinks(".next/standalone/node_modules");
  await copyVirtualStoreDependencies(".next/standalone/node_modules");
}

await cp(".next/static", ".next/standalone/.next/static", { recursive: true, force: true });
await cp("public", ".next/standalone/public", { recursive: true, force: true });
await cp("scripts/start.mjs", ".next/standalone/scripts/start.mjs", { recursive: true, force: true });
// Next.js supplies traced dependencies; pnpm must not reinstall the source dependency tree.
await writeFile(
  ".next/standalone/package.json",
  `${JSON.stringify(
    {
      name: "academy-front-standalone",
      private: true,
      scripts: {
        start: "node scripts/start.mjs",
      },
    },
    null,
    2,
  )}\n`,
);
