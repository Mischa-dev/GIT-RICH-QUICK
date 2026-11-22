import { SAVE_KEY } from "./economy.js";

const LOCK = "git-rich-quick/active-wallet";

function storageFor(win, name) {
  try {
    return win[name];
  } catch {
    return undefined;
  }
}

function isolatedWallet(win) {
  const storage = storageFor(win, "sessionStorage");
  try {
    if (storage && storage.getItem(SAVE_KEY) === null) {
      const previous = storageFor(win, "localStorage")?.getItem(SAVE_KEY);
      if (previous != null) storage.setItem(SAVE_KEY, previous);
    }
  } catch {
    /* An in-memory game still works with storage denied. */
  }
  return storage;
}

function showWaitScreen(win) {
  const panel = win.document.createElement("dialog");
  panel.setAttribute("aria-labelledby", "waiting-title");
  panel.style.cssText =
    "padding:28px;max-width:min(390px,90vw);border:1px solid #635343;border-radius:12px;background:#19191f;color:#f5f0e6;box-shadow:0 24px 100px #000b;";
  panel.innerHTML = `<img src="./assets/token.png" alt="" width="44" height="44" style="image-rendering:pixelated">
    <h2 id="waiting-title" style="font:900 32px/1 var(--condensed,system-ui);margin:12px 0">Arcade open in another tab</h2>
    <p style="font:15px/1.45 var(--display,system-ui);margin:0">Your agent is on shift there. Close that tab and this one will pick up its latest save automatically.</p>`;
  panel.addEventListener("cancel", (e) => e.preventDefault());
  win.document.body.append(panel);
  if (typeof panel.showModal === "function") panel.showModal();
  else panel.setAttribute("open", "");
  return () => panel.remove();
}

/** Wait before creating the shared wallet or starting a persisted job. */
export function openArcadeSession(win = window, showWait = showWaitScreen) {
  let locks;
  try {
    locks = win.navigator.locks;
  } catch {
    /* Restricted browsing contexts get a tab wallet. */
  }
  if (!locks?.request) return Promise.resolve(isolatedWallet(win));

  return new Promise((resolve) => {
    const waiting = new AbortController();
    let endOwnership;
    const lifetime = new Promise((done) => {
      endOwnership = done;
    });
    let removeWait;
    const timer = win.setTimeout(() => {
      removeWait = showWait(win);
    }, 120);
    function clearWait() {
      win.clearTimeout(timer);
      removeWait?.();
    }
    function leave(event) {
      waiting.abort();
      clearWait();
      // bfcache restores JS heap and timers. A new wallet must be loaded under a new claim.
      if (event.persisted) {
        win.document.documentElement.inert = true;
        win.addEventListener("pageshow", () => win.location.reload(), {
          once: true,
        });
      }
      endOwnership();
    }
    win.addEventListener("pagehide", leave, { once: true });
    const fallback = () => {
      clearWait();
      if (waiting.signal.aborted) return;
      win.removeEventListener("pagehide", leave);
      resolve(isolatedWallet(win));
    };
    try {
      // Queue once, without stealing a live session. Browser teardown also releases after a crash.
      locks
        .request(LOCK, { mode: "exclusive", signal: waiting.signal }, () => {
          clearWait();
          if (waiting.signal.aborted) return;
          resolve(storageFor(win, "localStorage"));
          return lifetime;
        })
        .catch(fallback);
    } catch {
      fallback();
    }
  });
}
