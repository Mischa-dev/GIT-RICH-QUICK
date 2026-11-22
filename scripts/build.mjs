import { cp, mkdir, rm } from "node:fs/promises";
const root = new URL("../", import.meta.url),
  dest = new URL("dist/", root);
await rm(dest, { recursive: true, force: true });
await mkdir(dest);
for (const path of ["index.html", "src", "assets"])
  await cp(new URL(path, root), new URL(path, dest), { recursive: true });
