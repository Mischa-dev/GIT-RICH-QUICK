const asset = (file) => new URL("../assets/" + file, import.meta.url).href;

export const slotSymbols = [
  { id: "cherries", name: "Cherry-pick", weight: 26, triple: 6 },
  { id: "seven", name: "Lucky seven", weight: 10, triple: 40 },
  { id: "diamond", name: "Diamond hands", weight: 16, triple: 18 },
  { id: "terminal", name: "Green build", weight: 19, triple: 8 },
  { id: "floppy", name: "Save point", weight: 15, triple: 10 },
  { id: "duck", name: "Rubber duck", weight: 14, triple: 12 },
];

const bets = [10, 25, 50, 100, 250, 500];
const initialReels = ["cherries", "seven", "diamond"];
const symbolsById = new Map(slotSymbols.map((symbol) => [symbol.id, symbol]));
const sessionKey = "slots.session";
const randomWord = new Uint32Array(1);

export function rollSymbol() {
  // Reject the short remainder so every percentage point has equal weight.
  do {
    crypto.getRandomValues(randomWord);
  } while (randomWord[0] >= 4294967200);
  let ticket = randomWord[0] % 100;
  for (const symbol of slotSymbols) {
    if (ticket < symbol.weight) return symbol.id;
    ticket -= symbol.weight;
  }
}

export function priceSpin(reels, bet) {
  const [left, center, right] = reels;
  if (left === center && center === right) {
    return {
      payout: bet * symbolsById.get(left).triple,
      match: "triple",
      symbol: left,
    };
  }
  const pair =
    left === center || left === right ? left : center === right ? center : null;
  if (pair)
    return {
      payout: bet * (pair === "cherries" ? 2 : 1),
      match: "pair",
      symbol: pair,
    };
  return { payout: 0, match: "miss", symbol: null };
}

function imageFor(id, alt = "") {
  const image = document.createElement("img");
  image.src = asset("reel-" + id + ".png");
  image.alt = alt;
  image.draggable = false;
  image.width = 52;
  image.height = 46;
  return image;
}

function loadSession(api) {
  const saved = api.get(sessionKey, {}) || {};
  return {
    bet: bets.includes(saved.bet) ? saved.bet : 50,
    reels:
      Array.isArray(saved.reels) &&
      saved.reels.length === 3 &&
      saved.reels.every((id) => symbolsById.has(id))
        ? saved.reels
        : initialReels,
    lastPayout: Math.max(0, Number(saved.lastPayout) || 0),
    misses: Math.max(0, Number(saved.misses) || 0),
    hold:
      Number.isInteger(saved.hold) && saved.hold >= 0 && saved.hold <= 2
        ? saved.hold
        : null,
    status:
      typeof saved.status === "string"
        ? saved.status.slice(0, 80)
        : "Ready to roll",
    tone: ["win", "jackpot", "miss", "push"].includes(saved.tone)
      ? saved.tone
      : "ready",
  };
}

export function initSlots(api) {
  const host = document.getElementById("slot-machine");
  const session = loadSession(api);
  const timers = new Set();
  let spinning = false;
  let destroyed = false;
  let sessionVisiblePayout = session.lastPayout;
  let pendingFunding = false;

  host.innerHTML = `
    <section class="slot-cabinet" aria-label="Commit Slots">
      <i class="slot-screw slot-screw-tl" aria-hidden="true"></i>
      <i class="slot-screw slot-screw-tr" aria-hidden="true"></i>
      <i class="slot-screw slot-screw-bl" aria-hidden="true"></i>
      <i class="slot-screw slot-screw-br" aria-hidden="true"></i>
      <div class="slot-marquee">
        <div class="slot-rail slot-rail-top" aria-hidden="true"></div>
        <div class="slot-scene">
          <img class="slot-nameplate" src="${asset("slot-title.png")}" alt="Commit Slots" draggable="false">
        </div>
        <div class="slot-rail slot-rail-bottom" aria-hidden="true"></div>
      </div>
      <div class="slot-deck">
        <div class="slot-instrument">
          <span class="slot-machine-tag"><b aria-hidden="true">◆</b> GRQ<span class="slot-tag-slash"> / </span>MK. I</span>
          <span class="slot-led-meter" aria-hidden="true"></span>
          <button class="slot-payouts" type="button">Paytable <span aria-hidden="true">↗</span></button>
        </div>
        <div class="slot-reel-frame">
          <i class="slot-payline slot-payline-left" aria-hidden="true"></i>
          <div class="slot-reels" role="group" aria-label="Slot reels"></div>
          <i class="slot-payline slot-payline-right" aria-hidden="true"></i>
        </div>
        <div class="slot-readout" aria-live="polite" aria-atomic="true">
          <b class="slot-indicator" aria-hidden="true"></b><span class="slot-status"></span>
          <span class="slot-readout-rule" aria-hidden="true"></span>
          <span class="slot-payout-led" aria-hidden="true"></span>
        </div>
        <div class="slot-controls">
          <div class="slot-bet-box">
            <span class="slot-control-label">Bet amount</span>
            <div class="slot-bet">
              <button type="button" data-step="-1" aria-label="Decrease bet">−</button>
              <output class="slot-bet-value"></output>
              <button type="button" data-step="1" aria-label="Increase bet">+</button>
            </div>
          </div>
          <button class="slot-spin" type="button">
            <span class="slot-spin-center"><span class="slot-spin-icon" aria-hidden="true">↻</span> <span class="slot-spin-label">Spin</span></span>
            <kbd class="slot-space-hint" aria-hidden="true">SPACE</kbd>
          </button>
        </div>
      </div>
    </section>`;

  const cabinet = host.querySelector(".slot-cabinet");
  const reelGroup = host.querySelector(".slot-reels");
  const status = host.querySelector(".slot-status");
  const payoutsButton = host.querySelector(".slot-payouts");
  const spinButton = host.querySelector(".slot-spin");
  const spinLabel = host.querySelector(".slot-spin-label");
  const betValue = host.querySelector(".slot-bet-value");
  const lastPayout = host.querySelector(".slot-payout-led");
  const stepButtons = [...host.querySelectorAll("[data-step]")];

  const reelElements = session.reels.map((id, index) => {
    const reel = document.createElement("button");
    reel.type = "button";
    reel.className = "slot-reel";
    const viewport = document.createElement("span");
    viewport.className = "slot-reel-window";
    const strip = document.createElement("span");
    strip.className = "slot-reel-strip";
    viewport.append(strip);
    reel.append(viewport);
    const badge = document.createElement("span");
    badge.className = "slot-hold";
    reel.append(badge);
    reelGroup.append(reel);
    reel.addEventListener("click", () => {
      if (spinning || session.misses < 2) return;
      session.hold = session.hold === index ? null : index;
      api.set(sessionKey, session);
      api.sound("click");
      update();
    });
    return { reel, strip, badge, index, current: id };
  });

  function placeSymbol(strip, id) {
    const cell = document.createElement("span");
    cell.className = "slot-symbol-cell";
    cell.append(imageFor(id));
    strip.append(cell);
  }

  function setResting(reel, id) {
    reel.strip.style.transition = "none";
    reel.strip.style.transform = "";
    reel.strip.replaceChildren();
    placeSymbol(reel.strip, id);
    reel.current = id;
  }

  for (const reel of reelElements) setResting(reel, reel.current);

  function update() {
    if (destroyed) return;
    const betIndex = bets.indexOf(session.bet);
    betValue.textContent = api.format(session.bet);
    betValue.setAttribute("aria-label", session.bet + " tokens");
    stepButtons[0].disabled = spinning || betIndex <= 0;
    stepButtons[1].disabled = spinning || betIndex >= bets.length - 1;
    spinButton.disabled = spinning;
    spinLabel.textContent = spinning ? "Rolling" : "Spin";
    cabinet.dataset.tone = spinning ? "rolling" : session.tone;
    status.textContent = spinning
      ? "Compiling luck…"
      : session.misses >= 2
        ? session.hold === null
          ? "Click a reel to hold it for one spin"
          : "Reel " + (session.hold + 1) + " held for this spin"
        : session.status;
    lastPayout.textContent = "LAST PAY " + api.format(sessionVisiblePayout);
    for (const { reel, badge, index, current } of reelElements) {
      const canHold = !spinning && session.misses >= 2;
      const held = canHold && session.hold === index;
      reel.disabled = !canHold;
      reel.classList.toggle("slot-can-hold", canHold);
      reel.classList.toggle("slot-is-held", held);
      reel.setAttribute(
        "aria-label",
        "Reel " +
          (index + 1) +
          ", " +
          symbolsById.get(current).name +
          (canHold
            ? ", " + (held ? "release hold" : "hold for next spin")
            : ""),
      );
      if (canHold) reel.setAttribute("aria-pressed", String(held));
      else reel.removeAttribute("aria-pressed");
      badge.textContent = canHold ? (held ? "◆ HELD" : "HOLD") : "";
    }
  }

  function setBet(step) {
    if (spinning) return;
    const bet = bets[bets.indexOf(session.bet) + step];
    if (!bet) return;
    session.bet = bet;
    api.set(sessionKey, session);
    api.sound("tick");
    update();
  }

  function lineFor(result, bet) {
    if (result.match === "miss") {
      return "No match. Rebase and retry.";
    }
    if (result.match === "triple") {
      return result.symbol === "seven"
        ? "777! Production miracle."
        : "Triple " + symbolsById.get(result.symbol).name + "!";
    }
    return result.payout > bet ? "Clean cherry-pick!" : "Pair! Bet returned.";
  }

  function defer(fn, duration) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (!destroyed) fn();
    }, duration);
    timers.add(timer);
  }

  function animateReel(reel, target, held, reduced) {
    if (held || reduced) {
      if (reduced) setResting(reel, target);
      return;
    }
    const steps = 6 + reel.index * 3;
    const duration = 550 + reel.index * 140;
    reel.strip.style.transition = "none";
    reel.strip.style.transform = "translateY(0)";
    reel.strip.replaceChildren();
    placeSymbol(reel.strip, reel.current);
    for (let i = 1; i < steps; i++) placeSymbol(reel.strip, rollSymbol());
    placeSymbol(reel.strip, target);
    // Each cell is one viewport tall. Percent translation tracks a mid-spin resize.
    reel.strip.getBoundingClientRect();
    reel.strip.style.transition =
      "transform " + duration + "ms cubic-bezier(.23,.15,.12,1)";
    reel.strip.style.transform = "translateY(-" + steps * 100 + "%)";
    defer(() => {
      setResting(reel, target);
      api.sound("tick");
    }, duration);
  }

  function spin() {
    if (spinning || destroyed) return;
    if (api.state.tokens < session.bet) {
      pendingFunding = true;
      api.fund("The reels need " + session.bet + " tokens to spin.", () => {
        if (!pendingFunding || destroyed) return;
        pendingFunding = false;
        spin();
      });
      return;
    }
    pendingFunding = false;
    const bet = session.bet;
    const hold = session.misses >= 2 ? session.hold : null;
    const reels = session.reels.map((id, index) =>
      index === hold ? id : rollSymbol(),
    );
    const result = priceSpin(reels, bet);
    const netWin = result.payout > bet;
    const jackpot = result.match === "triple" && result.symbol === "seven";
    spinning = true;
    if (!api.spend(bet, "Commit Slots wager")) {
      spinning = false;
      update();
      return;
    }
    // Resolve currency and persist the result before animating. Closing the tab
    // halfway through the reel animation never forfeits or duplicates a payout.
    if (result.payout)
      api.earn(
        result.payout,
        result.match === "pair" ? "Commit Slots pair" : "Commit Slots triple",
      );
    session.reels = reels;
    session.hold = null;
    session.lastPayout = result.payout;
    session.misses = result.match === "miss" ? session.misses + 1 : 0;
    session.tone = jackpot
      ? "jackpot"
      : netWin
        ? "win"
        : result.payout
          ? "push"
          : "miss";
    session.status =
      lineFor(result, bet) + (netWin ? " +" + api.format(result.payout) : "");
    api.set(sessionKey, session);
    api.stat("spins");
    if (netWin) api.stat("wins");
    if (jackpot) api.stat("jackpots");
    api.sound("spin");
    update();
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    for (const reel of reelElements)
      animateReel(reel, reels[reel.index], reel.index === hold, reduced);
    defer(
      () => {
        for (const reel of reelElements) setResting(reel, reels[reel.index]);
        spinning = false;
        sessionVisiblePayout = session.lastPayout;
        update();
        api.refresh?.();
        if (netWin) {
          const big = result.match === "triple";
          api.sound(big ? "bigwin" : "win");
          api.fx(big ? "jackpot" : "win");
          if (big) {
            const burst = document.createElement("div");
            burst.className = "slot-celebration";
            burst.setAttribute("aria-hidden", "true");
            const title = document.createElement("span");
            title.textContent = jackpot ? "JACKPOT!" : "TRIPLE!";
            const amount = document.createElement("b");
            amount.textContent = "+" + api.format(result.payout) + " TOK";
            burst.append(title, amount);
            cabinet.append(burst);
            defer(() => burst.remove(), 1700);
          }
          api.log(session.status, "win");
        } else {
          api.sound(result.payout ? "tick" : "lose");
        }
      },
      reduced ? 120 : 850,
    );
  }

  function payouts() {
    const content = document.createElement("div");
    content.className = "slot-paytable";
    const intro = document.createElement("p");
    intro.textContent =
      "One horizontal payline. Match any two to get your bet back. Two cherries pay double.";
    const grid = document.createElement("div");
    grid.className = "slot-price-grid";
    for (const symbol of [...slotSymbols].sort((a, b) => b.triple - a.triple)) {
      const row = document.createElement("div");
      const group = document.createElement("span");
      const name = document.createElement("strong");
      const amount = document.createElement("b");
      for (let i = 0; i < 3; i++) group.append(imageFor(symbol.id));
      name.textContent = symbol.name;
      amount.textContent = "×" + symbol.triple;
      row.append(group, name, amount);
      grid.append(row);
    }
    const rule = document.createElement("p");
    rule.textContent =
      "After two consecutive misses, choose one reel to hold for the next spin. Payouts include your stake.";
    content.append(intro, grid, rule);
    api.sound("click");
    api.modal("Paytable", content, { eyebrow: "COMMIT SLOTS" });
  }

  stepButtons.forEach((button) =>
    button.addEventListener("click", () => setBet(Number(button.dataset.step))),
  );
  payoutsButton.addEventListener("click", payouts);
  spinButton.addEventListener("click", spin);
  // The app owns page-level shortcuts; native button keyboard behavior also works.
  update();
  return {
    open() {
      host.scrollIntoView({ block: "nearest", behavior: "smooth" });
      spinButton.focus({ preventScroll: true });
    },
    spin,
    update,
    payouts,
    get rolling() {
      return spinning;
    },
    destroy() {
      destroyed = true;
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
    },
  };
}
