import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { once } from "node:events";
import { createBridge } from "../server/t3.mjs";
import { promptLink } from "../src/t3.js";

let folder, filename, db, bridge, origin;
const headers = { "X-GRQ-Reader": "1" };
const addTurn = (id, usage, thread = "first") =>
  db
    .prepare(
      `INSERT INTO orchestration_v2_projection_provider_turns VALUES (?, ?, ?)`,
    )
    .run(
      id,
      thread,
      JSON.stringify({
        turnTokenUsage: usage,
        tokenUsage: { usedTokens: 88000 },
        context: "private context",
      }),
    );
const urlFor = (server) => `http://127.0.0.1:${server.address().port}`;

before(async () => {
  folder = await mkdtemp(path.join(tmpdir(), "grq-t3-"));
  filename = path.join(folder, "statev2.sqlite");
  db = new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode=WAL;
    CREATE TABLE orchestration_v2_projection_threads (thread_id TEXT PRIMARY KEY, title TEXT, updated_at TEXT, deleted_at TEXT, archived_at TEXT);
    CREATE TABLE orchestration_v2_projection_provider_turns (provider_turn_id TEXT PRIMARY KEY, thread_id TEXT, payload_json TEXT);
    INSERT INTO orchestration_v2_projection_threads VALUES ('first', 'Forecast the build', '2026-11-01', NULL, NULL), ('other', 'Offline job', '2026-10-01', NULL, '2026-10-02');`);
  addTurn("a", {
    usageStatus: "complete",
    inputTokens: 600,
    cachedInputTokens: 400,
    outputTokens: 70,
    reasoningTokens: 30,
  });
  addTurn("b", { usageStatus: "partial", outputTokens: 3 });
  addTurn("c", { usageStatus: "unavailable" });
  addTurn("d", {
    usageStatus: "complete",
    localCommand: true,
    inputTokens: 999,
    outputTokens: 25,
  });
  addTurn(
    "e",
    { usageStatus: "complete", inputTokens: 2000, outputTokens: 1 },
    "other",
  );
  bridge = createBridge(filename).listen(0, "127.0.0.1");
  await once(bridge, "listening");
  origin = urlFor(bridge);
});
after(async () => {
  await new Promise((resolve) => bridge.close(resolve));
  db.close();
  await rm(folder, { recursive: true, force: true });
});

test("lists only active thread identifiers and titles", async () => {
  const res = await fetch(origin + "/api/t3/threads", { headers });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), {
    threads: [{ id: "first", title: "Forecast the build" }],
  });
});

test("reads totals from complete provider usage, excludes command/context counters and sees subsequent T3 writes", async () => {
  const address = origin + "/api/t3/usage?thread=first";
  assert.deepEqual(await (await fetch(address, { headers })).json(), {
    turns: 1,
    input: 600,
    output: 70,
  });
  addTurn("live", {
    usageStatus: "complete",
    inputTokens: 1555,
    outputTokens: 222,
  });
  assert.deepEqual(await (await fetch(address, { headers })).json(), {
    turns: 2,
    input: 2155,
    output: 292,
  });
  assert.equal(
    (await fetch(origin + "/api/t3/usage?thread=missing", { headers })).status,
    404,
  );
});

test("unconfigured T3 installation leaves the casino server available without creating a database", async () => {
  const absent = path.join(folder, "missing.sqlite");
  const server = createBridge(absent).listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const response = await fetch(urlFor(server) + "/api/t3/threads", {
      headers,
    });
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /GRQ_T3_DB/);
    await assert.rejects(access(absent));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("meter requires a same-origin read request and only serves public game files", async () => {
  assert.equal((await fetch(origin + "/api/t3/threads")).status, 403);
  assert.equal(
    (await fetch(origin + "/api/t3/threads", { method: "POST", headers }))
      .status,
    405,
  );
  assert.equal(
    (
      await fetch(origin + "/api/t3/threads", {
        headers: { ...headers, Origin: "https://unrelated.example" },
      })
    ).status,
    403,
  );
  assert.equal((await fetch(origin + "/server/t3.mjs")).status, 404);
  assert.equal((await fetch(origin + "/src/t3.js")).status, 200);
});

test("T3 prompt handoff encodes edited brief as a draft in the official client", () => {
  const brief = "Ship A & B.\nKeep the # symbol? ✓";
  const href = new URL(promptLink(brief));
  assert.equal(href.origin + href.pathname, "https://app.t3.codes/new");
  assert.deepEqual([...href.searchParams], [["prompt", brief]]);
});
