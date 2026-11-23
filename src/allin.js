// ALL IN. The ad paid out, the agent still needs more, and there is exactly one
// responsible thing to do: put the whole balance on a colour.
import { juiceOf } from "./juice.js";

// European single-zero wheel, in physical order.
export const wheelOrder = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const reds = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);
export const colorOf = (n) => (n === 0 ? "green" : reds.has(n) ? "red" : "black");
const word = new Uint32Array(1);
/** Unbiased pocket index 0..36. */
export function spinPocket() {
  const limit = Math.floor(2 ** 32 / 37) * 37;
  do crypto.getRandomValues(word);
  while (word[0] >= limit);
  return word[0] % 37;
}
/** Settle a colour bet: returns the payout (stake × 2 on a hit, else 0). */
export const settle = (pick, number, stake) =>
  colorOf(number) === pick ? stake * 2 : 0;

const seg = 360 / 37;
const fmt = (n) => Number(n).toLocaleString("en-US");

export function initAllIn(api) {
  const juice = juiceOf(api);
  const gradient = `conic-gradient(from ${-seg / 2}deg, ${wheelOrder
    .map((n, i) => {
      const c = n === 0 ? "#12c46b" : reds.has(n) ? "#e0123c" : "#111018";
      return `${c} ${(i * seg).toFixed(3)}deg ${((i + 1) * seg).toFixed(3)}deg`;
    })
    .join(", ")})`;

  function open({ need = 0, reason = "", onDone } = {}) {
    let spinning = false;
    let rotation = 0;
    const root = document.createElement("div");
    root.className = "allin";
    const labels = wheelOrder
      .map(
        (n, i) =>
          `<span style="--a:${(i * seg).toFixed(3)}deg">${n}</span>`,
      )
      .join("");
    root.innerHTML = `
      <div class="allin-stage">
        <div class="allin-wheel-wrap">
          <i class="allin-pointer" aria-hidden="true"></i>
          <div class="allin-wheel" style="background:${gradient}"><div class="allin-labels">${labels}</div><b class="allin-hub"></b></div>
        </div>
        <div class="allin-panel">
          <div class="allin-need">${reason ? reason.toUpperCase() : "DOUBLE OR NOTHING"}</div>
          <div class="allin-stake"><small>YOUR ENTIRE BALANCE</small><b class="allin-amount"></b></div>
          <div class="allin-result" aria-live="polite"></div>
          <div class="allin-actions"></div>
        </div>
      </div>`;
    const wheel = root.querySelector(".allin-wheel");
    const amount = root.querySelector(".allin-amount");
    const result = root.querySelector(".allin-result");
    const actions = root.querySelector(".allin-actions");

    function button(label, cls, fn) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "g-btn big " + cls;
      b.innerHTML = label;
      b.addEventListener("click", fn);
      return b;
    }
    function finish() {
      api.closeModal();
      onDone?.();
    }
    function choices() {
      const stake = api.state.tokens;
      amount.textContent = fmt(stake);
      actions.replaceChildren();
      if (!stake) {
        result.innerHTML = "<b>0 TOKENS.</b> Not even enough to lose.";
        actions.append(
          button("▶ WATCH ANOTHER AD", "hot", () => api.fund(reason, () => open({ need, reason, onDone }))),
          button("LEAVE", "ghost", finish),
        );
        return;
      }
      actions.append(
        button("ALL ON RED", "red allin-red", () => go("red")),
        button("ALL ON BLACK", "ghost allin-black", () => go("black")),
      );
      const keep = button(
        stake >= need ? "KEEP IT · RESUME AGENT" : "KEEP IT",
        "ghost allin-keep",
        finish,
      );
      actions.append(keep);
    }

    function go(pick) {
      if (spinning) return;
      const stake = api.state.tokens;
      if (!stake || !api.spend(stake, `ALL IN on ${pick}`)) return;
      spinning = true;
      const index = spinPocket();
      const number = wheelOrder[index];
      const win = settle(pick, number, stake);
      // Settle before the animation, like every other machine on the floor.
      if (win) api.earn(win, `ALL IN on ${pick} hit ${number}`);
      api.stat?.("allins");
      actions.replaceChildren();
      result.innerHTML = `<span class="allin-pick allin-${pick}">${fmt(stake)} ON ${pick.toUpperCase()}</span>`;
      const reduced = juice.reduced;
      const spins = reduced ? 0 : 6 + Math.floor(Math.random() * 3);
      rotation = rotation - (rotation % 360) + spins * 360 + (360 - index * seg);
      const duration = reduced ? 50 : 4600;
      wheel.style.transition = `transform ${duration}ms cubic-bezier(.08,.62,.12,1)`;
      wheel.style.transform = `rotate(${rotation}deg)`;
      api.sound("riser", { length: 1 });
      juice.hype(3);
      // Ticks slow down with the wheel; the heart takes over at the end.
      let t = 0,
        gap = 45;
      const tick = () => {
        if (t > duration - 250) return;
        api.sound("tick", { pitch: 0.9 + Math.random() * 0.3 });
        gap *= 1.075;
        t += gap;
        setTimeout(tick, gap);
      };
      if (!reduced) tick();
      setTimeout(() => api.sound("heartbeat"), duration * 0.72);
      setTimeout(() => api.sound("heartbeat", { pitch: 1.2 }), duration * 0.86);
      setTimeout(() => reveal(pick, number, stake, win), duration + 60);
    }

    function reveal(pick, number, stake, win) {
      spinning = false;
      const color = colorOf(number);
      result.innerHTML = `<span class="allin-number allin-${color}">${number}</span><span class="allin-verdict">${
        win ? `DOUBLED → ${fmt(win)}` : color === "green" ? "ZERO. THE HOUSE THANKS YOU." : "BUSTED."
      }</span>`;
      amount.textContent = fmt(api.state.tokens);
      if (win) {
        juice.payout({ from: wheel, amount: win, bet: stake, big: "big", title: "DOUBLED", tone: "pink", label: `ALL ON ${pick.toUpperCase()}` });
        juice.emit("allin", { win: true, stake });
      } else {
        juice.loss(wheel, stake, "all in");
        juice.flash("#ff2e55", 0.45);
        juice.glitch(500);
        juice.shake(0.6);
        api.sound("error");
        juice.emit("allin", { win: false, stake });
      }
      actions.replaceChildren();
      if (api.state.tokens >= need && need > 0) {
        const b = button("▶ RESUME AGENT", "lime", finish);
        actions.append(b);
        // The agent was waiting. Don't make it wait.
        setTimeout(() => {
          if (b.isConnected) finish();
        }, 2600);
      } else {
        actions.append(
          button("▶ WATCH ANOTHER AD", "hot", () => api.fund(reason, () => open({ need, reason, onDone }))),
        );
        if (api.state.tokens) actions.append(button("AGAIN", "red", () => choices()));
        actions.append(button("LEAVE", "ghost", finish));
      }
    }

    api.modal("All in?", root, { eyebrow: "DOUBLE OR NOTHING · 18 RED · 18 BLACK · 1 ZERO", wide: true });
    choices();
    api.sound("tierup");
  }
  return { open };
}
