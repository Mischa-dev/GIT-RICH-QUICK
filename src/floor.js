const cabinets = {
  merge: {
    title: "Merge Conflict",
    genre: "Higher or lower",
    color: "#ff977f",
    cover: new URL("../assets/floor-merge.png", import.meta.url).href,
  },
  roulette: {
    title: "Blame Roulette",
    genre: "Pick the culprit",
    color: "#bb9eff",
    cover: new URL("../assets/floor-roulette.png", import.meta.url).href,
  },
  deploy: {
    title: "Deploy or Die",
    genre: "Crash & cash out",
    color: "#eac078",
    cover: new URL("../assets/floor-deploy.png", import.meta.url).href,
  },
};

const suspects = {
  frontend: { name: "Frontend", short: "FE", color: "#f78883", count: 3 },
  backend: { name: "Backend", short: "BE", color: "#8c9cef", count: 3 },
  dns: { name: "DNS", short: "DNS", color: "#72d1b5", count: 1 },
  cache: { name: "The cache", short: "L1", color: "#f2c579", count: 1 },
};
const sectors = [
  "frontend",
  "backend",
  "dns",
  "frontend",
  "backend",
  "cache",
  "frontend",
  "backend",
];
const blameReports = {
  frontend: "Works at exactly one viewport width.",
  backend: "Health check returned “probably”.",
  dns: "It was DNS. Someone owes you an apology.",
  cache: "The incident was resolved three incidents ago.",
};
const stakes = [10, 25, 50, 100, 250];
const ceiling = 8;
const flightTempo = 5200;
const flightValue = (elapsed) => Math.exp(Math.max(0, elapsed) / flightTempo);
const creditedAt = (stake, value) =>
  Math.floor((stake * Math.floor(value * 100 + 1e-8)) / 100);
const twoDigits = (n) => String(n).padStart(2, "0");
const randomBase = () => 2 + Math.floor(Math.random() * 7);
const reducedMotion = () =>
  globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function node(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function button(className, text, onClick) {
  const el = node("button", className, text);
  el.type = "button";
  el.addEventListener("click", onClick);
  return el;
}

function controlLabel(text) {
  return node("span", "fl-label", text);
}

function drawFlight(canvas, elapsed, value, status) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const width = canvas.width;
  const height = canvas.height;
  const isLaunch =
    status === "active" || status === "paid" || status === "crashed";
  const progress = isLaunch
    ? Math.min(1, Math.log(Math.max(1, value)) / Math.log(ceiling))
    : 0;
  const x = Math.round(27 + progress * (width - 57));
  const y = Math.round(
    height -
      23 -
      (height - 40) * (0.25 * progress + 0.75 * progress * progress),
  );
  ctx.clearRect(0, 0, width, height);
  const px = (a, b, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(a, b, w, h);
  };
  px(0, 0, width, height, "#192d31");
  for (let i = 0; i < 67; i++) {
    const sx = (31 + i * 7919) % width;
    const sy = (19 + i * 3571) % (height - 12);
    px(sx, sy, 1 + Number(i % 13 === 0), 1, i % 3 ? "#385955" : "#90957b");
  }
  for (let i = 0; i < width; i += 6) {
    const bh = 4 + Math.abs(Math.sin(i * 21)) * 8;
    px(i, height - Math.round(bh), 5, Math.ceil(bh), "#2b4845");
  }
  for (let i = 0; i < width; i += 22) {
    for (let j = 12; j < height - 10; j += 12) px(i, j, 1, 1, "#48625b");
  }
  for (let i = 4; i <= x; i++) {
    const p = Math.max(0, (i - 27) / (width - 57));
    const py = Math.round(
      height - 23 - (height - 40) * (0.25 * p + 0.75 * p * p),
    );
    px(i, py + 2, 1, 1, "#657860");
    px(i, py + 1, 1, 1, "#c7a86a");
    if (i % 5 === 0) px(i, py, 1, 1, "#f4d39a");
  }
  if (status === "crashed") {
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8;
      const rad = i % 2 ? 5 : 9;
      px(
        x + Math.round(Math.cos(a) * rad),
        y + Math.round(Math.sin(a) * rad),
        2,
        2,
        i % 3 ? "#ff9a68" : "#ffe2a2",
      );
    }
    px(x - 3, y - 3, 6, 6, "#ffc46e");
    return;
  }
  const rocket = [
    "          11",
    "        1121",
    "    4441221 ",
    "     12221  ",
    "    12231   ",
    "   12221    ",
    "    12144   ",
    "   501 4    ",
    "  605       ",
    " 76         ",
  ];
  const colors = [
    "#fdc277",
    "#6c8b85",
    "#f1e8ca",
    "#79c9c0",
    "#f19565",
    "#f8a84b",
    "#ffe28a",
    "#ef824e",
  ];
  for (let row = 0; row < rocket.length; row++) {
    for (let col = 0; col < rocket[row].length; col++) {
      const cell = rocket[row][col];
      if (
        cell === " " ||
        (Number(cell) >= 5 &&
          status === "active" &&
          (Math.floor(elapsed / 100) + col) % 5 === 0)
      )
        continue;
      px(x - 5 + col, y - 5 + row, 1, 1, colors[Number(cell)]);
    }
  }
}

export function initFloor(api) {
  const grid = document.querySelector("#floor-cards");
  const preferences = api.get("floor.preferences", {});
  const last = api.get("floor.receipts", {});
  let stake = stakes.includes(preferences.stake) ? preferences.stake : 50;
  let base =
    Number.isInteger(preferences.base) &&
    preferences.base >= 2 &&
    preferences.base <= 8
      ? preferences.base
      : randomBase();
  let pick = Object.hasOwn(suspects, preferences.pick)
    ? preferences.pick
    : "frontend";
  let flight = api.get("floor.flight", null);
  let host = null;
  let gameId = null;
  let timer = null;
  let reveal = null;
  let dismissTimer = null;
  let wheelRotation = 0;
  let playSequence = 0;
  let flightStage = null;
  const cards = new Map();
  const money = (value) => api.format(value);

  function rememberPreferences() {
    api.set("floor.preferences", { stake, base, pick });
  }
  function rememberResult(id, result) {
    last[id] = result;
    api.set("floor.receipts", last);
  }
  function logPayout(id, wager, paid) {
    const title = cabinets[id].title;
    if (paid) api.earn(paid, title + " payout");
    const net = paid - wager;
    api.log(
      title + " · " + (net >= 0 ? "+" : "−") + money(Math.abs(net)) + " T",
      net > 0 ? "win" : "game",
    );
    if (net > 0) {
      api.sound(paid / wager >= 5 ? "bigwin" : "win");
      api.fx(paid / wager >= 5 ? "jackpot" : "win");
    } else {
      api.sound(net === 0 ? "tick" : "lose");
    }
  }
  function wager(id) {
    if (api.spend(stake, cabinets[id].title + " wager")) {
      api.stat("floorPlays");
      return true;
    }
    api.fund(
      "You need " +
        money(stake) +
        " tokens to play " +
        cabinets[id].title +
        ".",
      () => open(id),
    );
    return false;
  }

  function wagerBar(locked = false) {
    const bar = node("div", "fl-wager");
    bar.append(controlLabel("Your wager"));
    const options = node("div", "fl-stakes");
    options.setAttribute("role", "group");
    options.setAttribute("aria-label", "Wager in tokens");
    for (const amount of stakes) {
      const option = button("fl-stake", String(amount), () => {
        if (locked || reveal || (gameId === "deploy" && flight)) return;
        stake = amount;
        rememberPreferences();
        api.sound("click");
        paint();
      });
      option.setAttribute("aria-label", amount + " tokens");
      option.setAttribute("aria-pressed", String(stake === amount));
      option.disabled = locked;
      options.append(option);
    }
    bar.append(options);
    return bar;
  }

  function receipt(id) {
    const result = last[id];
    const box = node("div", "fl-receipt");
    box.setAttribute("role", "status");
    if (!result) {
      box.hidden = true;
      return box;
    }
    box.classList.add(result.result);
    box.append(node("strong", "", result.head), node("span", "", result.copy));
    return box;
  }

  function cardFace(number, label, unknown = false) {
    const face = node("div", "fl-revision" + (unknown ? " hidden-card" : ""));
    face.append(
      node("span", "fl-card-index", label),
      node("b", "", number === null ? "?" : twoDigits(number)),
      node(
        "span",
        "fl-rev-bottom",
        number === null ? "AWAITING PATCH" : "REVISION",
      ),
    );
    return face;
  }

  function playMerge(higher) {
    if (reveal || gameId !== "merge") return;
    const current = base;
    const playedStake = stake;
    const sides = higher ? 9 - current : current - 1;
    if (!wager("merge")) return;
    const next = 1 + Math.floor(Math.random() * 9);
    const tie = current === next;
    const won = higher ? next > current : next < current;
    const paid = tie
      ? playedStake
      : won
        ? Math.floor((playedStake * 8) / sides)
        : 0;
    const message = tie
      ? "Rebase. Wager returned."
      : won
        ? "Clean merge. +" + money(paid - playedStake) + " T"
        : "Conflict. −" + money(playedStake) + " T";
    const result = {
      result: tie ? "draw" : won ? "win" : "loss",
      head: message,
      copy:
        "Revision " +
        twoDigits(current) +
        " → " +
        twoDigits(next) +
        ". You called " +
        (higher ? "higher." : "lower."),
    };
    rememberResult("merge", result);
    base = next >= 2 && next <= 8 && !tie ? next : randomBase();
    rememberPreferences();
    reveal = { id: "merge", current, next };
    logPayout("merge", playedStake, paid);
    paint();
  }

  function renderMerge() {
    const shell = node("div", "fl-game fl-merge");
    const current = reveal?.id === "merge" ? reveal.current : base;
    const scene = node("div", "fl-merge-stage");
    const battle = node("div", "fl-battle");
    battle.append(
      cardFace(current, "HEAD"),
      node("span", "fl-vs", "VS"),
      cardFace(reveal?.next ?? null, "PATCH", !reveal),
    );
    scene.append(battle);
    shell.append(
      scene,
      node(
        "p",
        "fl-rules",
        "Will the next revision be higher or lower? Patches roll from 01 to 09. Ties return your wager.",
      ),
    );
    shell.append(wagerBar(!!reveal));
    if (reveal) {
      shell.append(
        receipt("merge"),
        button("fl-action fl-primary", "Deal next revision  ↗", () => {
          reveal = null;
          api.sound("click");
          paint();
        }),
      );
    } else {
      const decisions = node("div", "fl-decisions");
      for (const higher of [false, true]) {
        const payout = Math.floor(
          (stake * 8) / (higher ? 9 - current : current - 1),
        );
        const option = button("fl-action fl-direction", "", () =>
          playMerge(higher),
        );
        option.append(
          node("strong", "", higher ? "↑  Higher" : "↓  Lower"),
          node("span", "", "Returns " + money(payout) + " T"),
        );
        decisions.append(option);
      }
      shell.append(decisions);
      if (last.merge) shell.append(receipt("merge"));
    }
    return shell;
  }

  function makeWheel(rotation) {
    const wrap = node("div", "fl-wheel-wrap");
    const wheel = node("div", "fl-wheel");
    wheel.style.background =
      "conic-gradient(" +
      sectors
        .map(
          (s, i) =>
            suspects[s].color + " " + 45 * i + "deg " + 45 * (i + 1) + "deg",
        )
        .join(",") +
      ")";
    wheel.style.transform = "rotate(" + rotation + "deg)";
    for (let i = 0; i < sectors.length; i++) {
      const slice = node("span", "fl-sector", suspects[sectors[i]].short);
      const a = ((i * 45 + 22.5) * Math.PI) / 180;
      slice.style.left = 50 + 36 * Math.sin(a) + "%";
      slice.style.top = 50 - 36 * Math.cos(a) + "%";
      slice.style.transform =
        "translate(-50%, -50%) rotate(" + (i * 45 + 22.5) + "deg)";
      wheel.append(slice);
    }
    const cap = node("span", "fl-wheel-cap", "!");
    wrap.append(wheel, cap, node("i", "fl-wheel-needle"));
    return wrap;
  }

  function playRoulette() {
    if (reveal || gameId !== "roulette") return;
    const chosen = pick;
    const playedStake = stake;
    if (!wager("roulette")) return;
    const landed = Math.floor(Math.random() * sectors.length);
    const responsible = sectors[landed];
    const won = chosen === responsible;
    const paid = won
      ? Math.floor((playedStake * sectors.length) / suspects[chosen].count)
      : 0;
    const result = {
      result: won ? "win" : "loss",
      head:
        (won
          ? "Called it. +" + money(paid - playedStake)
          : "Wrong culprit. −" + money(playedStake)) + " T",
      copy: suspects[responsible].name + ". " + blameReports[responsible],
    };
    rememberResult("roulette", result);
    const offset =
      (360 - (landed * 45 + 22.5) - (wheelRotation % 360) + 360) % 360;
    const from = wheelRotation;
    wheelRotation += 1080 + offset;
    reveal = { id: "roulette", from, to: wheelRotation };
    api.sound("spin");
    // Credit the roll once even if the player closes the CRT during the visual spin.
    if (paid) api.earn(paid, "Blame Roulette payout");
    api.log(
      "Blame Roulette · " +
        suspects[responsible].name +
        " · " +
        (won ? "+" + money(paid - playedStake) : "−" + money(playedStake)) +
        " T",
      won ? "win" : "game",
    );
    paint();
    const wheel = host?.querySelector(".fl-wheel");
    if (wheel) {
      wheel.getBoundingClientRect();
      wheel.style.transform = "rotate(" + wheelRotation + "deg)";
    }
    const serial = playSequence;
    dismissTimer = setTimeout(
      () => {
        if (serial !== playSequence || gameId !== "roulette") return;
        reveal = null;
        dismissTimer = null;
        api.sound(won ? (paid / playedStake >= 5 ? "bigwin" : "win") : "lose");
        if (won) api.fx(paid / playedStake >= 5 ? "jackpot" : "win");
        paint();
      },
      reducedMotion() ? 100 : 1500,
    );
  }

  function renderRoulette() {
    const spinning = reveal?.id === "roulette";
    const shell = node("div", "fl-game fl-roulette");
    const stage = node("div", "fl-roulette-stage");
    const sides = node("div", "fl-suspects");
    sides.append(controlLabel("Who broke prod?"));
    for (const [id, suspect] of Object.entries(suspects)) {
      const opt = button("fl-suspect", "", () => {
        if (reveal) return;
        pick = id;
        rememberPreferences();
        api.sound("click");
        paint();
      });
      opt.style.setProperty("--suspect", suspect.color);
      opt.setAttribute("aria-pressed", String(id === pick));
      opt.disabled = !!spinning;
      opt.append(
        node("i", ""),
        node("b", "", suspect.name),
        node("span", "", suspect.count + "/8"),
      );
      sides.append(opt);
    }
    stage.append(makeWheel(spinning ? reveal.from : wheelRotation), sides);
    shell.append(
      stage,
      node(
        "p",
        "fl-rules",
        "Pick a culprit. Each of the eight wheel sectors is equally likely.",
      ),
    );
    shell.append(wagerBar(!!spinning));
    const payout = Math.floor((stake * 8) / suspects[pick].count);
    const spin = button(
      "fl-action fl-primary",
      spinning ? "Assigning blame…" : "Spin for " + money(payout) + " T  ↗",
      playRoulette,
    );
    spin.disabled = !!spinning;
    shell.append(spin);
    if (!spinning) shell.append(receipt("roulette"));
    return shell;
  }

  function settleFlight(value, crashed, auto = false) {
    if (!flight) return;
    const { wager: playedStake, started } = flight;
    flight = null;
    if (timer) clearInterval(timer);
    timer = null;
    api.set("floor.flight", null);
    const paid = crashed ? 0 : creditedAt(playedStake, value);
    const displayValue = Math.floor(value * 100) / 100;
    const result = {
      result: crashed ? "loss" : paid > playedStake ? "win" : "draw",
      head: crashed
        ? "Production is down. −" + money(playedStake) + " T"
        : (auto ? "Orbit reached. +" : "Rollback secured. +") +
          money(paid - playedStake) +
          " T",
      copy: crashed
        ? "The build reached " +
          displayValue.toFixed(2) +
          "× before the incident."
        : "Cashed out " +
          money(paid) +
          " T at " +
          displayValue.toFixed(2) +
          "×.",
      value: displayValue,
      elapsed: Math.max(0, Date.now() - started),
      status: crashed ? "crashed" : "paid",
    };
    rememberResult("deploy", result);
    logPayout("deploy", playedStake, paid);
    if (gameId === "deploy" && host) paint();
    else api.toast(result.head);
    update();
  }

  function syncFlight(cashingOut = false) {
    if (!flight) return;
    const elapsed = Date.now() - flight.started;
    const raw = flightValue(elapsed);
    if (raw >= Math.min(ceiling, flight.crashAt)) {
      if (flight.crashAt >= ceiling) settleFlight(ceiling, false, true);
      else settleFlight(flight.crashAt, true);
    } else if (cashingOut) {
      settleFlight(Math.floor(raw * 100) / 100, false);
    } else if (gameId === "deploy" && flightStage) {
      const reading = Math.floor(raw * 100) / 100;
      flightStage.figure.textContent = reading.toFixed(2) + "×";
      flightStage.button.textContent =
        "Cash out " + money(creditedAt(flight.wager, reading)) + " T";
      flightStage.clock.textContent =
        "T+" + (Math.max(0, elapsed) / 1000).toFixed(1) + " s";
      drawFlight(flightStage.canvas, elapsed, raw, "active");
    }
  }

  function startFlight() {
    if (flight || gameId !== "deploy") return;
    if (!wager("deploy")) return;
    // P(reach m) = 1/m. Whole-token payouts round down. Orbit pays automatically at 8×.
    const crashAt = 1 / Math.max(Number.EPSILON, Math.random());
    flight = { wager: stake, started: Date.now(), crashAt };
    api.set("floor.flight", flight);
    api.sound("cast");
    paint();
    update();
    watchFlight();
  }

  function watchFlight() {
    if (timer || !flight) return;
    syncFlight();
    if (flight) timer = setInterval(syncFlight, 65);
  }

  function renderDeploy() {
    const shell = node("div", "fl-game fl-deploy");
    const stage = node("div", "fl-flight-stage");
    const canvas = node("canvas", "fl-flight-screen");
    canvas.width = 320;
    canvas.height = 90;
    canvas.setAttribute("aria-hidden", "true");
    const telemetry = node("div", "fl-telemetry");
    const clock = node("span", "fl-clock", flight ? "T+0.0 s" : "T−00:00");
    const result = last.deploy;
    const reading = flight ? 1 : result ? result.value : 1;
    const figure = node("strong", "", reading.toFixed(2) + "×");
    telemetry.append(
      controlLabel(
        flight
          ? "Deployment live"
          : result
            ? result.status === "crashed"
              ? "Incident report"
              : "Recovered"
            : "Launchpad ready",
      ),
      figure,
    );
    stage.append(canvas, telemetry, clock);
    shell.append(
      stage,
      node(
        "p",
        "fl-rules",
        "The multiplier climbs until production crashes. Cash out in time or lose the wager. Reach 8× and orbit pays automatically.",
      ),
    );
    shell.append(wagerBar(!!flight));
    const action = button(
      "fl-action fl-primary",
      flight
        ? "Cash out " + money(flight.wager) + " T"
        : "Deploy for " + money(stake) + " T  ↗",
      () => (flight ? syncFlight(true) : startFlight()),
    );
    shell.append(action);
    if (!flight) shell.append(receipt("deploy"));
    flightStage = { figure, canvas, clock, button: action };
    drawFlight(
      canvas,
      result?.elapsed || 0,
      reading,
      flight ? "active" : result?.status || "idle",
    );
    return shell;
  }

  function paint() {
    if (!host || !gameId) return;
    flightStage = null;
    const body =
      gameId === "merge"
        ? renderMerge()
        : gameId === "roulette"
          ? renderRoulette()
          : renderDeploy();
    host.replaceChildren(body);
  }

  function clearView() {
    playSequence++;
    if (dismissTimer) clearTimeout(dismissTimer);
    dismissTimer = null;
    reveal = null;
    host = null;
    gameId = null;
    flightStage = null;
  }

  function open(id) {
    if (!Object.hasOwn(cabinets, id)) {
      grid?.scrollIntoView({
        behavior: reducedMotion() ? "instant" : "smooth",
        block: "center",
      });
      return;
    }
    const content = node("div", "fl-host");
    content.style.setProperty("--fl-accent", cabinets[id].color);
    api.modal(cabinets[id].title, content, {
      eyebrow: "ARCADE FLOOR / " + cabinets[id].genre.toUpperCase(),
      onClose: () => {
        if (host === content) clearView();
      },
    });
    clearView();
    host = content;
    gameId = id;
    paint();
    if (id === "deploy") syncFlight();
  }

  function update() {
    const deploy = cards.get("deploy");
    if (deploy)
      deploy.querySelector(".fl-genre").textContent = flight
        ? "Deployment in flight"
        : cabinets.deploy.genre;
  }

  if (grid) {
    grid.classList.add("fl-grid");
    for (const [id, spec] of Object.entries(cabinets)) {
      const card = button("fl-cabinet", "", () => open(id));
      card.dataset.game = id;
      card.style.setProperty("--fl-accent", spec.color);
      card.setAttribute("aria-label", "Play " + spec.title);
      const cover = node("img", "fl-cover");
      cover.alt = "";
      cover.src = spec.cover;
      cover.width = 288;
      cover.height = 104;
      const foot = node("span", "fl-card-foot");
      const details = node("span", "fl-card-details");
      details.append(
        node("strong", "", spec.title),
        node("span", "fl-genre", spec.genre),
      );
      const arrow = node("span", "fl-arrow", "↗");
      arrow.setAttribute("aria-hidden", "true");
      foot.append(details, arrow);
      card.append(cover, foot);
      cards.set(id, card);
    }
    grid.replaceChildren(...cards.values());
  }
  update();
  if (
    flight &&
    Number.isFinite(flight.started) &&
    Number.isFinite(flight.crashAt) &&
    flight.wager > 0
  )
    watchFlight();
  else flight = null;
  return {
    open,
    update,
    destroy() {
      clearView();
      clearInterval(timer);
      timer = null;
    },
  };
}
