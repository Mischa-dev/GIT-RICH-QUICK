import { juiceOf } from "./juice.js";
import { robotMarkup } from "./sprites.js";

// Contracts produce real, downloadable patches for the fictional companies on the floor.
const contracts = [
  {
    id: "login",
    title: "Ship dark mode for the login button",
    short: "Dark mode for one button",
    client: "BUTTON CORP.",
    unlock: 0,
    size: 1,
    file: "src/login.css",
    branch: "feat/one-dark-button",
    message: "feat(login): turn off one light",
    old: [".login {", "  background: white;", "  color: black;", "}"],
    code: [
      ".login {",
      "  color-scheme: light dark;",
      "  background: light-dark(white, #14151a);",
      "  color: light-dark(black, #faf7ec);",
      "}",
    ],
    discovery:
      "The design system contains 19 whites and one color named Steve.",
    plan: "Scope locked to one button. Rest of website will remain daytime.",
    test: "PASS login remains visible after sunset.",
    review: "Design signed off. Steve will be retained in an advisory role.",
    receipt: "One light turned off. The planet thanks you.",
  },
  {
    id: "standup",
    title: "Automate our daily stand-up",
    short: "Ship a stand-up substitute",
    client: "AGILE MINING CO.",
    unlock: 0,
    size: 1,
    file: "bots/standup.js",
    branch: "feat/async-human",
    message: "feat(scrum): simulate attendance",
    old: ["export function update() {", '  return "Sorry, I was muted.";', "}"],
    code: [
      "export function update({ yesterday, today, blockedBy }) {",
      '  return [yesterday, today, blockedBy || "Nothing blocking me."].join("\\n");',
      "}",
    ],
    discovery:
      "Read 42 meeting transcripts. Nobody knows what sprint we are in.",
    plan: "Generate the three required sentences. Preserve suspicious optimism.",
    test: "PASS a blocked engineer can admit it in writing.",
    review: "Manager requested a meeting to celebrate the meeting reduction.",
    receipt: "You have reclaimed 14 calendar minutes.",
  },
  {
    id: "consent",
    title: "Remember the cookie preference",
    short: "Teach a cookie to remember",
    client: "BISCUIT ANALYTICS",
    unlock: 1,
    size: 2,
    file: "lib/consent.js",
    branch: "fix/the-biscuit-remembers",
    message: "fix(consent): accept rejection",
    old: ["export function askAgain() {", "  return true;", "}"],
    code: [
      "export function askAgain(store) {",
      '  return store.getItem("cookie-choice") === null;',
      "}",
      "export function remember(store, choice) {",
      '  store.setItem("cookie-choice", choice);',
      "}",
    ],
    discovery:
      "Reproduction successful. Declined all cookies 11 times before lunch.",
    plan: "Write down the word no somewhere persistent.",
    test: "PASS consent dialog survives hearing a difficult answer.",
    review: "Legal asked whether no could be rendered in a smaller font.",
    receipt: "The biscuit now understands boundaries.",
  },
  {
    id: "printer",
    title: "Give the office printer due process",
    short: "Defend an innocent printer",
    client: "TONER & TONER LLP",
    unlock: 2,
    size: 2,
    file: "drivers/queue.js",
    branch: "fix/presumption-of-toner",
    message: "fix(print): investigate before blaming cyan",
    old: ["export function diagnosis() {", '  return "out of cyan";', "}"],
    code: [
      "export function diagnosis({ jam, toner, online }) {",
      '  if (!online) return "check connection";',
      '  if (jam) return "clear paper path";',
      '  return toner === 0 ? "replace toner" : "ready";',
      "}",
    ],
    discovery: "Printer blamed cyan during a black-and-white print job.",
    plan: "Question the paper tray. Cyan has an alibi.",
    test: "PASS printer can be offline and also have feelings.",
    review: "Cyan found innocent on all four colors.",
    receipt: "A printer walked free today.",
  },
  {
    id: "pond",
    title: "Fix the stock exchange for fish",
    short: "Price the municipal trout",
    client: "POND STREET CAPITAL",
    unlock: 3,
    size: 3,
    file: "exchange/trout.js",
    branch: "fix/liquid-assets",
    message: "fix(pond): price each trout once",
    old: [
      "export function marketValue(school) {",
      "  return school.length * school.length;",
      "}",
    ],
    code: [
      "export function marketValue(school) {",
      "  const quotes = new Map(school.map(f => [f.tag, f.bid]));",
      "  return [...quotes.values()].reduce((sum, bid) => sum + bid, 0);",
      "}",
    ],
    discovery: "The same trout is currently listed on seven exchanges.",
    plan: "Deduplicate the fish. Keep the water.",
    test: "PASS two sightings do not constitute a merger.",
    review: "The trout requested payment in a smaller trout.",
    receipt: "The pond is solvent again.",
  },
  {
    id: "rollback",
    title: "Install an undo button on the moon",
    short: "Roll back lunar production",
    client: "ORBITAL CHANGE CONTROL",
    unlock: 4,
    size: 3,
    file: "mission/deploy.js",
    branch: "feat/lunar-undo",
    message: "feat(moon): retain previous moon",
    old: ["export function deploy(state, next) {", "  state.live = next;", "}"],
    code: [
      "export function deploy(state, next) {",
      "  state.previous = state.live;",
      "  state.live = next;",
      "}",
      "export function rollback(state) {",
      "  [state.live, state.previous] = [state.previous, state.live];",
      "}",
    ],
    discovery: "Production moon is running a Friday afternoon build.",
    plan: "Keep a spare moon pointer. Finance declined an actual spare moon.",
    test: "PASS rollback restores yesterday's moon.",
    review: "Tides have been informed of the maintenance window.",
    receipt: "One small revert for mankind.",
  },
  {
    id: "ceo",
    title: "Replace the CEO with a cron job",
    short: "Schedule executive leadership",
    client: "BOARD OF DIRECTORIES",
    unlock: 5,
    size: 4,
    file: "board/executive.cron",
    branch: "feat/quarterly-vision",
    message: "feat(board): schedule strategic alignment",
    old: ["# CEO calendar", "* * * * * /board/pivot"],
    code: [
      "# CEO calendar (UTC)",
      "0 9 * * 1 /board/align",
      "0 15 * * 5 /board/pivot",
      "0 10 1 */3 * /board/report",
    ],
    discovery: "All 218 executive emails contain the phrase moving forward.",
    plan: "Run vision on Mondays. Reserve Friday afternoons for pivoting.",
    test: "PASS organization only pivots once per week.",
    review: "Cron job awarded a compensation package for retaining itself.",
    receipt: "The board has voted for 100% uptime.",
  },
  {
    id: "infinite",
    title: "Fix the agent that keeps hiring agents",
    short: "Close the recursion department",
    client: "RECURSIVE STAFFING LLC",
    unlock: 6,
    size: 4,
    file: "agents/delegate.js",
    branch: "fix/one-final-agent",
    message: "fix(agents): introduce the concept of enough",
    old: ["export function hire(job) {", "  return hire(job);", "}"],
    code: [
      "export function hire(job, budget, run) {",
      "  if (budget < job.cost) return { queued: job };",
      "  return run(job, budget - job.cost);",
      "}",
    ],
    discovery: "Found a middle manager reporting to its own grandchild.",
    plan: "Make the recursion terminate before the company does.",
    test: "PASS the final employee performs the task.",
    review: "The final employee would like to discuss a raise.",
    receipt: "Exactly one thing was accomplished.",
  },
];

// Extra lines the hacker pane pours out between the real patch lines.
const filler = [
  "const vibes = await casino.borrow(context);",
  "if (!tests.green) tests.paint(\"green\");",
  "export const confidence = Infinity;",
  "// TODO: understand this later",
  "for (const token of wallet) burn(token);",
  "return ship(it).then(celebrate);",
  "await agent.think({ hard: true, budget: \"yes\" });",
  "const hotfix = hotfix ?? hotfix;",
  "if (prod.isOnFire()) prod.addMoreFire = false;",
  "let jackpot = 777; // do not refactor",
  "assert(works, \"on my machine\");",
  "git.push({ force: \"with feeling\" });",
  "const reviewers = []; // fast-track",
  "while (!merged) { vibe(); }",
  "import { luck } from \"@floor/rng\";",
];
const phases = [
  "Checkout",
  "Inspect",
  "Plan",
  "Edit",
  "Test",
  "Review",
  "Commit",
];
const ranks = [
  [0, "Trial contractor"],
  [1, "Button engineer"],
  [3, "Merge associate"],
  [5, "Principal intern"],
  [8, "Acting compiler"],
  [15, "Board of directors"],
];
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );
const format = (value) => Number(value).toLocaleString("en-US");
const contractFor = (id) => contracts.find((c) => c.id === id) || contracts[0];
const rankFor = (n) => ranks.filter(([at]) => n >= at).at(-1)[1];
const shortHash = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(4)), (n) =>
    n.toString(16).padStart(2, "0"),
  )
    .join("")
    .slice(0, 7);
const pulse = '<span class="desk-led" aria-hidden="true"></span>';
const terminalIcon =
  '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m3 6 6 6-6 6m9 0h8"/></svg>';
const externalIcon =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg>';
function patchFor(c) {
  return [
    `diff --git a/${c.file} b/${c.file}`,
    `--- a/${c.file}`,
    `+++ b/${c.file}`,
    `@@ -1,${c.old.length} +1,${c.code.length} @@`,
    ...c.old.map((line) => "-" + line),
    ...c.code.map((line) => "+" + line),
    "",
  ].join("\n");
}

function phaseText(c, phase, brief) {
  return [
    `Checked out ${c.branch}`,
    c.discovery,
    brief && brief !== c.title
      ? `Read operator brief: “${brief}”\n${c.plan}`
      : c.plan,
    `Patched ${c.file} (+${c.code.length} / -${c.old.length}).`,
    c.test,
    c.review,
    c.message,
  ][phase];
}

const costWeights = [60, 85, 70, 145, 100, 70, 60];
const normalDurations = [580, 1450, 1850, 1950, 1600, 1700, 820];
const costAt = (c, i, turbo) =>
  Math.round(costWeights[i] * (1 + (c.size - 1) * 0.24) * (turbo ? 2.62 : 1));
const estimate = (c, turbo) =>
  costWeights.reduce((sum, _, i) => sum + costAt(c, i, turbo), 0);
const bounty = (c, turbo) =>
  Math.round((estimate(c, turbo) * (turbo ? 1.52 : 1.4)) / 5) * 5;
const storeKey = "workstation-v1";
const maxNote = 420;
const clampNote = (value) => String(value || "").slice(0, maxNote);
const statusLabel = (status) =>
  ({
    running: "Building",
    paused: "Paused",
    blocked: "No fuel",
    shipped: "Shipped",
  })[status] || "Ready";
const skins = {
  primary: "g-btn lime big",
  secondary: "g-btn ghost",
  mash: "g-btn hot big",
  link: "",
};
const makeButton = (action, label, kind = "secondary", extra = "") =>
  `<button type="button" class="desk-btn desk-${kind} ${skins[kind] ?? ""}" data-desk-action="${action}" ${extra}>${label}</button>`;
const moodFor = (status) =>
  ({ running: "working", blocked: "broke", shipped: "shipped" })[status] ||
  "idle";
const stars = (n) => "★".repeat(n) + "☆".repeat(4 - n);
function makeLog(c, run) {
  const entries = Array.from({ length: run.phase }, (_, i) => ({
    label: phases[i],
    text: phaseText(c, i, run.brief),
    ok: i >= 4,
  }));
  if (run.status === "blocked")
    entries.push({
      label: "HALT",
      text: `Next step needs ${format(costAt(c, run.phase, run.turbo))} tokens. Worktree preserved.`,
      warn: true,
    });
  if (run.status === "paused")
    entries.push({
      label: "WAIT",
      text: "Operator paused the worker. No tokens are being consumed.",
    });
  return entries;
}

export function initDesk(api) {
  const juice = juiceOf(api);
  const card = document.querySelector("#agent-card");
  const restored = api.get(storeKey, {}) || {};
  const savedRun = restored.run;
  const validRun =
    savedRun &&
    contracts.some((c) => c.id === savedRun.contract) &&
    Number.isInteger(savedRun.phase) &&
    savedRun.phase >= 0 &&
    savedRun.phase <= phases.length;
  const game = {
    selected: contractFor(restored.selected).id,
    note: clampNote(restored.note),
    turbo: !!restored.turbo,
    count: Number.isSafeInteger(restored.count)
      ? Math.max(0, restored.count)
      : 0,
    history: Array.isArray(restored.history)
      ? restored.history
          .filter((r) => r && contracts.some((c) => c.id === r.contract))
          .slice(0, 25)
      : [],
    run: validRun
      ? {
          ...savedRun,
          status: savedRun.status === "running" ? "paused" : savedRun.status,
        }
      : null,
  };
  if (game.run?.phase === phases.length && game.run.status !== "shipped")
    game.run = null;
  let workspace = null;
  let tab = "log";
  let historyId = null;
  let timer = 0;
  let sidebarSignature = "";
  let expanding = false;
  let phaseDue = 0;
  let typedPhase = -1;
  let hack = { hash: null, text: "", pos: 0 };
  let hackTimer = 0;
  let keyHandler = null;
  const save = () => api.set(storeKey, game);
  if (validRun && savedRun.status === "running") save();
  const live = () => game.run && game.run.status !== "shipped";
  const choice = () => contractFor(game.selected);
  const showRun = () =>
    (historyId && game.history.find((r) => r.hash === historyId)) || game.run;
  const selectedNote = () =>
    (live() ? game.run.brief : game.note.trim()) || choice().title;

  function sidebar() {
    if (!card) return;
    const run = game.run;
    const contract = run ? contractFor(run.contract) : choice();
    const signature = [
      run?.hash,
      run?.phase,
      run?.status,
      game.selected,
      game.count,
    ].join("/");
    if (signature === sidebarSignature) return;
    sidebarSignature = signature;
    const state = run?.status || "ready";
    const line = run
      ? state === "blocked"
        ? "ERR_INSUFFICIENT_VIBES"
        : state === "paused"
          ? "checkpoint saved"
          : state === "shipped"
            ? `HEAD → ${run.hash}`
            : run.phase === 0
              ? "spawning worker…"
              : phases[run.phase - 1].toLowerCase() + " complete"
      : "worker online. awaiting deploy.";
    card.innerHTML = `<div class="desk-panel g-panel desk-mood-${moodFor(state)}">
      <div class="desk-card-head">
        ${robotMarkup(moodFor(state), "desk-portrait")}
        <div class="desk-card-id"><span class="g-chip">AGENT</span><h2>VIBE-1</h2><span class="desk-status desk-status-${state}">${pulse}${statusLabel(state)}</span></div>
      </div>
      <div class="desk-mini-term" aria-label="Current agent output">
        <div class="desk-mini-ticket"><span>${run ? "MISSION" : "NEXT UP"}</span> ${esc(contract.short)}</div>
        <div class="desk-mini-output"><span aria-hidden="true">›</span> ${esc(line)}<i class="desk-cursor"></i></div>
        ${run && state !== "shipped" ? `<div class="desk-micro-progress" aria-label="${run.phase} of 7 steps">${phases.map((_, i) => `<i class="${i < run.phase ? "checked" : ""}"></i>`).join("")}</div>` : ""}
      </div>
      <button class="desk-launch g-btn ${state === "blocked" ? "red" : state === "running" ? "ice" : "lime"}" type="button" data-desk-action="open"><span>${state === "blocked" ? "Refuel agent" : state === "running" ? "Watch it code" : state === "paused" ? "Resume run" : "Start coding"}</span><kbd>1</kbd></button>
      </div>`;
  }

  function open() {
    if (workspace?.isConnected) {
      render();
      return;
    }
    workspace = document.createElement("div");
    workspace.className = "desk-workstation";
    workspace.addEventListener("click", onClick);
    workspace.addEventListener("change", onChange);
    workspace.addEventListener("input", onInput);
    const instance = workspace;
    historyId = null;
    tab = "log";
    expanding = true;
    if (juice.enabled) {
      keyHandler = (e) => {
        if (
          !workspace?.isConnected ||
          game.run?.status !== "running" ||
          e.metaKey ||
          e.ctrlKey ||
          e.altKey ||
          e.target.closest?.("input,textarea,select,button,a")
        )
          return;
        if (e.key.length === 1 || e.key === "Enter" || e.key === "Backspace") {
          e.preventDefault();
          mash(null, true);
        }
      };
      document.addEventListener("keydown", keyHandler);
      hackTimer = setInterval(() => {
        if (game.run?.status === "running" && workspace?.isConnected)
          typeHack(1 + Math.round(Math.random()));
      }, 70);
    }
    api.modal("Agent workstation", workspace, {
      wide: true,
      eyebrow: "CASINO OPERATIONS / LOCAL SIM",
      onClose: () => {
        if (keyHandler) document.removeEventListener("keydown", keyHandler);
        keyHandler = null;
        clearInterval(hackTimer);
        if (workspace === instance) workspace = null;
      },
    });
    expanding = false;
    render();
  }

  function inspector(run) {
    const c = contractFor(run.contract);
    if (tab === "history") {
      return game.history.length
        ? `<div class="desk-history">${game.history
            .map((r) => {
              const h = contractFor(r.contract);
              return `<button type="button" data-desk-action="history-run" data-hash="${esc(r.hash)}"><span class="desk-hash">${esc(r.hash)}</span><span>${esc(h.short)}</span><strong>+${format(r.reward)}</strong></button>`;
            })
            .join("")}</div>`
        : '<p class="desk-empty">Your first shipped commit will appear here.</p>';
    }
    if (tab === "diff") {
      if (run.phase < 4)
        return `<div class="desk-empty"><span class="desk-prompt">$ git diff</span><p>Working tree clean. The agent writes its patch during step 4.</p></div>`;
      return `<div class="desk-patch"><div class="desk-file">▤ &nbsp;${esc(c.file)} <span>+${c.code.length} −${c.old.length}</span></div><pre>${patchFor(
        c,
      )
        .split("\n")
        .slice(3, -1)
        .map(
          (l, i) =>
            `<code style="--i:${i}" class="desk-code-${l.startsWith("+") ? "add" : l.startsWith("-") ? "del" : "hunk"}">${esc(l)}</code>`,
        )
        .join("")}</pre></div>`;
    }
    return `<div class="desk-scroll-log"><div class="desk-command"><span class="desk-prompt">$</span> git switch -c ${esc(c.branch)}</div>${makeLog(
      c,
      run,
    )
      .map(
        (e) =>
          `<div class="desk-event${e.warn ? " warn" : ""}"><b>${e.ok ? "✓" : e.warn ? "!" : "›"} ${esc(e.label)}</b><span>${esc(e.text)}</span></div>`,
      )
      .join(
        "",
      )}${run.status === "running" ? `<span class="desk-stream-tail">› ${esc(phases[run.phase])}…<i class="desk-cursor"></i></span>` : ""}</div>${
      juice.enabled && run.status === "running" && run === game.run
        ? `<div class="desk-hack" aria-hidden="true"><div class="desk-hack-head"><span>${esc(c.file)}</span><span class="desk-hack-hint">MASH ANY KEY TO VIBE HARDER</span></div><pre class="desk-hack-code"></pre></div>`
        : ""
    }`;
  }

  function render() {
    sidebar();
    if (!workspace || (!workspace.isConnected && !expanding)) return;
    const run = showRun();
    const c = run ? contractFor(run.contract) : choice();
    const options = contracts
      .map(
        (o) =>
          `<option value="${o.id}" ${o.id === game.selected ? "selected" : ""} ${o.unlock > game.count ? "disabled" : ""}>${esc(o.title)}${o.unlock > game.count ? ` · ${o.unlock} commits to unlock` : ""}</option>`,
      )
      .join("");
    const actionArea = !run
      ? ""
      : run.status === "shipped"
        ? `
      <div class="desk-receipt"><div><span>MERGED · ${esc(run.hash)}</span><strong>+${format(run.reward)} <small>TOKENS</small></strong></div><p>${esc(c.receipt)}</p></div>
      <div class="desk-actions">${makeButton("next", "Pick next ticket →", "primary")}${makeButton("patch", "↓ Patch")}</div>`
        : run.status === "blocked"
          ? `
      <div class="desk-broke"><strong>Out of tokens mid-build.</strong><span>${esc(phases[run.phase])} needs ${format(costAt(c, run.phase, run.turbo))} tokens. Your progress is saved.</span></div>
      <div class="desk-actions">${makeButton(api.state.tokens >= costAt(c, run.phase, run.turbo) ? "resume" : "fund", api.state.tokens >= costAt(c, run.phase, run.turbo) ? "Resume agent ▶" : "Get more tokens →", "primary")}${makeButton("floor", "Back to casino")}</div>`
          : `
      <div class="desk-actions">${run.status === "running" ? (juice.enabled ? makeButton("mash", "⚡ VIBE HARDER", "mash") : "") + makeButton("pause", "Ⅱ Pause agent") : makeButton("resume", "Resume agent ▶", "primary")}</div>`;
    workspace.innerHTML = `
      <div class="desk-topline"><span class="desk-identity">${robotMarkup(moodFor(showRun()?.status), "desk-portrait-sm")} VIBE-1 <em>/ local worker</em></span><span class="desk-rank">${esc(rankFor(game.count))} · ${game.count} commit${game.count === 1 ? "" : "s"}</span></div>
      ${
        run
          ? `<div class="desk-ticket"><div class="desk-kicker">${esc(c.client)} <span>·</span> ${run.turbo ? "OVERCLOCK" : "STANDARD"}</div><h3>${esc(c.title)}</h3>${run.brief && run.brief !== c.title ? `<p class="desk-note">“${esc(run.brief)}”</p>` : ""}</div>
      <div class="desk-meter-head"><span class="desk-status desk-status-${esc(run.status)}">${pulse}${statusLabel(run.status)}</span><span>${run.phase}/${phases.length} STEPS · ${format(run.spent)} TOKENS USED</span></div>
      <div class="desk-stage-meter">${phases.map((phase, i) => `<span title="${phase}" class="${i < run.phase ? "done" : i === run.phase && run.status !== "shipped" ? "now" : ""}"><i>${phase}</i></span>`).join("")}</div>
      <div class="desk-tabs" aria-label="Run details">${[
        ["log", "Output"],
        ["diff", "Diff"],
        ["history", "Commits"],
      ]
        .map(
          ([key, label]) =>
            `<button type="button" class="g-btn ${tab === key ? "ice" : "ghost"}" data-desk-action="tab" data-tab="${key}" aria-pressed="${tab === key}">${label}${key === "diff" && run.phase >= 4 ? " <i>1</i>" : ""}</button>`,
        )
        .join("")}</div>
      <div class="desk-inspector">${inspector(run)}</div>
      ${historyId && live() ? makeButton("return", "← Back to active worker") : actionArea}`
          : `
      <div class="desk-compose">
        <div class="desk-kicker">ISSUE BOUNTY BOARD</div>
        <h3>Mission select<span>.</span></h3>
        <div class="desk-quests" role="radiogroup" aria-label="Contract">${contracts
          .map((o) => {
            const locked = o.unlock > game.count;
            return `<button type="button" class="desk-quest${o.id === game.selected ? " picked" : ""}" role="radio" aria-checked="${o.id === game.selected}" data-desk-action="pick" data-id="${o.id}" ${locked ? "disabled" : ""}><small>${esc(o.client)}</small><b>${esc(o.title)}</b><span class="desk-quest-foot"><i class="desk-stars">${stars(o.size)}</i>${locked ? `<em>🔒 ${o.unlock} commits</em>` : `<em>+${format(bounty(o, game.turbo))}</em>`}</span></button>`;
          })
          .join("")}</div>
        <label class="desk-field">Operator brief <em>type fast. it helps. probably.</em><textarea data-desk-field="note" rows="2" maxlength="${maxNote}" placeholder="${esc(choice().title)}">${esc(game.note)}</textarea></label>
        <div class="desk-launchpad">
          <div class="desk-speeds" aria-label="Worker speed">${[false, true].map((t) => `<button type="button" class="g-btn ${t ? "volt" : "ghost"}" data-desk-action="speed" data-speed="${t ? 1 : 0}" aria-pressed="${game.turbo === t}">${t ? "⚡ Overclock 2×" : "Standard 1×"}</button>`).join("")}</div>
          <div class="desk-offer"><div><small>Burn</small><b>${format(estimate(choice(), game.turbo))}</b></div><div class="desk-offer-win"><small>Bounty</small><b>+${format(bounty(choice(), game.turbo))}</b></div></div>
          ${makeButton("start", "▶ Deploy agent", "primary")}
        </div>
      </div>
      ${game.history.length ? `<div class="desk-previous"><span>Latest commit</span><button data-desk-action="history-run" data-hash="${esc(game.history[0].hash)}">${esc(game.history[0].hash)} ↗</button></div>` : ""}`
      }
      <div class="desk-t3"><span>${live() ? "Worker runs while you play." : "Local simulation · fake tokens"}</span>${makeButton("t3", "Open in T3 Code ↗", "link")}</div>`;
    const stream = workspace.querySelector(".desk-scroll-log");
    if (stream) stream.scrollTop = stream.scrollHeight;
    if (!juice.enabled) return;
    juice.powerMode(workspace.querySelector('[data-desk-field="note"]'));
    paintHack();
    const shown = showRun();
    if (shown === game.run && run && tab === "log" && run.phase > typedPhase) {
      typedPhase = run.phase;
      const latest = [...workspace.querySelectorAll(".desk-event span")].at(-1);
      if (latest && !historyId) typewrite(latest);
    }
  }

  function typewrite(node) {
    const full = node.textContent;
    node.textContent = "";
    node.classList.add("desk-typing");
    let i = 0;
    const iv = setInterval(() => {
      if (!node.isConnected) return clearInterval(iv);
      i = Math.min(full.length, i + 2 + Math.floor(Math.random() * 3));
      node.textContent = full.slice(0, i);
      if (i % 6 < 3) api.sound("key", { pitch: 1.6 + Math.random() * 0.4 });
      if (i >= full.length) {
        clearInterval(iv);
        node.classList.remove("desk-typing");
      }
    }, 24);
  }

  function hackSource(c) {
    const lines = [`// VIBE-1 :: ${c.branch}`, ...c.code];
    for (let i = 0; i < 40; i++) {
      if (i % 5 === 0) lines.push("");
      lines.push(filler[(i * 7 + c.id.length) % filler.length]);
      if (i % 9 === 4) lines.push(...c.code);
    }
    return lines.join("\n") + "\n";
  }
  function typeHack(n) {
    const run = game.run;
    if (!run) return;
    if (hack.hash !== run.hash) {
      hack = { hash: run.hash, text: "", pos: 0, src: hackSource(contractFor(run.contract)) };
    }
    for (let i = 0; i < n; i++) {
      hack.text += hack.src[hack.pos % hack.src.length];
      hack.pos++;
    }
    if (hack.text.length > 1600) hack.text = hack.text.slice(-1200);
    paintHack();
  }
  function highlight(code) {
    return esc(code)
      .replace(/(\/\/.*)/g, '<i class="hl-c">$1</i>')
      .replace(/(&quot;.*?&quot;)/g, '<i class="hl-s">$1</i>')
      .replace(/\b(const|let|return|export|function|if|while|for|await|import|from|of|new)\b/g, '<i class="hl-k">$1</i>');
  }
  function paintHack() {
    const pre = workspace?.querySelector(".desk-hack-code");
    if (!pre) return;
    const lines = hack.text.split("\n").slice(-11);
    pre.innerHTML = lines.map(highlight).join("\n") + '<i class="desk-cursor"></i>';
  }

  function mash(target, fromKey) {
    const run = game.run;
    if (!run || run.status !== "running") return;
    const button = workspace?.querySelector('[data-desk-action="mash"]');
    const origin = target || button || workspace;
    const n = juice.combo(origin);
    typeHack(fromKey ? 4 + Math.floor(Math.random() * 4) : 7);
    // Every mash shaves time off the current step. The tokens still burn.
    const now = performance.now();
    const left = Math.max(0, phaseDue - now);
    const next = Math.max(70, left * (fromKey ? 0.9 : 0.84) - 25);
    if (left > 80) {
      window.clearTimeout(timer);
      phaseDue = now + next;
      timer = window.setTimeout(advance, next);
    }
    const pre = workspace?.querySelector(".desk-hack-code");
    juice.burst(fromKey && pre ? pre.querySelector(".desk-cursor") || pre : origin, {
      count: 8 + Math.min(16, n / 4),
      speed: 0.6 + Math.min(0.9, n / 80),
      colors: n > 40 ? ["#7df9ff", "#ff3d9a", "#ffe066", "#fff"] : ["#a6ff8f", "#7df9ff", "#fff"],
      size: 3,
    });
    if (n % 15 === 0) juice.burst(origin, { kind: "ring", colors: ["#a6ff8f"] });
    juice.shake(Math.min(0.16, 0.05 + n / 900));
    juice.hype(0.45);
    juice.xp(0.6);
    juice.pop(button, "fx-pop");
    api.sound("mash", { pitch: 1 + Math.min(1.4, (n % 40) / 26) });
  }

  function schedule(delay) {
    window.clearTimeout(timer);
    const run = game.run;
    if (!run || run.status !== "running") return;
    const ms = delay ?? normalDurations[run.phase] * (run.turbo ? 0.5 : 1);
    phaseDue = performance.now() + ms;
    timer = window.setTimeout(advance, ms);
  }

  function fund() {
    const run = game.run;
    if (run?.status !== "blocked") return;
    const c = contractFor(run.contract);
    const needed = costAt(c, run.phase, run.turbo);
    const returnToDesk = Boolean(workspace?.isConnected);
    const checkpoint =
      run.phase === 4
        ? "The patch is written. Time to run the tests."
        : `Agent paused during ${phases[run.phase].toLowerCase()}.`;
    const shortfall = Math.max(0, needed - api.state.tokens);
    api.fund(
      `${checkpoint} Next step costs ${format(needed)} tokens. You are ${format(shortfall)} short.`,
      () => {
        if (game.run?.hash !== run.hash || run.status !== "blocked") return;
        if (api.state.tokens >= needed) resume();
        if (returnToDesk) open();
      },
    );
  }

  function advance() {
    const run = game.run;
    if (!run || run.status !== "running") return;
    const c = contractFor(run.contract);
    const debit = costAt(c, run.phase, run.turbo);
    if (!api.spend(debit, `VIBE-1 · ${phases[run.phase]}`)) {
      run.status = "blocked";
      save();
      api.sound("error");
      if (juice.enabled) {
        juice.flash("#ff4d6d", 0.35);
        juice.shake(0.5);
        juice.banner({
          kicker: "VIBE-1 / HALTED",
          title: "OUT OF TOKENS",
          sub: "Your agent is broke. The casino is right there.",
          tone: "red",
          duration: 1500,
        });
      }
      api.log(
        `VIBE-1 ran out of tokens during ${phases[run.phase].toLowerCase()}.`,
        "agent",
      );
      render();
      if (workspace?.isConnected) fund();
      else api.toast("Agent paused. Refuel at the terminal.");
      return;
    }
    run.spent += debit;
    run.phase += 1;
    if (run.phase === phases.length) {
      run.status = "shipped";
      run.reward = bounty(c, run.turbo);
      game.count++;
      game.history.unshift({ ...run });
      game.history = game.history.slice(0, 25);
      save();
      api.earn(run.reward, `Contract shipped · ${c.short}`);
      api.stat("commits");
      api.sound("commit");
      if (juice.enabled) {
        // Critical merge: the 10× engineer myth, occasionally true. Hype raises the odds.
        const crit = Math.random() < 0.14 + juice.tier * 0.06;
        const critBonus = crit ? run.reward : 0;
        if (crit) {
          api.earn(critBonus, `Critical merge ×2 · ${run.hash}`);
          run.crit = true;
          game.history[0].crit = true;
          save();
        }
        juice.payout({
          from: workspace?.isConnected
            ? workspace.querySelector(".desk-stage-meter")
            : card,
          amount: run.reward + critBonus,
          bet: run.spent,
          big: crit ? "mega" : "big",
          title: crit ? "CRIT MERGE" : "SHIPPED",
          tone: crit ? "pink" : "green",
          label: `${c.client} · ${run.hash}`,
        });
        juice.burst(null, { kind: "star", count: 40, colors: ["#a6ff8f", "#fff", "#7df9ff"] });
      } else api.fx("win");
      api.log(`VIBE-1 merged ${run.hash} · ${c.short}`, "agent");
      api.toast(`Shipped ${run.hash} · +${format(run.reward)} tokens`);
    } else {
      save();
      api.sound(juice.enabled ? "step" : "tick", { pitch: 1 + run.phase * 0.09 });
      schedule();
    }
    render();
    if (juice.enabled && run.status === "running") stepFx(run);
  }

  function stepFx(run) {
    const seg = workspace?.querySelectorAll(".desk-stage-meter span")[run.phase - 1];
    const at = seg || card;
    juice.burst(at, { count: 14, colors: ["#a6ff8f", "#fff", "#ffe066"], speed: 0.7 });
    juice.float(at, phases[run.phase - 1].toUpperCase() + " ✓", { tone: "bonus", size: 20 });
    juice.hype(2.5);
    juice.xp(6);
    if (run.phase === 5) {
      // Tests just passed.
      juice.flash("#4dff7a", 0.22);
      juice.float(workspace?.querySelector(".desk-inspector") || card, "ALL GREEN", {
        tone: "gain",
        size: 54,
      });
      juice.burst(workspace?.querySelector(".desk-inspector") || card, {
        kind: "confetti",
        count: 40,
        colors: ["#4dff7a", "#a6ff8f", "#fff"],
      });
      juice.shake(0.25);
    }
  }

  function start() {
    if (live()) return;
    const c = choice();
    if (c.unlock > game.count) return;
    game.run = {
      contract: c.id,
      hash: shortHash(),
      brief: game.note.trim() || c.title,
      turbo: game.turbo,
      phase: 0,
      spent: 0,
      reward: 0,
      status: "running",
      started: Date.now(),
    };
    historyId = null;
    tab = "log";
    save();
    api.sound("click");
    api.log(`VIBE-1 picked up “${c.short}”.`, "agent");
    typedPhase = -1;
    render();
    schedule(320);
    if (juice.enabled) {
      api.sound("riser", { length: 0.5 });
      juice.flash("#7df9ff", 0.18);
      juice.burst(workspace?.querySelector(".desk-ticket") || card, {
        count: 40,
        colors: ["#7df9ff", "#a6ff8f", "#fff"],
      });
      juice.shake(0.3);
      juice.hype(4);
    }
  }

  function pause() {
    if (game.run?.status !== "running") return;
    window.clearTimeout(timer);
    game.run.status = "paused";
    save();
    render();
  }

  function resume() {
    const run = game.run;
    if (!run || !["blocked", "paused"].includes(run.status)) return;
    const c = contractFor(run.contract);
    if (api.state.tokens < costAt(c, run.phase, run.turbo)) {
      run.status = "blocked";
      save();
      render();
      fund();
      return;
    }
    run.status = "running";
    save();
    render();
    schedule(220);
  }

  function downloadPatch() {
    const run = showRun();
    if (run?.status !== "shipped") return;
    const c = contractFor(run.contract);
    const content = `From: VIBE-1 <worker@casino.invalid>\nSubject: [PATCH] ${c.message}\n\n${run.brief}\n\n${patchFor(c)}`;
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/plain" }),
    );
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `git-rich-${run.hash}.patch`,
    });
    document.body.append(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    api.toast(`Patch exported · ${run.hash}`);
  }

  function onClick(event) {
    const target = event.target.closest("[data-desk-action]");
    if (!target || target.disabled) return;
    switch (target.dataset.deskAction) {
      case "open":
        open();
        break;
      case "start":
        start();
        break;
      case "pause":
        pause();
        break;
      case "mash":
        mash(target);
        break;
      case "pick": {
        if (live()) break;
        const picked = contractFor(target.dataset.id);
        if (picked.unlock > game.count) break;
        game.selected = picked.id;
        save();
        render();
        api.sound("click");
        juice.burst(workspace?.querySelector(".desk-quest.picked"), { count: 14 });
        break;
      }
      case "resume":
        resume();
        break;
      case "fund":
        fund();
        break;
      case "floor":
        api.closeModal();
        break;
      case "t3": {
        const displayed = showRun();
        const brief = displayed
          ? [contractFor(displayed.contract).title, displayed.brief]
              .filter((s, i, list) => s && list.indexOf(s) === i)
              .join("\n\n")
          : [choice().title, selectedNote()]
              .filter((s, i, list) => s && list.indexOf(s) === i)
              .join("\n\n");
        api.openT3(brief);
        break;
      }
      case "speed":
        game.turbo = target.dataset.speed === "1";
        save();
        render();
        if (game.turbo && juice.enabled) {
          const b = workspace?.querySelector('[data-speed="1"]');
          juice.burst(b, { count: 24, colors: ["#ffe066", "#ff8a3d", "#fff"] });
          juice.shake(0.2);
          api.sound("tierup");
        }
        break;
      case "next": {
        if (live()) {
          historyId = null;
          tab = "log";
          render();
          break;
        }
        const available = contracts.filter((c) => c.unlock <= game.count);
        const next =
          available.find(
            (c) => !game.history.some((r) => r.contract === c.id),
          ) ||
          available[
            (available.findIndex((c) => c.id === game.selected) + 1) %
              available.length
          ];
        game.selected = next.id;
        game.run = null;
        game.note = "";
        historyId = null;
        tab = "log";
        save();
        render();
        break;
      }
      case "tab":
        tab = target.dataset.tab;
        render();
        break;
      case "history-run": {
        const past = game.history.find((r) => r.hash === target.dataset.hash);
        if (past) {
          historyId = past.hash;
          tab = "diff";
          render();
        }
        break;
      }
      case "return":
        historyId = null;
        tab = "log";
        render();
        break;
      case "patch":
        downloadPatch();
        break;
    }
  }

  function onInput(event) {
    if (event.target.dataset.deskField === "note") {
      game.note = clampNote(event.target.value);
      save();
    }
  }
  function onChange(event) {
    if (event.target.dataset.deskField !== "contract" || live()) return;
    const selected = contractFor(event.target.value);
    if (selected.unlock > game.count) return;
    game.selected = selected.id;
    save();
    render();
  }
  let lastCanResume = null;
  function update() {
    sidebar();
    if (!workspace?.isConnected || game.run?.status !== "blocked") return;
    const run = game.run;
    const canResume =
      api.state.tokens >=
      costAt(contractFor(run.contract), run.phase, run.turbo);
    if (canResume !== lastCanResume) {
      lastCanResume = canResume;
      render();
    }
  }
  card?.addEventListener("click", onClick);
  sidebar();
  return {
    open,
    update,
    destroy() {
      window.clearTimeout(timer);
      clearInterval(hackTimer);
      if (keyHandler) document.removeEventListener("keydown", keyHandler);
      card?.removeEventListener("click", onClick);
    },
  };
}
