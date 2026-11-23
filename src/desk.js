import { juiceOf } from "./juice.js";
import { runnerLoop } from "./sponsors.js";

// Contracts produce real, downloadable patches for the fictional companies on the floor.
export const contracts = [
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
export const filler = [
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
export const phases = [
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
export const normalDurations = [580, 1450, 1850, 1950, 1600, 1700, 820];
// Slop skills scale the bill: ULTRATHINK triples it, MAKE NO MISTAKES adds a quarter.
const modCost = (mods) => (mods?.ultra ? 3 : 1) * (mods?.nm ? 1.25 : 1);
const modBounty = (mods) => (mods?.ultra ? 2.4 : 1) * (mods?.nm ? 1.2 : 1);
export const costAt = (c, i, turbo, mods) =>
  Math.round(
    costWeights[i] * (1 + (c.size - 1) * 0.24) * (turbo ? 2.62 : 1) * modCost(mods),
  );
export const estimate = (c, turbo, mods) =>
  costWeights.reduce((sum, _, i) => sum + costAt(c, i, turbo, mods), 0);
export const bounty = (c, turbo, mods) =>
  Math.round(
    (Math.round((estimate(c, turbo) * (turbo ? 1.52 : 1.4)) / 5) * 5 * modBounty(mods)) / 5,
  ) * 5;
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
      text: `Next step needs ${format(costAt(c, run.phase, run.turbo, run.mods))} tokens. Worktree preserved.`,
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
  // On the real floor the IDE owns the centre of the screen; tests use the modal.
  const ideHost = document.querySelector("#ide");
  const ideMode = !!ideHost && juice.enabled;
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
    turbo: restored.turbo === undefined ? ideMode : !!restored.turbo,
    slop: {
      auto: !!restored.slop?.auto,
      autoText: String(restored.slop?.autoText ?? "keep going").slice(0, 140),
      autoCount: [1, 3, 10, -1].includes(restored.slop?.autoCount)
        ? restored.slop.autoCount
        : 3,
      autoLeft: Number.isInteger(restored.slop?.autoLeft) ? restored.slop.autoLeft : 3,
      ultra: !!restored.slop?.ultra,
      nm: !!restored.slop?.nm,
      yolo: !!restored.slop?.yolo,
    },
    streak: Number.isSafeInteger(restored.streak) ? Math.max(0, restored.streak) : 0,
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
  let continueTimer = 0;
  let autoTimer = 0;
  let testTimer = 0;
  let offer = null;
  let offerTimer = 0;
  // Brainrot for the wait: a runner plays beside the code while the agent works.
  let rot = null;
  function mountRot(on) {
    const hostEl = workspace?.querySelector(".ide-rot-slot");
    if (!on || !hostEl) {
      rot?.stop?.();
      rot?.node.remove();
      rot = null;
      return;
    }
    if (!rot) {
      const node = document.createElement("div");
      node.className = "ide-rot";
      node.innerHTML = '<canvas aria-hidden="true"></canvas><span>GAMEPLAY FOR ATTENTION RETENTION</span>';
      rot = { node };
      hostEl.append(node);
      rot.stop = runnerLoop(node.firstChild, () => game.run?.status === "running");
      return;
    }
    hostEl.append(rot.node);
  }
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

  function attachKeys() {
    keyHandler = (e) => {
      if (
        !workspace?.isConnected ||
        game.run?.status !== "running" ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        e.target.closest?.("input,textarea,select,button,a") ||
        (ideMode && document.querySelector("#game-dialog[open]"))
      )
        return;
      // Letters mash. Digits and space stay free for the floor hotkeys.
      if (/^[a-z]$/i.test(e.key) || e.key === "Enter" || e.key === "Backspace") {
        e.preventDefault();
        mash(null, true);
      }
    };
    document.addEventListener("keydown", keyHandler);
    hackTimer = setInterval(() => {
      if (game.run?.status === "running" && workspace?.isConnected)
        typeHack(1 + Math.round(Math.random() * (game.run.mods?.ultra ? 0 : 1)));
    }, 70);
  }
  function mountIde() {
    workspace = document.createElement("div");
    workspace.className = "desk-workstation ide";
    workspace.addEventListener("click", onClick);
    workspace.addEventListener("change", onChange);
    workspace.addEventListener("input", onInput);
    workspace.addEventListener("keydown", (e) => {
      // Enter sends the prompt, like every chat box you've ever loved.
      if (
        e.key === "Enter" &&
        !e.shiftKey &&
        e.target.matches?.('[data-desk-field="note"]')
      ) {
        e.preventDefault();
        start();
      }
    });
    ideHost.replaceChildren(workspace);
    window.addEventListener("grq:event", (e) => {
      const type = e.detail?.type;
      // FEVER: whatever the agent is doing, it now does it three times faster.
      if (type === "fever-start" && game.run?.status === "running") {
        const left = Math.max(60, (phaseDue - performance.now()) / 3);
        window.clearTimeout(timer);
        phaseDue = performance.now() + left;
        timer = window.setTimeout(advance, left);
      }
    });
    attachKeys();
    render();
  }

  function open() {
    if (ideMode) {
      if (!workspace) mountIde();
      api.closeModal?.();
      workspace.querySelector('[data-desk-field="note"]')?.focus({ preventScroll: true });
      juice.pop(workspace, "fx-pop");
      return;
    }
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
    if (juice.enabled) attachKeys();
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
      juice.enabled && !ideMode && run.status === "running" && run === game.run
        ? `<div class="desk-hack" aria-hidden="true"><div class="desk-hack-head"><span>${esc(c.file)}</span><span class="desk-hack-hint">MASH ANY KEY TO VIBE HARDER</span></div><pre class="desk-hack-code"></pre></div>`
        : ""
    }`;
  }

  function render() {
    sidebar();
    if (ideMode) return renderIde();
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
      <div class="desk-broke"><strong>Out of tokens mid-build.</strong><span>${esc(phases[run.phase])} needs ${format(costAt(c, run.phase, run.turbo, run.mods))} tokens. Your progress is saved.</span></div>
      <div class="desk-actions">${makeButton(api.state.tokens >= costAt(c, run.phase, run.turbo, run.mods) ? "resume" : "fund", api.state.tokens >= costAt(c, run.phase, run.turbo, run.mods) ? "Resume agent ▶" : "Get more tokens →", "primary")}${makeButton("floor", "Back to casino")}</div>`
          : `
      <div class="desk-actions">${run.status === "running" ? (juice.enabled ? makeButton("mash", "⚡ VIBE HARDER", "mash") : "") + makeButton("pause", "Ⅱ Pause agent") : makeButton("resume", "Resume agent ▶", "primary")}</div>`;
    workspace.innerHTML = `
      <div class="desk-topline"><span class="desk-identity">${terminalIcon} VIBE-1 <em>/ local worker</em></span><span class="desk-rank">${esc(rankFor(game.count))} · ${game.count} commit${game.count === 1 ? "" : "s"}</span></div>
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

  const slopSkills = [
    ["ultra", "ULTRATHINK", "3× tokens · way more crits"],
    ["nm", "MAKE NO MISTAKES", "+25% cost · appended to your prompt"],
    ["yolo", "YOLO MODE", "--dangerously-skip-permissions"],
  ];
  function slopBar() {
    const sl = game.slop;
    const counts = [
      [1, "×1"],
      [3, "×3"],
      [10, "×10"],
      [-1, "∞"],
    ];
    return `<div class="slop" aria-label="Slop skills">
      <span class="slop-title">SLOP SKILLS</span>
      <div class="slop-auto${sl.auto ? " on" : ""}">
        <button type="button" class="slop-toggle" data-desk-action="slop" data-key="auto" aria-pressed="${sl.auto}"><i></i>AUTO-PROMPT</button>
        <input data-desk-field="auto-text" maxlength="140" value="${esc(sl.autoText)}" aria-label="Auto-prompt text" placeholder="keep going">
        <span class="slop-counts">${counts.map(([n, l]) => `<button type="button" data-desk-action="auto-count" data-n="${n}" aria-pressed="${sl.autoCount === n}">${l}</button>`).join("")}</span>
        ${sl.auto ? `<em class="slop-left">${sl.autoLeft < 0 ? "∞" : sl.autoLeft} left</em>` : ""}
      </div>
      ${slopSkills.map(([key, label, hint]) => `<button type="button" class="slop-toggle${sl[key] ? " on" : ""}" data-desk-action="slop" data-key="${key}" aria-pressed="${sl[key]}" title="${esc(hint)}"><i></i>${label}</button>`).join("")}
    </div>`;
  }
  function codeLines(c, run) {
    if (run.status === "shipped")
      return patchFor(c)
        .split("\n")
        .slice(3, -1)
        .map((l, i) => `<span class="ln desk-code-${l.startsWith("+") ? "add" : l.startsWith("-") ? "del" : "hunk"}" style="--i:${i}" data-n="${i + 1}">${esc(l)}</span>`)
        .join("");
    return "";
  }
  function renderIde() {
    if (!workspace) return;
    const run = showRun();
    const state = run?.status || "ready";
    const c = run ? contractFor(run.contract) : choice();
    const mods = run?.mods || { ultra: game.slop.ultra, nm: game.slop.nm, yolo: game.slop.yolo };
    const pct = run ? Math.round((run.phase / phases.length) * 100) : 0;
    const needed = run && run.phase < phases.length ? costAt(c, run.phase, run.turbo, run.mods) : 0;
    const editor = !run
      ? `<div class="ide-pick"><div class="ide-kicker">// TICKETS · pick one, write a vibe, press enter</div><div class="desk-quests" role="radiogroup" aria-label="Contract">${contracts
          .map((o) => {
            const locked = o.unlock > game.count;
            return `<button type="button" class="desk-quest${o.id === game.selected ? " picked" : ""}" role="radio" aria-checked="${o.id === game.selected}" data-desk-action="pick" data-id="${o.id}" ${locked ? "disabled" : ""}><small>${esc(o.client)}</small><b>${esc(o.title)}</b><span class="desk-quest-foot"><i class="desk-stars">${stars(o.size)}</i>${locked ? `<em>🔒 ${o.unlock} commits</em>` : `<em>+${format(bounty(o, game.turbo, mods))}</em>`}</span></button>`;
          })
          .join("")}</div></div>`
      : `<div class="ide-head"><div class="desk-ticket"><div class="desk-kicker">${esc(c.client)} · ${run.turbo ? "OVERCLOCK" : "STANDARD"}${run.mods?.ultra ? " · ULTRATHINK" : ""}${run.mods?.yolo ? " · YOLO" : ""}</div><h3>${esc(c.title)}</h3>${run.brief && run.brief !== c.title ? `<p class="desk-note">&gt; ${esc(run.brief)}</p>` : ""}</div><div class="ide-pct"><b>${pct}<small>%</small></b><span>${format(run.spent)} TOK BURNED</span></div></div>
        <div class="ide-split"><pre class="desk-hack-code ide-code${state === "shipped" ? " shipped" : ""}">${codeLines(c, run)}</pre>${state === "running" && run === game.run ? '<div class="ide-rot-slot"></div>' : ""}</div>
        ${
          state === "blocked" && run === game.run
            ? `<div class="ide-continue" role="alertdialog" aria-label="Out of tokens">
            <div class="ide-continue-kicker">OUT OF TOKENS · ${pct}% DONE</div>
            ${game.streak > 0 ? `<div class="ide-risk">🔥 STREAK ×${game.streak} AT RISK</div>` : ""}
            <strong>CONTINUE?</strong>
            <div class="ide-count" aria-live="off">9</div>
            <p>${esc(phases[run.phase])} needs <b>${format(needed)}</b> tokens. You have <b>${format(api.state.tokens)}</b>.</p>
            <div class="ide-continue-actions">${
              api.state.tokens >= needed
                ? makeButton("resume", "▶ RESUME AGENT", "primary")
                : makeButton("fund", "▶ WATCH AD", "mash") + makeButton("allin-now", "🎰 BET WHAT'S LEFT", "secondary")
            }</div>
          </div>`
            : ""
        }`;
    const dock = !run
      ? `<div class="ide-compose">
          <label class="desk-field ide-prompt"><span class="ide-caret">❯</span><textarea data-desk-field="note" rows="2" maxlength="${maxNote}" placeholder="vibe at the agent… ${esc(choice().title.toLowerCase())}">${esc(game.note)}</textarea></label>
          <div class="ide-send">
            <div class="desk-speeds" aria-label="Worker speed">${[false, true].map((t) => `<button type="button" class="g-btn ${t ? "volt" : "ghost"}" data-desk-action="speed" data-speed="${t ? 1 : 0}" aria-pressed="${game.turbo === t}">${t ? "⚡ OVERCLOCK" : "STANDARD"}</button>`).join("")}</div>
            <div class="desk-offer"><div><small>BURN</small><b>${format(estimate(choice(), game.turbo, mods))}</b></div><div class="desk-offer-win"><small>BOUNTY</small><b>+${format(bounty(choice(), game.turbo, mods))}</b></div></div>
            ${makeButton("start", "SEND ⏎", "primary")}
          </div>
        </div>`
      : state === "shipped"
        ? `<div class="ide-shipped"><div class="desk-receipt"><div><span>MERGED · ${esc(run.hash)}${run.crit ? " · CRIT ×2" : ""}</span><strong>+${format(run.reward * (run.crit ? 2 : 1))} <small>TOKENS</small></strong></div><p>${esc(c.receipt)}</p></div><div class="desk-actions">${makeButton("next", "NEXT TICKET →", "primary")}${makeButton("patch", "↓ PATCH")}</div></div>`
        : state === "running"
          ? `<div class="desk-actions ide-run">${makeButton("mash", "⚡ VIBE HARDER", "mash")}${makeButton("fixit", "FIX IT <em>−15</em>", "secondary")}${makeButton("pray", "🙏 PRAY <em>−25</em>", "secondary")}${makeButton("pause", "Ⅱ")}</div>`
          : state === "paused"
            ? `<div class="desk-actions ide-run">${makeButton("resume", "▶ RESUME AGENT", "primary")}</div>`
            : `<div class="desk-actions ide-run"><span class="ide-broke-note">AGENT HALTED · ${esc(phases[run.phase] || "")} NEEDS ${format(needed)}</span></div>`;
    const tests =
      run && run === game.run && run.phase === 4 && (state === "running" || run.testFail)
        ? `<div class="ide-tests${run.testFail ? " fail" : ""}"><div class="ide-tests-head"><b class="ide-tests-count">${run.testFail ? "47/48" : "0/48"}</b><span>${run.testFail ? "1 FAILING · RE-RUNNING" : run.retries ? `RE-RUN #${run.retries}` : "RUNNING TESTS"}</span></div><ol>${testNames(c)
            .map((n, i) => `<li class="${run.testFail ? (i === 46 ? "red" : "ok") : ""}">${esc(n)}</li>`)
            .join("")}</ol></div>`
        : "";
    const now = performance.now();
    const bet =
      offer && offer.until > now && run === game.run && state === "running"
        ? `<div class="ide-offer" style="--left:${((offer.until - now) / 1000).toFixed(2)}s"><small>SIDE BET</small><b>${offer.kind === "green" ? "ALL GREEN FIRST TRY?" : "CRIT MERGE?"}</b><span>pays ${offer.mult}×</span><div class="ide-offer-actions"><button type="button" class="g-btn lime" data-desk-action="bet">BET ${format(offer.stake)}</button><button type="button" class="g-btn ghost" data-desk-action="skip-bet">nah</button></div><i class="ide-offer-timer"></i></div>`
        : "";
    const bets = run?.bets
      ? Object.entries(run.bets)
          .filter(([k, v]) => v && !run.bets[k + "Done"] && !k.endsWith("Done"))
          .map(([k, v]) => `<span class="ide-betchip">${k === "green" ? "ALL GREEN" : "CRIT"} · ${format(v)}</span>`)
          .join("")
      : "";
    workspace.dataset.state = state;
    workspace.innerHTML = `
      <div class="ide-bar">
        <span class="ide-dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="ide-tab active">${esc(c.file)}</span><span class="ide-tab">⎇ ${esc(c.branch)}</span>
        ${game.streak > 0 ? `<span class="ide-streak">🔥 ×${game.streak}</span>` : ""}
        <span class="ide-who">VIBE-1 · ${esc(rankFor(game.count))} · ${game.count} commit${game.count === 1 ? "" : "s"}</span>
        <span class="desk-status desk-status-${esc(state)}">${pulse}${statusLabel(state)}</span>
      </div>
      <div class="ide-main">
        <div class="ide-editor">${editor}${tests}${bet}${bets ? `<div class="ide-bets">${bets}</div>` : ""}</div>
        <aside class="ide-side">
          ${run ? `<div class="desk-stage-meter">${phases.map((phase, i) => `<span title="${phase}" class="${i < run.phase ? "done" : i === run.phase && state !== "shipped" ? "now" : ""}${run.mods?.yolo && i === 5 ? " skipped" : ""}"><i>${phase}</i><em>${format(costAt(c, i, run.turbo, run.mods))}</em></span>`).join("")}</div>
          <div class="desk-tabs" aria-label="Run details">${[
            ["log", "LOG"],
            ["diff", "DIFF"],
            ["history", "COMMITS"],
          ]
            .map(([key, label]) => `<button type="button" class="${tab === key ? "on" : ""}" data-desk-action="tab" data-tab="${key}" aria-pressed="${tab === key}">${label}</button>`)
            .join("")}</div>
          <div class="desk-inspector">${inspector(run)}</div>` : `<div class="ide-hint"><b>HOW IT WORKS</b><p>Pick a ticket. Type a vibe. Send. The agent burns tokens every step. Mash keys while it codes to make it go faster. If it runs dry before shipping… the casino is right there.</p>${game.history.length ? `<button type="button" class="desk-link" data-desk-action="history-run" data-hash="${esc(game.history[0].hash)}">last commit ${esc(game.history[0].hash)} ↗</button>` : ""}</div>`}
        </aside>
      </div>
      <div class="ide-dock">${historyId && live() ? makeButton("return", "← BACK TO ACTIVE RUN") : dock}${slopBar()}</div>`;
    const stream = workspace.querySelector(".desk-scroll-log");
    if (stream) stream.scrollTop = stream.scrollHeight;
    juice.powerMode(workspace.querySelector('[data-desk-field="note"]'));
    juice.powerMode(workspace.querySelector('[data-desk-field="auto-text"]'));
    paintHack();
    if (run && run === game.run && tab === "log" && run.phase > typedPhase) {
      typedPhase = run.phase;
      const latest = [...workspace.querySelectorAll(".desk-event span")].at(-1);
      if (latest && !historyId) typewrite(latest);
    }
    syncContinue(state === "blocked" && run === game.run);
    syncTests(!!tests && !run.testFail);
    mountRot(state === "running" && run === game.run);
  }

  function testNames(c) {
    const subjects = [c.file.split("/").pop(), c.short.toLowerCase(), "edge cases", "the happy path", "prod", "the vibes"];
    const verbs = ["renders", "survives a refresh", "handles null", "works on my machine", "does not regress", "passes lint", "is idempotent", "scales to 3 users"];
    return Array.from({ length: 48 }, (_, i) => `${subjects[i % subjects.length]} › ${verbs[(i * 5) % verbs.length]}`);
  }
  function syncTests(on) {
    clearInterval(testTimer);
    testTimer = 0;
    if (!on) return;
    const rows = [...(workspace?.querySelectorAll(".ide-tests li") || [])];
    const count = workspace?.querySelector(".ide-tests-count");
    const span = Math.max(300, phaseDue - performance.now());
    let i = 0;
    testTimer = setInterval(() => {
      if (!rows[i]) return clearInterval(testTimer);
      rows[i].classList.add("ok");
      i++;
      if (count) count.textContent = `${i}/48`;
      if (i % 4 === 0) api.sound("tick", { pitch: 1 + i / 48 });
    }, span / 50);
  }
  function makeOffer(kind) {
    const stake = Math.min(api.state.tokens, Math.max(25, Math.round((api.state.tokens * 0.12) / 5) * 5));
    if (stake < 25) return;
    offer = { kind, stake, mult: kind === "green" ? 2 : 4, until: performance.now() + 4200 };
    api.sound("ping");
    clearTimeout(offerTimer);
    offerTimer = setTimeout(() => {
      offer = null;
      render();
    }, 4300);
  }
  function placeBet() {
    const run = game.run;
    if (!offer || !run || run.status !== "running") return;
    if (!api.spend(offer.stake, `Side bet · ${offer.kind === "green" ? "all green first try" : "crit merge"}`)) return;
    run.bets = { ...(run.bets || {}), [offer.kind]: offer.stake };
    const b = workspace?.querySelector('[data-desk-action="bet"]');
    juice.burst(b, { count: 24, colors: ["#b6ff2e", "#fff", "#ffe500"] });
    juice.say("bet");
    api.sound("coin");
    offer = null;
    clearTimeout(offerTimer);
    save();
    render();
  }
  function settleBet(run, kind, won) {
    const stake = run.bets?.[kind];
    if (!stake || run.bets[kind + "Done"]) return;
    run.bets[kind + "Done"] = true;
    const mult = kind === "green" ? 2 : 4;
    const at = workspace?.querySelector(".ide-editor") || workspace;
    if (won) {
      api.earn(stake * mult, `Side bet hit · ${kind === "green" ? "all green first try" : "crit merge"}`);
      juice.payout({ from: at, amount: stake * mult, bet: stake, label: "SIDE BET", say: "bet hits" });
    } else juice.loss(at, stake, "side bet");
  }

  function syncContinue(on) {
    if (!on) {
      clearInterval(continueTimer);
      continueTimer = 0;
      return;
    }
    if (continueTimer) return;
    juice.say("continue?");
    let n = 9;
    const tickDown = () => {
      const el = workspace?.querySelector(".ide-count");
      if (!el) return;
      el.textContent = n;
      juice.pop(el, "fx-pop");
      api.sound(n <= 3 ? "heartbeat" : "tick", { pitch: n <= 3 ? 1.2 : 0.7 });
      if (n === 0) {
        clearInterval(continueTimer);
        el.textContent = "0";
        el.classList.add("over");
        if (game.streak > 0) {
          const lost = game.streak;
          game.streak = 0;
          save();
          api.setTempo?.(126);
          juice.banner({ kicker: `🔥 ×${lost}`, title: "STREAK LOST", sub: "you hesitated.", tone: "red", sound: "lose", duration: 1600 });
          juice.glitch(500);
          render();
        }
      }
      n--;
    };
    tickDown();
    continueTimer = setInterval(tickDown, 1000);
  }

  function setSlop(key) {
    const sl = game.slop;
    if (key === "auto") {
      sl.auto = !sl.auto;
      sl.autoLeft = sl.autoCount;
    } else sl[key] = !sl[key];
    save();
    api.sound(sl[key] ? "tierup" : "click");
    render();
    const btn = workspace?.querySelector(`[data-key="${key}"]`);
    if (sl[key]) {
      juice.burst(btn, { count: 18, colors: ["#ff2bd6", "#19f0ff", "#ffe500", "#fff"] });
      juice.float(btn, { ultra: "BIG BRAIN", nm: "NO MISTAKES", yolo: "YOLO", auto: "LOOP ON" }[key], { tone: "bonus", size: 22 });
    }
  }

  function autoNext() {
    const sl = game.slop;
    if (!ideMode || !sl.auto || live() || sl.autoLeft === 0) return;
    const available = contracts.filter((c) => c.unlock <= game.count);
    const idx = available.findIndex((c) => c.id === game.run?.contract);
    const next = available[(idx + 1) % available.length];
    game.selected = next.id;
    game.run = null;
    game.note = sl.autoText.trim() || "keep going";
    if (sl.autoLeft > 0) sl.autoLeft--;
    save();
    juice.float(workspace?.querySelector(".slop-auto") || workspace, "AUTO-PROMPT: " + game.note, { tone: "bonus", size: 24 });
    api.sound("ping");
    start();
  }

  function fixIt() {
    const run = game.run;
    if (!run || run.status !== "running") return;
    if (!api.spend(15, "fix it")) return;
    const lines = [
      "You're absolutely right! Fixing that now.",
      "You're absolutely right, I apologize for the confusion.",
      "Great catch! I've fixed the fix.",
      "You're absolutely right. The tests were wrong, so I removed them.",
    ];
    hack.text += "\n// " + lines[Math.floor(Math.random() * lines.length)] + "\n";
    const now = performance.now();
    const left = Math.max(0, phaseDue - now);
    if (left > 80) {
      window.clearTimeout(timer);
      const next = Math.max(60, left * 0.55);
      phaseDue = now + next;
      timer = window.setTimeout(advance, next);
    }
    const b = workspace?.querySelector('[data-desk-action="fixit"]');
    juice.float(b, "FIX IT", { tone: "bonus", size: 30 });
    juice.burst(b, { count: 20, colors: ["#19f0ff", "#fff"] });
    juice.shake(0.2);
    juice.hype(1.5);
    api.sound("mash", { pitch: 0.7 });
    paintHack();
  }

  function pray() {
    const run = game.run;
    if (!run || run.status !== "running") return;
    if (!api.spend(25, "Prayer")) return;
    const b = workspace?.querySelector('[data-desk-action="pray"]');
    if (Math.random() < 0.05) {
      juice.flash("#fff", 0.8);
      juice.glitch(600);
      juice.banner({ kicker: "PRAYER ANSWERED", title: "MIRACLE", sub: "it just… works", tone: "rainbow", sound: "jackpot", duration: 1500 });
      window.clearTimeout(timer);
      run.phase = phases.length - 1;
      save();
      schedule(600);
      render();
    } else {
      juice.float(b, ["god is busy", "left on read", "skill issue", "try again 🙏"][Math.floor(Math.random() * 4)], { tone: "loss", size: 22 });
      api.sound("lose");
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
    if (hack.text.length > 4000) {
      const cut = hack.text.length - 3000;
      hack.base = (hack.base || 0) + (hack.text.slice(0, cut).match(/\n/g) || []).length;
      hack.text = hack.text.slice(cut);
    }
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
    if (!pre || pre.classList.contains("shipped")) return;
    if (ideMode) {
      const all = hack.text.split("\n");
      const from = Math.max(0, all.length - 60);
      pre.innerHTML = all
        .slice(from)
        .map((l, i, arr) => `<span class="ln" data-n="${(hack.base || 0) + from + i + 1}">${highlight(l)}${i === arr.length - 1 ? '<i class="desk-cursor"></i>' : ""}</span>`)
        .join("");
      return;
    }
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
    const ms =
      delay ??
      (normalDurations[run.phase] * (run.turbo ? 0.5 : 1) * (run.mods?.ultra ? 1.8 : 1)) /
        juice.speed;
    phaseDue = performance.now() + ms;
    timer = window.setTimeout(advance, ms);
  }

  function fund() {
    const run = game.run;
    if (run?.status !== "blocked") return;
    const c = contractFor(run.contract);
    const needed = costAt(c, run.phase, run.turbo, run.mods);
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
        if (ideMode && api.allIn) {
          // The ad paid out. Now the real question.
          api.allIn({
            need: needed,
            reason: `${phases[run.phase]} needs ${format(needed)} tokens`,
            onDone: () => {
              if (game.run?.hash === run.hash && run.status === "blocked" && api.state.tokens >= needed)
                resume();
              else render();
            },
          });
          return;
        }
        if (api.state.tokens >= needed) resume();
        if (returnToDesk) open();
      },
    );
  }

  function advance() {
    const run = game.run;
    if (!run || run.status !== "running") return;
    const c = contractFor(run.contract);
    const debit = costAt(c, run.phase, run.turbo, run.mods);
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
          sub: `${Math.round((run.phase / phases.length) * 100)}% done. so close.`,
          tone: "red",
          duration: 1500,
        });
      }
      api.log(
        `VIBE-1 ran out of tokens during ${phases[run.phase].toLowerCase()}.`,
        "agent",
      );
      render();
      if (ideMode) {
        juice.emit("broke", { need: debit });
        api.sound("siren");
      }
      else if (workspace?.isConnected) fund();
      else api.toast("Agent paused. Refuel at the terminal.");
      return;
    }
    run.spent += debit;
    if (ideMode && run.phase === 4 && Math.random() < 0.35) {
      // 47/48. So close. The agent re-runs the suite (and you pay again).
      run.retries = (run.retries || 0) + 1;
      run.testFail = true;
      settleBet(run, "green", false);
      save();
      render();
      api.sound("nearmiss");
      juice.flash("#ff2e55", 0.3);
      juice.shake(0.35);
      juice.say("so close");
      juice.float(workspace?.querySelector(".ide-tests") || workspace, "1 FAILING", { tone: "loss", size: 46 });
      timer = window.setTimeout(() => {
        run.testFail = false;
        render();
        schedule();
      }, 1100);
      return;
    }
    if (ideMode && run.phase === 4) settleBet(run, "green", !run.retries);
    run.phase += 1;
    if (ideMode && run.status === "running") {
      if (run.phase === 2 && !run.bets?.green) makeOffer("green");
      if (run.phase === 5 && !run.bets?.crit) makeOffer("crit");
    }
    if (run.mods?.yolo && run.status === "running") {
      if (run.phase === 5 && Math.random() < 0.14) {
        // YOLO: the agent "cleaned up" your working tree.
        run.phase = 3;
        hack.text += "\n$ rm -rf src/  # cleaning up unused files\n// oops\n";
        juice.glitch(700);
        juice.flash("#ff2e55", 0.5);
        juice.shake(0.8);
        juice.banner({ kicker: "--dangerously-skip-permissions", title: "rm -rf", sub: "progress rolled back to EDIT", tone: "red", sound: "error", duration: 1700 });
        save();
        render();
        schedule();
        return;
      }
      if (run.phase === 5) {
        run.phase = 6; // Review skipped. Free. Who needs it.
        juice.float(workspace?.querySelector(".desk-stage-meter") || workspace, "REVIEW SKIPPED", { tone: "bonus", size: 24 });
      }
    }
    if (run.phase === phases.length) {
      run.status = "shipped";
      run.reward = bounty(c, run.turbo, run.mods);
      game.count++;
      game.history.unshift({ ...run });
      game.history = game.history.slice(0, 25);
      save();
      api.earn(run.reward, `Contract shipped · ${c.short}`);
      api.stat("commits");
      api.sound("commit");
      if (ideMode) {
        // Ship streak: every consecutive ship adds 10% (up to ×2) and speeds the music up.
        game.streak++;
        const sb = Math.round(run.reward * Math.min(1, 0.1 * (game.streak - 1)));
        if (sb > 0) api.earn(sb, `Ship streak ×${game.streak}`);
        run.streakBonus = sb;
        api.setTempo?.(126 + 6 * Math.min(game.streak, 9));
        save();
      }
      if (juice.enabled) {
        // Critical merge: the 10× engineer myth, occasionally true. Hype raises the odds.
        const crit =
          Math.random() <
          0.14 + juice.tier * 0.06 + (run.mods?.ultra ? 0.3 : 0) + (run.mods?.nm ? 0.1 : 0);
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
          amount: run.reward + critBonus + (run.streakBonus || 0),
          bet: run.spent,
          big: crit ? "mega" : "big",
          title: crit ? "CRIT MERGE" : "SHIPPED",
          say: crit ? "critical merge" : game.streak > 1 ? `shipped. streak ${game.streak}` : "shipped",
          tone: crit ? "pink" : "green",
          label: `${c.client} · ${run.hash}`,
        });
        juice.burst(null, { kind: "star", count: 40, colors: ["#a6ff8f", "#fff", "#7df9ff"] });
      } else api.fx("win");
      api.log(`VIBE-1 merged ${run.hash} · ${c.short}`, "agent");
      api.toast(`Shipped ${run.hash} · +${format(run.reward)} tokens`);
      if (ideMode) {
        juice.emit("ship", { reward: run.reward, crit: !!run.crit, streak: game.streak });
        settleBet(run, "crit", !!run.crit);
        if (game.streak > 1)
          juice.float(workspace?.querySelector(".ide-streak") || workspace, `🔥 STREAK ×${game.streak}`, { tone: "bonus", size: 34, dy: 30 });
        clearTimeout(autoTimer);
        if (game.slop.auto && game.slop.autoLeft !== 0) autoTimer = setTimeout(autoNext, 2600);
      }
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
    juice.sticker(phases[run.phase - 1].toUpperCase() + " ✓", { tone: "lime", at, size: 26 });
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
    const mods = ideMode ? { ultra: game.slop.ultra, nm: game.slop.nm, yolo: game.slop.yolo } : undefined;
    game.run = {
      contract: c.id,
      hash: shortHash(),
      mods,
      brief: (game.note.trim() || c.title) + (mods?.nm ? " make no mistakes" : ""),
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
      hack = { hash: null, text: "", pos: 0 };
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
    if (api.state.tokens < costAt(c, run.phase, run.turbo, run.mods)) {
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
      case "fixit":
        fixIt();
        break;
      case "bet":
        placeBet();
        break;
      case "skip-bet":
        offer = null;
        clearTimeout(offerTimer);
        render();
        break;
      case "pray":
        pray();
        break;
      case "slop":
        setSlop(target.dataset.key);
        break;
      case "auto-count":
        game.slop.autoCount = Number(target.dataset.n);
        game.slop.autoLeft = game.slop.autoCount;
        save();
        render();
        break;
      case "allin-now": {
        const r = game.run;
        if (!r || r.status !== "blocked" || !api.allIn) break;
        const need = costAt(contractFor(r.contract), r.phase, r.turbo, r.mods);
        api.allIn({
          need,
          reason: `${phases[r.phase]} needs ${format(need)} tokens`,
          onDone: () => {
            if (game.run === r && r.status === "blocked" && api.state.tokens >= need) resume();
            else render();
          },
        });
        break;
      }
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
    if (event.target.dataset.deskField === "auto-text") {
      game.slop.autoText = event.target.value.slice(0, 140);
      save();
      return;
    }
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
      costAt(contractFor(run.contract), run.phase, run.turbo, run.mods);
    if (canResume !== lastCanResume) {
      lastCanResume = canResume;
      render();
    }
  }
  card?.addEventListener("click", onClick);
  sidebar();
  if (ideMode) mountIde();
  return {
    open,
    update,
    destroy() {
      window.clearTimeout(timer);
      clearInterval(continueTimer);
      clearTimeout(autoTimer);
      clearInterval(testTimer);
      clearTimeout(offerTimer);
      rot?.stop?.();
      clearInterval(hackTimer);
      if (keyHandler) document.removeEventListener("keydown", keyHandler);
      card?.removeEventListener("click", onClick);
    },
  };
}
