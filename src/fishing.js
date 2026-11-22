const species = [
  {
    name: "Legacy Boot",
    tier: "Junk",
    weight: 15,
    pay: 30,
    cm: [19, 34],
    line: "Still running in production. Both laces are deprecated.",
  },
  {
    name: "Cache Bass",
    tier: "Common",
    weight: 22,
    pay: 56,
    cm: [21, 53],
    line: "Returns instantly the second time you catch it.",
  },
  {
    name: "Rubber Ducktype",
    tier: "Common",
    weight: 17,
    pay: 60,
    cm: [7, 18],
    line: "You explained the bug to it. Halfway through, it solved the bug.",
  },
  {
    name: "Null Pointer Pike",
    tier: "Uncommon",
    weight: 14,
    pay: 75,
    cm: [38, 89],
    line: "The fish was right there. The reference to the fish was another matter.",
  },
  {
    name: "Race Condition Trout",
    tier: "Uncommon",
    weight: 11,
    pay: 90,
    cm: [24, 68],
    line: "Two anglers swear they caught it first. Both have logs.",
  },
  {
    name: "Stack Overflowfish",
    tier: "Rare",
    weight: 8,
    pay: 110,
    cm: [14, 33],
    line: "Inflates when asked a question marked as a duplicate.",
  },
  {
    name: "Merge Conflict Koi",
    tier: "Rare",
    weight: 6,
    pay: 145,
    cm: [32, 71],
    line: "Keep both colors. They each passed review.",
  },
  {
    name: "README Ray",
    tier: "Rare",
    weight: 4,
    pay: 165,
    cm: [41, 93],
    line: "The instructions for catching it are on its underside.",
  },
  {
    name: "Phantom Dependency",
    tier: "Epic",
    weight: 2,
    pay: 240,
    cm: [8, 44],
    line: "Nobody installed this fish. Removing it breaks the moon.",
  },
  {
    name: "Load-Bearing Salmon",
    tier: "Legendary",
    weight: 1,
    pay: 512,
    cm: [66, 142],
    line: "A maintainer three towns over just received a pager alert.",
  },
];
const saveKey = "fishing.pond.v1";
const newBook = () => ({
  species: {},
  caught: 0,
  casts: 0,
  perfect: 0,
  earned: 0,
});
const clamp = (number, min, max) => Math.min(max, Math.max(min, number));
const randomInt = (min, max) =>
  min + Math.floor(Math.random() * (max - min + 1));

function restoreBook(raw) {
  const book = newBook();
  if (!raw || typeof raw !== "object") return book;
  const natural = (value) => Number.isSafeInteger(value) && value >= 0;
  for (const key of ["casts", "perfect", "earned"]) {
    if (natural(raw[key])) book[key] = raw[key];
  }
  for (const [id, fish] of species.entries()) {
    const record = raw.species?.[id];
    if (
      !record ||
      !natural(record.caught) ||
      !record.caught ||
      !natural(record.best)
    )
      continue;
    book.species[id] = {
      caught: record.caught,
      best: clamp(record.best, ...fish.cm),
    };
    book.caught += record.caught;
  }
  return book;
}

function chooseSpecies() {
  let roll =
    Math.random() * species.reduce((sum, fish) => sum + fish.weight, 0);
  return species.findIndex((fish) => (roll -= fish.weight) < 0);
}

function sprite(id, hidden = false) {
  return (
    '<i aria-hidden="true" class="pond-sprite' +
    (hidden ? " pond-silhouette" : "") +
    '" style="--sprite-x:' +
    (id * 100) / (species.length - 1) +
    '%"></i>'
  );
}

export function initFishing(api) {
  const host = document.querySelector("#fishing-card");
  const book = restoreBook(api.get(saveKey, null));
  const save = () => api.set(saveKey, book);
  let panel = null;
  let phase = "idle";
  let view = "water";
  let timer = null;
  let animation = null;
  let session = 0;
  let fishId = 0;
  let passCount = 0;
  let missedPulls = 0;
  let target = 0;
  let halfWidth = 0;
  let cycle = 0;
  let start = 0;
  let lastPull = 0;
  let result = null;
  let message = "";
  let returnFocus = null;
  const count = () => Object.keys(book.species).length;
  const active = () => ["wait", "bite", "reel"].includes(phase);
  const action = (label) =>
    '<button class="pond-action" type="button" data-pond="action">' +
    label +
    "</button>";
  const hint = (text) => '<span class="pond-hint">' + text + "</span>";

  const cardClick = (event) => {
    if (event.target.closest(".pond-card")) open();
  };
  host?.addEventListener("click", cardClick);
  function update() {
    if (!host) return;
    if (!host.querySelector(".pond-card")) {
      host.innerHTML =
        '<button type="button" class="pond-card" aria-label="Fish for tokens at The Token Pond">' +
        '<span class="pond-card-art" aria-hidden="true"></span>' +
        '<span class="pond-card-tag"><i aria-hidden="true"></i> SIDE QUEST</span>' +
        '<span class="pond-card-caption"><span><strong>The Token Pond</strong><small>Cast a line for tokens</small></span>' +
        '<span class="pond-card-arrow" aria-hidden="true"><i></i></span></span></button>';
    }
    const detail = host.querySelector(".pond-card-caption small");
    detail.textContent = book.caught
      ? count() + "/" + species.length + " species in your catch log"
      : "Cast a line for tokens";
  }

  function clearTimers() {
    clearTimeout(timer);
    cancelAnimationFrame(animation);
    timer = null;
    animation = null;
  }

  function close() {
    clearTimers();
    session++;
    panel = null;
    phase = "idle";
    view = "water";
    returnFocus = null;
  }

  function open() {
    if (panel?.isConnected) return;
    close();
    panel = document.createElement("section");
    panel.className = "pond-window";
    panel.addEventListener("click", onClick);
    panel.addEventListener("keydown", onKeyDown);
    message = "";
    result = null;
    paint();
    api.modal("The Token Pond", panel, {
      eyebrow: "SIDE QUEST / FISHING",
      onClose: close,
    });
  }

  function onKeyDown(event) {
    if (event.code !== "Space" || event.repeat || view !== "water") return;
    if (
      event.target.closest("button") &&
      !event.target.closest('[data-pond="action"]')
    )
      return;
    event.preventDefault();
    advance();
  }

  function onClick(event) {
    const command = event.target.closest("[data-pond]")?.dataset.pond;
    if (command === "action") advance();
    if (command === "scene" && active()) advance();
    if (
      (command === "water" || command === "book") &&
      command !== view &&
      !active()
    ) {
      view = command;
      api.sound("click");
      returnFocus = command;
      paint();
    }
  }

  function writeBook() {
    return (
      '<div class="pond-book-head"><span><b>' +
      count() +
      "</b> / " +
      species.length +
      " species</span><span>" +
      api.format(book.earned) +
      " tokens landed</span></div>" +
      '<ul class="pond-species">' +
      species
        .map((fish, id) => {
          const record = book.species[id];
          return (
            '<li class="' +
            (record ? "" : "pond-unseen") +
            '">' +
            sprite(id, !record) +
            "<span><b>" +
            (record ? fish.name : "Undiscovered") +
            "</b><small>" +
            (record
              ? "Caught " + record.caught + " · Best " + record.best + " cm"
              : fish.tier + " specimen") +
            "</small></span>" +
            (record
              ? '<span class="pond-rarity">' + fish.tier + "</span>"
              : "") +
            "</li>"
          );
        })
        .join("") +
      "</ul>"
    );
  }

  function writeControls() {
    if (phase === "wait")
      return (
        '<div class="pond-state"><b>Watch the float…</b>' +
        hint("Hook when it dips underwater.") +
        "</div>" +
        action("Hook fish")
      );
    if (phase === "bite")
      return (
        '<div class="pond-state"><b>Fish on!</b>' +
        hint("Hook it before it spits the bait.") +
        "</div>" +
        action("Hook now!")
      );
    if (phase === "reel") {
      return (
        '<div class="pond-state"><b>' +
        (passCount ? "One more pull" : "Reel it in") +
        "</b>" +
        hint(message || "Pull when the needle is inside the green zone.") +
        "</div>" +
        action("Pull line")
      );
    }
    if (phase === "caught") {
      return (
        '<div class="pond-state"><b>+' +
        api.format(result.pay) +
        " tokens</b>" +
        hint(
          result.fresh
            ? "New species in your catch log."
            : result.pb
              ? "A new personal length record."
              : "Added to your catch log.",
        ) +
        "</div>" +
        action("Cast again")
      );
    }
    if (phase === "miss")
      return (
        '<div class="pond-state"><b>It got away.</b>' +
        hint(message) +
        "</div>" +
        action("Cast again")
      );
    return (
      '<div class="pond-state"><b>Fish for free</b>' +
      hint("Cast, hook the bite, then time two pulls.") +
      "</div>" +
      action("Cast a line")
    );
  }

  function paint() {
    if (!panel) return;
    const currentFocus =
      returnFocus ||
      (panel.contains(document.activeElement)
        ? document.activeElement.dataset.pond
        : "");
    returnFocus = null;
    const tabs =
      '<div class="pond-tabs" aria-label="Fishing views"><button type="button" data-pond="water" aria-pressed="' +
      (view === "water") +
      '">The pond</button>' +
      '<button type="button" data-pond="book" aria-pressed="' +
      (view === "book") +
      '" ' +
      (active() ? 'disabled title="Finish this cast to open your log"' : "") +
      ">Catch log <span>" +
      count() +
      "/" +
      species.length +
      "</span></button></div>";
    if (view === "book") panel.innerHTML = tabs + writeBook();
    else {
      let sceneExtra = "";
      if (phase === "caught")
        sceneExtra =
          '<div class="pond-reveal"><div class="pond-reveal-sprite">' +
          sprite(fishId) +
          "</div><div><small>" +
          species[fishId].tier +
          " · " +
          result.length +
          " CM</small><strong>" +
          species[fishId].name +
          "</strong></div></div>";
      if (phase === "bite")
        sceneExtra = '<div class="pond-bite-badge">BITE!</div>';
      const rail =
        phase === "reel"
          ? '<div class="pond-reel-readout"><div class="pond-rail" aria-label="Pull timing meter"><i class="pond-safe"></i><i class="pond-needle"></i></div><span>' +
            passCount +
            "/2 pulls</span></div>"
          : "";
      panel.innerHTML =
        tabs +
        '<div class="pond-scene phase-' +
        phase +
        '" data-pond="scene"><div class="pond-lake"></div><i class="pond-float" aria-hidden="true"></i>' +
        sceneExtra +
        "</div>" +
        (phase === "caught"
          ? '<p class="pond-description">' + species[fishId].line + "</p>"
          : "") +
        rail +
        '<div class="pond-controls">' +
        writeControls() +
        "</div>";
    }
    if (currentFocus)
      panel
        .querySelector('[data-pond="' + currentFocus + '"]:not(:disabled)')
        ?.focus({ preventScroll: true });
  }

  function miss(explanation) {
    clearTimers();
    phase = "miss";
    message = explanation;
    api.sound("lose");
    paint();
  }

  function cast() {
    clearTimers();
    phase = "wait";
    fishId = chooseSpecies();
    passCount = 0;
    missedPulls = 0;
    lastPull = 0;
    message = "";
    book.casts++;
    save();
    api.sound("cast");
    paint();
    const id = session;
    timer = setTimeout(
      () => {
        if (id !== session || phase !== "wait") return;
        phase = "bite";
        api.sound("tick");
        paint();
        timer = setTimeout(
          () => miss("Late hook. Watch for the BITE signal."),
          3000,
        );
      },
      randomInt(1150, 3150),
    );
  }

  function position(at) {
    const step = ((at - start) / cycle) % 2;
    return step > 1 ? 2 - step : step;
  }

  function startRail() {
    start = performance.now();
    cycle = randomInt(1020, 1380);
    halfWidth = missedPulls ? 0.15 : 0.12;
    target = randomInt(34, 73) / 100;
    paint();
    const safe = panel.querySelector(".pond-safe");
    const needle = panel.querySelector(".pond-needle");
    safe.style.left = (target - halfWidth) * 100 + "%";
    safe.style.width = 2 * halfWidth * 100 + "%";
    cancelAnimationFrame(animation);
    const animate = (at) => {
      if (phase !== "reel" || !needle.isConnected) return;
      needle.style.left = clamp(position(at), 0, 1) * 100 + "%";
      animation = requestAnimationFrame(animate);
    };
    animate(start);
  }

  function land() {
    clearTimers();
    const fish = species[fishId];
    const length = randomInt(...fish.cm);
    const pay =
      fish.pay +
      Math.round(
        ((length - fish.cm[0]) / Math.max(1, fish.cm[1] - fish.cm[0])) *
          fish.pay *
          0.35,
      ) +
      (missedPulls ? 0 : 12);
    const previous = book.species[fishId];
    result = {
      length,
      pay,
      fresh: !previous,
      pb: previous && length > previous.best,
    };
    book.species[fishId] = {
      caught: (previous?.caught || 0) + 1,
      best: Math.max(previous?.best || 0, length),
    };
    book.caught++;
    book.earned += pay;
    if (!missedPulls) book.perfect++;
    phase = "caught";
    save();
    api.earn(pay, "Landed a " + fish.name);
    api.stat("fish");
    api.sound(fishId >= 8 ? "bigwin" : "win");
    if (fishId >= 8) api.fx("win");
    update();
    paint();
  }

  function advance() {
    if (!panel || view !== "water") return;
    if (phase === "idle" || phase === "caught" || phase === "miss")
      return cast();
    if (phase === "wait") return miss("Early hook. Let the float dip first.");
    if (phase === "bite") {
      clearTimers();
      phase = "reel";
      api.sound("cast");
      startRail();
      return;
    }
    if (phase !== "reel") return;
    const now = performance.now();
    if (now - lastPull < 200) return;
    lastPull = now;
    const offset = Math.abs(position(now) - target);
    if (offset <= halfWidth) {
      if (++passCount === 2) return land();
      message = "Clean pull. Hit the green zone again.";
      api.sound("tick");
    } else {
      if (++missedPulls === 2)
        return miss("The line went slack. Pull inside the green zone.");
      message = "Slack line! One more miss and it swims.";
      api.sound("error");
    }
    startRail();
  }

  update();
  return {
    open,
    update,
    destroy() {
      close();
      host?.removeEventListener("click", cardClick);
    },
  };
}
