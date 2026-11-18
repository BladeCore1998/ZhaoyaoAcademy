import { cp, readlink, readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";

async function repairWindowsLinks(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isSymbolicLink()) {
      try {
        await stat(entryPath);
      } catch (error) {
        if (error.code !== "EPERM") throw error;

        const targetPath = path.resolve(path.dirname(entryPath), await readlink(entryPath));
        await stat(targetPath);
        await unlink(entryPath);
        await cp(targetPath, entryPath, { recursive: true, dereference: true });
      }
    } else if (entry.isDirectory()) {
      await repairWindowsLinks(entryPath);
    }
  }
}

if (process.platform === "win32") {
  await repairWindowsLinks(".next/standalone/node_modules");
}

await cp(".next/static", ".next/standalone/.next/static", { recursive: true, force: true });
await cp("public", ".next/standalone/public", { recursive: true, force: true });
