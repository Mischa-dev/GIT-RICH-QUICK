const READER_HEADER = { "X-GRQ-Reader": "1", Accept: "application/json" };
const RATE = 1000;
const REFRESH_MS = 4000;
const LOCAL = new Set(["127.0.0.1", "localhost"]);

export function promptLink(brief) {
  const url = new URL("https://app.t3.codes/new");
  url.searchParams.set("prompt", brief.trim());
  return url.href;
}

async function query(path) {
  const res = await fetch(`/api/t3/${path}`, {
    headers: READER_HEADER,
    cache: "no-store",
    signal: AbortSignal.timeout(6500),
  });
  if (!res.headers.get("content-type")?.includes("application/json"))
    throw new Error("Open the local casino served by node server/t3.mjs.");
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error || "The local bridge did not answer.");
  return data;
}

function number(value) {
  return value.toLocaleString();
}
function summary(data) {
  if (
    ![data.input, data.output, data.turns].every(
      (v) => Number.isSafeInteger(v) && v >= 0,
    ) ||
    !Number.isSafeInteger(data.input + data.output)
  ) {
    throw new Error("T3 returned an unreadable meter value.");
  }
  return data.input + data.output;
}

export function initT3(api) {
  let meter = null;
  let timer;
  let view;
  let generation = 0;
  let draft = "Implement a button that fires the button that approved it.";
  const headerButton = document.querySelector(".link-t3");

  function paintSignal() {
    if (!headerButton) return;
    const signal = meter ? (meter.error ? "retry" : "live") : "idle";
    if (headerButton.dataset.t3State === signal) return;
    headerButton.dataset.t3State = signal;
    const label =
      signal === "live"
        ? "T3 Live"
        : signal === "retry"
          ? "T3 Offline"
          : "Connect T3";
    const text = headerButton.querySelector("span");
    if (text) text.textContent = label;
    headerButton.setAttribute("aria-label", label);
  }

  function stop() {
    clearTimeout(timer);
    generation++;
    meter = null;
    paintSignal();
  }
  function paintMeter() {
    paintSignal();
    if (!view?.isConnected || !meter) return;
    const el = (key) => view.querySelector(`[data-t3=${key}]`);
    el("active").hidden = false;
    el("picker").hidden = true;
    el("label").textContent = meter.thread.title || "Untitled thread";
    el("count").textContent = number(meter.observed);
    el("burn").textContent = `${number(meter.paid)} TOK`;
    el("signal").textContent = meter.error ? "RECONNECTING" : "SIGNAL LIVE";
    el("signal").classList.toggle("t3-retrying", Boolean(meter.error));
    el("note").textContent =
      meter.error ||
      (meter.waived
        ? `${number(meter.waived)} TOK waived when your wallet ran dry. Real T3 kept working.`
        : "Meter starts at pairing. T3 reports usage when a turn settles.");
  }
  async function poll(version) {
    if (generation !== version || !meter) return;
    try {
      const data = await query(
        `usage?thread=${encodeURIComponent(meter.thread.id)}`,
      );
      if (generation !== version) return;
      const total = summary(data);
      // Keeping the previous high watermark also avoids rebilling restored/deleted history.
      if (total > meter.high) {
        const previousDue = Math.floor(meter.observed / RATE);
        meter.observed += total - meter.high;
        meter.high = total;
        const due = Math.floor(meter.observed / RATE) - previousDue;
        const payable = Math.min(due, api.state.tokens);
        let paid = 0;
        if (payable > 0 && api.spend(payable, "Live T3 meter")) paid = payable;
        meter.paid += paid;
        meter.waived += due - paid;
        if (due > 0)
          api.toast(
            `T3 meter · ${number(meter.observed)} real tokens metered · ${number(paid)} TOK collected`,
          );
      }
      meter.error = "";
    } catch (err) {
      if (generation !== version) return;
      meter.error = err.message || "Local bridge is offline.";
    }
    paintMeter();
    if (generation === version)
      timer = setTimeout(() => poll(version), REFRESH_MS);
  }
  function open(brief) {
    if (typeof brief === "string" && brief.trim()) draft = brief.slice(0, 8000);
    const pane = document.createElement("div");
    pane.className = "t3-link";
    pane.innerHTML = `
      <section class="t3-card t3-send">
        <div class="t3-kicker"><span class="t3-led"></span> OUTGOING TRANSMISSION</div>
        <h3>Smuggle a brief into T3.</h3>
        <label for="t3-brief">Draft prompt</label>
        <textarea id="t3-brief" rows="3" maxlength="8000" spellcheck="true"></textarea>
        <a data-t3="launch" class="t3-launch" target="_blank" rel="noopener noreferrer">Open draft in T3 Code <span aria-hidden="true">↗</span></a>
        <p>Opens the draft on app.t3.codes. You press Send in T3.</p>
      </section>
      <section class="t3-card t3-machine">
        <div class="t3-kicker"><span class="t3-led"></span> TOKEN ODOMETER</div>
        <h3>Meter a real thread.</h3>
        <p>Every 1,000 new model tokens on one T3 thread cost 1 fake casino token. Real T3 keeps running, even at zero.</p>
        <div data-t3="picker">
          <div class="t3-local-setup"><span>On the T3 machine, from the cloned game folder</span><code>node server/t3.mjs</code><a href="http://127.0.0.1:7777" rel="noopener noreferrer" target="_blank">Open local casino ↗</a></div>
          <button class="t3-scan" type="button" data-t3="scan">Find local threads</button>
          <form data-t3="form" hidden><label for="t3-thread">Recent active threads</label><select id="t3-thread" aria-label="Recent active threads"></select><button class="t3-scan" type="submit">Pair meter</button></form>
          <p data-t3="status" role="status"></p>
        </div>
        <div data-t3="active" hidden>
          <div class="t3-paired"><b data-t3="signal">SIGNAL LIVE</b><span data-t3="label"></span></div>
          <div class="t3-readouts"><div><small>Model tokens since pairing</small><strong data-t3="count">0</strong></div><div><small>Casino tab</small><strong data-t3="burn">0 TOK</strong></div></div>
          <p data-t3="note"></p><button class="t3-scan" data-t3="stop">Disconnect meter</button>
        </div>
      </section>`;
    const el = (key) => pane.querySelector(`[data-t3=${key}]`);
    const field = pane.querySelector("textarea");
    field.value = draft;
    function updateDraft() {
      draft = field.value;
      if (draft.trim()) el("launch").href = promptLink(draft);
      else el("launch").removeAttribute("href");
    }
    field.addEventListener("input", updateDraft);
    updateDraft();
    const isLocal = LOCAL.has(location.hostname);
    el("scan").hidden = !isLocal;
    if (!isLocal)
      el("status").textContent =
        "The live meter pairs inside the local casino.";
    let threads = [];
    el("scan").addEventListener("click", async () => {
      el("scan").disabled = true;
      el("form").hidden = true;
      el("status").textContent = "Tuning the receiver…";
      try {
        const data = await query("threads");
        threads = data.threads;
        if (!Array.isArray(threads))
          throw new Error("This server is missing the T3 bridge.");
        const select = pane.querySelector("select");
        select.replaceChildren(
          ...threads.map(
            (thread) =>
              new Option(thread.title || "Untitled thread", thread.id),
          ),
        );
        pane.querySelector(".t3-local-setup").hidden = true;
        el("form").hidden = !threads.length;
        el("scan").textContent = "Refresh thread list";
        el("status").textContent = threads.length
          ? "Pairing counts new usage while this tab is open."
          : "No active threads yet. Start one in T3, then refresh.";
      } catch (err) {
        el("status").textContent = err.message || "Could not reach the bridge.";
      } finally {
        el("scan").disabled = false;
      }
    });
    el("form").addEventListener("submit", async (evt) => {
      evt.preventDefault();
      const thread = threads.find(
        (item) => item.id === pane.querySelector("select").value,
      );
      if (!thread) return;
      const submit = el("form").querySelector("button");
      submit.disabled = true;
      el("scan").disabled = true;
      try {
        const data = await query(
          `usage?thread=${encodeURIComponent(thread.id)}`,
        );
        if (!pane.isConnected || pane !== view) return;
        const baseline = summary(data);
        stop();
        meter = {
          thread,
          high: baseline,
          observed: 0,
          paid: 0,
          waived: 0,
          error: "",
        };
        const version = generation;
        timer = setTimeout(() => poll(version), REFRESH_MS);
        api.log("T3 meter paired. The house has discovered inference.", "info");
        paintMeter();
      } catch (err) {
        el("status").textContent = err.message || "Pairing failed. Try again.";
      } finally {
        submit.disabled = false;
        el("scan").disabled = false;
      }
    });
    el("stop").addEventListener("click", () => {
      stop();
      el("active").hidden = true;
      el("picker").hidden = false;
      el("status").textContent = "Disconnected. The house lost the signal.";
    });
    const opts = {
      eyebrow: "DEVELOPER SERVICES",
      onClose: () => {
        if (view === pane) view = null;
      },
    };
    api.modal("T3 Link", pane, opts);
    view = pane;
    paintMeter();
  }
  return { open, update: paintMeter, destroy: stop };
}
