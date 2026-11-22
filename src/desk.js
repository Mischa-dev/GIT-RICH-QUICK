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
const makeButton = (action, label, kind = "secondary", extra = "") =>
  `<button type="button" class="desk-btn desk-${kind}" data-desk-action="${action}" ${extra}>${label}</button>`;
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
    card.innerHTML = `<div class="desk-panel">
      <div class="desk-card-head"><h2>${terminalIcon} Agent terminal</h2><span class="desk-status desk-status-${state}">${pulse}${statusLabel(state)}</span></div>
      <div class="desk-mini-term" aria-label="Current agent output">
        <div><span class="desk-shell">vibe@floor</span><span class="desk-dim">:~$</span> ${run ? "agent run" : "agent --standby"}</div>
        <div class="desk-mini-ticket"><span>${run ? "ticket" : "queued"}</span> ${esc(contract.short)}</div>
        <div class="desk-mini-output"><span aria-hidden="true">›</span> ${esc(line)}<i class="desk-cursor"></i></div>
        ${run && state !== "shipped" ? `<div class="desk-micro-progress" aria-label="${run.phase} of 7 steps">${phases.map((_, i) => `<i class="${i < run.phase ? "checked" : ""}"></i>`).join("")}</div>` : ""}
      </div>
      <button class="desk-launch" type="button" data-desk-action="open"><span>${state === "blocked" ? "Refuel agent" : state === "running" ? "Inspect run" : state === "paused" ? "Inspect checkpoint" : "Open workstation"}</span>${externalIcon}</button>
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
    api.modal("Agent workstation", workspace, {
      wide: true,
      eyebrow: "CASINO OPERATIONS / LOCAL SIM",
      onClose: () => {
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
          (l) =>
            `<code class="desk-code-${l.startsWith("+") ? "add" : l.startsWith("-") ? "del" : "hunk"}">${esc(l)}</code>`,
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
      )}${run.status === "running" ? `<span class="desk-stream-tail">› ${esc(phases[run.phase])}…<i class="desk-cursor"></i></span>` : ""}</div>`;
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
      <div class="desk-actions">${run.status === "running" ? makeButton("pause", "Ⅱ Pause agent") : makeButton("resume", "Resume agent ▶", "primary")}</div>`;
    workspace.innerHTML = `
      <div class="desk-topline"><span class="desk-identity">${terminalIcon} VIBE-1 <em>/ local worker</em></span><span class="desk-rank">${esc(rankFor(game.count))} · ${game.count} commit${game.count === 1 ? "" : "s"}</span></div>
      ${
        run
          ? `<div class="desk-ticket"><div class="desk-kicker">${esc(c.client)} <span>·</span> ${run.turbo ? "OVERCLOCK" : "STANDARD"}</div><h3>${esc(c.title)}</h3>${run.brief && run.brief !== c.title ? `<p class="desk-note">“${esc(run.brief)}”</p>` : ""}</div>
      <div class="desk-meter-head"><span class="desk-status desk-status-${esc(run.status)}">${pulse}${statusLabel(run.status)}</span><span>${run.phase}/${phases.length} STEPS · ${format(run.spent)} TOKENS USED</span></div>
      <div class="desk-stage-meter">${phases.map((phase, i) => `<span title="${phase}" class="${i < run.phase ? "done" : i === run.phase ? "now" : ""}"></span>`).join("")}</div>
      <div class="desk-tabs" aria-label="Run details">${[
        ["log", "Output"],
        ["diff", "Diff"],
        ["history", "Commits"],
      ]
        .map(
          ([key, label]) =>
            `<button type="button" data-desk-action="tab" data-tab="${key}" aria-pressed="${tab === key}">${label}${key === "diff" && run.phase >= 4 ? " <i>1</i>" : ""}</button>`,
        )
        .join("")}</div>
      <div class="desk-inspector">${inspector(run)}</div>
      ${historyId && live() ? makeButton("return", "← Back to active worker") : actionArea}`
          : `
      <div class="desk-compose">
        <div class="desk-kicker">ISSUE BOUNTY BOARD</div>
        <h3>Put your agent to work<span>.</span></h3>
        <label class="desk-field">Contract<select data-desk-field="contract">${options}</select></label>
        <label class="desk-field">Operator brief<textarea data-desk-field="note" rows="2" maxlength="${maxNote}" placeholder="${esc(choice().title)}">${esc(game.note)}</textarea></label>
        <div class="desk-speedrow"><div class="desk-speeds" aria-label="Worker speed">${[false, true].map((t) => `<button type="button" data-desk-action="speed" data-speed="${t ? 1 : 0}" aria-pressed="${game.turbo === t}">${t ? "⚡ Overclock" : "Standard"}</button>`).join("")}</div><span>${game.turbo ? "2× speed" : "1× speed"}</span></div>
        <div class="desk-offer"><div><small>Build cost</small><b>${format(estimate(choice(), game.turbo))} <em>tokens</em></b></div><div><small>On merge</small><b>+${format(bounty(choice(), game.turbo))} <em>tokens</em></b></div></div>
        ${makeButton("start", "▶ Deploy agent", "primary")}
      </div>
      ${game.history.length ? `<div class="desk-previous"><span>Latest commit</span><button data-desk-action="history-run" data-hash="${esc(game.history[0].hash)}">${esc(game.history[0].hash)} ↗</button></div>` : ""}`
      }
      <div class="desk-t3"><span>${live() ? "Worker runs while you play." : "Local simulation · fake tokens"}</span>${makeButton("t3", "Open in T3 Code ↗", "link")}</div>`;
    const stream = workspace.querySelector(".desk-scroll-log");
    if (stream) stream.scrollTop = stream.scrollHeight;
  }

  function schedule(delay) {
    window.clearTimeout(timer);
    const run = game.run;
    if (!run || run.status !== "running") return;
    const ms = delay ?? normalDurations[run.phase] * (run.turbo ? 0.5 : 1);
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
      api.fx("win");
      api.log(`VIBE-1 merged ${run.hash} · ${c.short}`, "agent");
      api.toast(`Shipped ${run.hash} · +${format(run.reward)} tokens`);
    } else {
      save();
      api.sound("tick");
      schedule();
    }
    render();
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
    render();
    schedule(320);
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
      card?.removeEventListener("click", onClick);
    },
  };
}
