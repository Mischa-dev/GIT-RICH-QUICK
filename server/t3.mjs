import { createServer } from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";

const root = fileURLToPath(new URL("../", import.meta.url));
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
};

export const defaultPath = () =>
  process.env.GRQ_T3_DB ||
  path.join(
    process.env.T3CODE_HOME || path.join(homedir(), ".t3"),
    "userdata",
    "statev2.sqlite",
  );

function json(res, status, value) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(value));
}

// Only select public-facing thread labels and provider-reported aggregate counts. Source text,
// prompts, raw turn payloads and filesystem paths never cross the HTTP bridge.
function listThreads(db) {
  return db
    .prepare(
      `SELECT thread_id AS id, substr(title, 1, 160) AS title
    FROM orchestration_v2_projection_threads WHERE deleted_at IS NULL AND archived_at IS NULL
    ORDER BY updated_at DESC LIMIT 100`,
    )
    .all();
}

function threadUsage(db, id) {
  if (
    !db
      .prepare(
        `SELECT 1 FROM orchestration_v2_projection_threads WHERE thread_id = ? AND deleted_at IS NULL`,
      )
      .get(id)
  )
    return null;
  // inputTokens already contains cache reads/writes, outputTokens already contains reasoning.
  return db
    .prepare(
      `WITH usage AS (
    SELECT json_extract(payload_json, '$.turnTokenUsage') AS u FROM orchestration_v2_projection_provider_turns
    WHERE thread_id = ? AND json_valid(payload_json)
  ), counts AS (
    SELECT json_extract(u, '$.inputTokens') AS i, json_extract(u, '$.outputTokens') AS o
    FROM usage WHERE json_extract(u, '$.usageStatus') = 'complete' AND COALESCE(json_extract(u, '$.localCommand'),0) = 0
  ) SELECT COUNT(*) AS turns, COALESCE(SUM(i),0) AS input, COALESCE(SUM(o),0) AS output
    FROM counts WHERE typeof(i) = 'integer' AND typeof(o) = 'integer' AND i >= 0 AND o >= 0`,
    )
    .get(id);
}

function serveMeter(url, res, dbPath) {
  if (url.pathname !== "/api/t3/threads" && url.pathname !== "/api/t3/usage")
    return json(res, 404, { error: "Unknown meter endpoint." });
  let db;
  try {
    db = new DatabaseSync(dbPath, { readOnly: true, allowExtension: false });
    db.exec(
      "PRAGMA trusted_schema=OFF; PRAGMA query_only=ON; PRAGMA busy_timeout=500;",
    );
    if (url.pathname === "/api/t3/threads") {
      return json(res, 200, { threads: listThreads(db) });
    }
    const id = url.searchParams.get("thread");
    if (!id || id.length > 512)
      return json(res, 400, { error: "Choose a T3 thread." });
    const usage = threadUsage(db, id);
    return usage
      ? json(res, 200, usage)
      : json(res, 404, { error: "T3 can no longer find this thread." });
  } catch (err) {
    const message = /no such (table|column)/i.test(err.message)
      ? "This T3 database has a different schema. Select a T3 v2 statev2.sqlite file with GRQ_T3_DB."
      : /busy|locked/i.test(err.message)
        ? "T3 is updating its database. Try again in a moment."
        : "Could not read the T3 database. Run the bridge on your T3 machine or set GRQ_T3_DB to its statev2.sqlite file.";
    return json(res, 503, { error: message });
  } finally {
    db?.close();
  }
}

async function serveAsset(req, res, pathname) {
  const asset =
    pathname === "/" ? "index.html" : decodeURIComponent(pathname.slice(1));
  const ext = path.extname(asset).toLowerCase();
  const allowed =
    asset === "index.html" ||
    /^favicon\.(?:svg|png|ico)$/.test(asset) ||
    /^[\w.-]+\.(?:css|js)$/.test(asset) ||
    /^(?:assets|src)\/(?:[\w.-]+\/)*[\w.-]+$/.test(asset);
  if (
    !allowed ||
    !types[ext] ||
    asset.split("/").some((segment) => segment.startsWith("."))
  )
    return json(res, 404, { error: "File not found." });
  try {
    const file = await realpath(path.join(root, asset));
    // Do not follow symlinks from the public file set into private files.
    if (file !== path.join(await realpath(root), asset))
      return json(res, 404, { error: "File not found." });
    const data = await readFile(file);
    res.writeHead(200, {
      "Content-Type": types[ext],
      "Cache-Control": "no-cache",
    });
    res.end(req.method === "HEAD" ? undefined : data);
  } catch {
    return json(res, 404, { error: "File not found." });
  }
}

export function createBridge(dbPath = defaultPath()) {
  return createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "DENY");
    const port = req.socket.localPort;
    const host = req.headers.host;
    if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`)
      return json(res, 403, { error: "Local bridge only." });
    if (req.method !== "GET" && req.method !== "HEAD")
      return json(res, 405, { error: "Read-only bridge." });
    try {
      const url = new URL(req.url, `http://${host}`);
      if (url.origin !== `http://${host}`)
        return json(res, 403, { error: "Local bridge only." });
      if (url.pathname.startsWith("/api/")) {
        if (
          req.headers["x-grq-reader"] !== "1" ||
          (req.headers.origin && req.headers.origin !== url.origin) ||
          req.headers["sec-fetch-site"] === "cross-site"
        ) {
          return json(res, 403, {
            error: "Open the local casino to read the meter.",
          });
        }
        return serveMeter(url, res, dbPath);
      }
      return await serveAsset(req, res, url.pathname);
    } catch {
      return json(res, 400, { error: "Invalid local request." });
    }
  });
}

if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  const port = Number(process.env.GRQ_PORT || 7777);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("GRQ_PORT must be a port number between 1 and 65535.");
  const server = createBridge();
  server.on("error", (err) => {
    console.error(
      err.code === "EADDRINUSE"
        ? `Port ${port} is busy. Set GRQ_PORT to another port and try again.`
        : err.message,
    );
    process.exitCode = 1;
  });
  server.listen(port, "127.0.0.1", () =>
    console.log(
      `Git Rich Quick + T3\nOpen http://127.0.0.1:${port} and choose T3 Link.`,
    ),
  );
}
