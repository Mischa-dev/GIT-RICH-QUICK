import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
const root = new URL("../", import.meta.url);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};
const port = Number(process.env.PORT || 4173);
const server = createServer(async (req, res) => {
  try {
    const pathname =
      new URL(req.url, "http://localhost").pathname.slice(1) || "index.html";
    if (
      !["GET", "HEAD"].includes(req.method) ||
      !(
        pathname === "index.html" ||
        /^(?:assets|src)\/(?:[\w-]+\/)*[\w.-]+$/.test(pathname)
      ) ||
      !mime[extname(pathname)]
    ) {
      res.writeHead(404).end();
      return;
    }
    const bytes = await readFile(new URL(pathname, root));
    res
      .writeHead(200, {
        "Content-Type": mime[extname(pathname)],
        "X-Content-Type-Options": "nosniff",
      })
      .end(req.method === "HEAD" ? undefined : bytes);
  } catch {
    res.writeHead(404).end();
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log("Git Rich Quick is open at http://127.0.0.1:" + port),
);
