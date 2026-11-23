import { juiceOf } from "./juice.js";

/* Commercials are written as three cuts so the punchline lands on the last card. */
const SPOTS = [
  {
    brand: "Blame & Blame",
    signal: "LEGAL",
    look: "lawsuit",
    stamp: "scale",
    mark: "B&B",
    ticker: "AVAILABLE 24 HOURS A DAY EXCEPT DURING REBASE",
    cuts: [
      [
        "INJURED BY GIT BLAME?",
        "You changed the indentation. Now the whole outage has your name on it.",
      ],
      [
        "YOU MAY BE ENTITLED TO A NEW HASH.",
        "Our attorneys have quietly represented every author listed as “Former Intern.”",
      ],
      [
        "CALL 1-800-WAS-LIKE-THAT",
        "Blame & Blame. We only get paid if someone else gets fired.",
      ],
    ],
  },
  {
    brand: "Localhost Realty",
    signal: "PROPERTY",
    look: "estate",
    stamp: "house",
    mark: "LH",
    ticker: "VIRTUAL OPEN HOUSE • PORT 3000 • BY APPOINTMENT ONLY",
    cuts: [
      [
        "CHARMING SINGLE-TENANT PORT.",
        "Steps from production. Beautiful original defaults. South-facing console.",
      ],
      [
        "YES, THE PREVIOUS TENANT IS STILL THERE.",
        "It is a Node process. It has established residency.",
      ],
      [
        "MAKE AN OFFER ON :3001.",
        "Localhost Realty. The same neighborhood, one door down.",
      ],
    ],
  },
  {
    brand: "Standup Express",
    signal: "TRANSIT",
    look: "post",
    stamp: "bus",
    mark: "SE",
    ticker: "THE NEXT YESTERDAY / TODAY / BLOCKERS SERVICE IS DELAYED",
    cuts: [
      [
        "THIS MEETING COULD HAVE BEEN A BUS.",
        "Standup Express brings your daily meeting to a complete stop outside your house.",
      ],
      [
        "EVERYONE GOES AROUND.",
        "Yesterday I drove the bus. Today I am driving the bus. My blocker is a van.",
      ],
      [
        "LET’S PARK THAT.",
        "Standup Express. A fifteen-minute service with forty-five minutes of stops.",
      ],
    ],
  },
  {
    brand: "SemVer Family Clinic",
    signal: "CARE",
    look: "clinic",
    stamp: "pill",
    mark: "SV+",
    ticker: "MOST INSURANCE ACCEPTED THROUGH VERSION 2.4.6",
    cuts: [
      [
        "GOING THROUGH A BREAKING CHANGE?",
        "Our team can help you explain to loved ones why you have a seventh major version.",
      ],
      [
        "YOU LOOK THE SAME TO ME.",
        "We hear this a lot. The difference is that every door in your house opens inward now.",
      ],
      ["ASK ABOUT OUR PATCH.", "Side effects may include a minor release."],
    ],
  },
  {
    brand: "YAML Alignment Center",
    signal: "AUTOMOTIVE",
    look: "garage",
    stamp: "wrench",
    mark: "YAC",
    ticker: "WALK-INS WELCOME • TABS WAIT OUTSIDE",
    cuts: [
      [
        "PULLING TWO SPACES TO THE LEFT?",
        "Our mechanics can hear a misaligned production manifest from across the parking lot.",
      ],
      [
        "JUST LOOK AT THAT INDENT.",
        "Previous owner said it was garage-kept. That is a tab.",
      ],
      [
        "WE’LL GET YOU BACK IN LINE.",
        "Free rotation with the purchase of four matching environments.",
      ],
    ],
  },
  {
    brand: "Dark Mode Sunglasses",
    signal: "OPTICAL",
    look: "night",
    stamp: "glasses",
    mark: "D/M",
    ticker: "PRESCRIPTION LENSES AVAILABLE IN DRACULA AND MONOKAI",
    cuts: [
      [
        "DARK MODE. OUTSIDE.",
        "We took the most requested feature in software and applied it to the sun.",
      ],
      [
        "COMPATIBLE WITH TREES.",
        "Also tested on a small number of sidewalks and one very bright dog.",
      ],
      [
        "GO TOUCH GRASS IN COMFORT.",
        "Dark Mode Sunglasses. Daytime support is finally stable.",
      ],
    ],
  },
  {
    brand: "Big O Storage",
    signal: "STORAGE",
    look: "estate",
    stamp: "box",
    mark: "O(n)",
    ticker: "FIRST MONTH CONSTANT • EVERY MONTH AFTER THAT RECURSIVE",
    cuts: [
      [
        "NEED SPACE FOR ONE MORE ARRAY?",
        "Our introductory unit is spacious enough for n items.",
      ],
      [
        "BROUGHT YOUR NESTED LOOP?",
        "Lovely. We have reserved the rest of the building.",
      ],
      ["BIG O STORAGE.", "You handle time complexity. We charge by space."],
    ],
  },
  {
    brand: "Merge Conflict Mediation",
    signal: "COUNSEL",
    look: "clinic",
    stamp: "fork",
    mark: "MCM",
    ticker: "BOTH SIDES ACCEPTED • MOST BRANCHES COVERED",
    cuts: [
      [
        "YOU BOTH CHANGED LINE 43.",
        "Take a breath. There is room in this file for both of your feelings.",
      ],
      [
        "NOW, SAY IT WITHOUT THE MARKERS.",
        "“When you accept incoming, it makes me feel deprecated.” Good. That is progress.",
      ],
      [
        "RECONCILE FOR LESS.",
        "Couples rate for two parents and one deeply uncomfortable commit.",
      ],
    ],
  },
  {
    brand: "Stack Overflow Mattress",
    signal: "BEDDING",
    look: "post",
    stamp: "bed",
    mark: "ZZZ",
    ticker: "CLOSED AS DUPLICATE OF ANOTHER MATTRESS STORE",
    cuts: [
      [
        "SLEEP ON THE ACCEPTED ANSWER.",
        "Firm support from someone who solved your exact problem eleven years ago.",
      ],
      [
        "FEEL THAT LUMP?",
        "That is a single unexplained regex. Please do not move it.",
      ],
      [
        "WAKE UP WITH +15 REPUTATION.",
        "Stack Overflow Mattress. The question remains open.",
      ],
    ],
  },
  {
    brand: "Prompt Estate Winery",
    signal: "CELLAR",
    look: "press",
    stamp: "bottle",
    mark: "PE",
    ticker: "ESTATE-BOTTLED • HAND-PICKED EXAMPLES • PLEASE INFER RESPONSIBLY",
    cuts: [
      [
        "A FINE 2023 SYSTEM PROMPT.",
        "Aged in an oak markdown file. Notes of vanilla and “take a deep breath.”",
      ],
      [
        "LET IT BREATHE.",
        "That was thirty dollars of reasoning. You may now smell the cork.",
      ],
      [
        "PAIRS BEAUTIFULLY WITH JSON.",
        "Prompt Estate. Our sommelier suggests you try the same glass again.",
      ],
    ],
  },
  {
    brand: "Force Push Moving Co.",
    signal: "MOVERS",
    look: "garage",
    stamp: "bus",
    mark: "F↑",
    ticker: "FAMILY OWNED UNTIL SOMEONE REWROTE THE HISTORY",
    cuts: [
      [
        "MOVE YOUR ENTIRE HISTORY.",
        "Rent a bright orange truck and wake up with your furniture exactly where you say it always was.",
      ],
      [
        "YOUR ROOMMATE DISAGREES?",
        "Give them our brochure, “Why Your Local Copy Looks Different.”",
      ],
      ["PUSH WITH A LEASE.", "Force Push Moving Co. Check the driveway first."],
    ],
  },
  {
    brand: "Rubber Duck Witness Protection",
    signal: "SECURITY",
    look: "night",
    stamp: "duck",
    mark: "RD",
    ticker: "IDENTITIES CHANGED • BATHS RELOCATED",
    cuts: [
      [
        "YOUR DUCK KNOWS TOO MUCH.",
        "You explained the entire billing service to it. Including the Wednesday thing.",
      ],
      [
        "MEET GERALD.",
        "Gerald runs a bookstore in Vermont. Gerald has never seen a Kubernetes cluster.",
      ],
      [
        "QUACK IN CONFIDENCE.",
        "Rubber Duck Witness Protection. A new tub. A fresh start.",
      ],
    ],
  },
  {
    brand: "Technical Debt Collections",
    signal: "FINANCE",
    look: "lawsuit",
    stamp: "phone",
    mark: "TDC",
    ticker: "TODAY’S APR • ONE EXTRA MEETING PER SPRINT",
    cuts: [
      [
        "WE NEED TO DISCUSS YOUR TODO.",
        "Our records show a six-minute shortcut accruing interest since 2017.",
      ],
      [
        "WE ACCEPT INSTALLMENTS.",
        "A little refactor every Friday. We are very reasonable people with access to your calendar.",
      ],
      [
        "OPEN THE TICKET.",
        "Technical Debt Collections. We know where you backlog.",
      ],
    ],
  },
  {
    brand: "404 Self Storage",
    signal: "LOCKERS",
    look: "post",
    stamp: "box",
    mark: "404",
    ticker: "FIND A UNIT NEAR YOU • RESULTS MAY VARY",
    cuts: [
      ["YOUR BELONGINGS ARE SAFE.", "We can confirm that they are somewhere."],
      [
        "AGAIN, THE PAYMENT WENT THROUGH.",
        "A member of staff is checking whether Unit 17 moved permanently.",
      ],
      [
        "PLEASE TRY ANOTHER LOCATION.",
        "404 Self Storage. Your keys still work on the billing portal.",
      ],
    ],
  },
  {
    brand: "The Infinite Scroll Diner",
    signal: "DINING",
    look: "garage",
    stamp: "mug",
    mark: "24H",
    ticker: "BOTTOMLESS COFFEE • BOTTOMLESS MENU • BOTTOM COMING SOON",
    cuts: [
      ["READY TO ORDER?", "Just a second. They are still loading breakfast."],
      [
        "YOU PASSED THE SPECIAL.",
        "Keep going. Eventually the pancakes start repeating.",
      ],
      [
        "THERE IS NO CHECK.",
        "The Infinite Scroll Diner. Your table is sponsored.",
      ],
    ],
  },
  {
    brand: "Cold Cache Cereal",
    signal: "BREAKFAST",
    look: "clinic",
    stamp: "bowl",
    mark: "CC!",
    ticker: "PART OF A BALANCED BREAKPOINT • PRIZE MAY BE STALE",
    cuts: [
      [
        "THE FIRST BOWL TAKES 46 SECONDS.",
        "After that, breakfast is unbelievably fast.",
      ],
      [
        "STILL TASTES LIKE YESTERDAY?",
        "Ask a grown-up to clear the milk and hard-refresh the spoon.",
      ],
      [
        "COLD CACHE CRUNCH.",
        "Now with collectible raisins from a previous deployment.",
      ],
    ],
  },
  {
    brand: "The Exit Interview",
    signal: "ESCAPE",
    look: "night",
    stamp: "key",
    mark: ":q!",
    ticker: "ESCAPE ROOM BOOKINGS OPEN • NO PRIOR VIM EXPERIENCE PREFERRED",
    cuts: [
      [
        "WELCOME TO OUR VIM ESCAPE ROOM.",
        "Inside you will find a chair, a keyboard, and someone else’s Git commit message.",
      ],
      ["THERE IS NO PHYSICAL LOCK.", "One guest has applied for residency."],
      [
        "ESCAPE IS ONLY THE FIRST STEP.",
        "Book The Exit Interview for your next offsite. Lunch may be necessary.",
      ],
    ],
  },
  {
    brand: "OatAuth",
    signal: "COFFEE",
    look: "estate",
    stamp: "mug",
    mark: "Oa",
    ticker: "GRANT LIMITED ACCESS TO YOUR MORNING",
    cuts: [
      [
        "SIGN IN WITH CAPPUCCINO.",
        "Your barista would like permission to read your name and write to your cup.",
      ],
      [
        "THAT CODE HAS EXPIRED.",
        "Your coffee is getting cold. We sent a fresh link to the espresso machine.",
      ],
      ["ALLOW FOAM FOR THIS SESSION?", "OatAuth. Single sign-on. Double shot."],
    ],
  },
  {
    brand: "Deprecation Station",
    signal: "RADIO",
    look: "press",
    stamp: "radio",
    mark: "FM",
    ticker: "98.6 FM • YOUR FAVORITE METHODS UNTIL FURTHER NOTICE",
    cuts: [
      [
        "ALL THE HITS YOU STILL CALL.",
        "Coming up next, a beautiful old API that is keeping six hospitals in business.",
      ],
      ["WE TAKE REQUESTS.", "We log them as warnings. You continue driving."],
      [
        "TUNE IN WHILE YOU STILL CAN.",
        "Deprecation Station. New frequency available in the migration guide.",
      ],
    ],
  },
  {
    brand: "Null Island Holidays",
    signal: "TRAVEL",
    look: "clinic",
    stamp: "palm",
    mark: "00°",
    ticker: "LAT 0° • LON 0° • THE NATURAL DEFAULT",
    cuts: [
      [
        "ALREADY HERE BY ACCIDENT?",
        "Welcome to the holiday destination of every uninitialized location field.",
      ],
      [
        "MEET THE LOCALS.",
        "Eight million missing parcels, three weather stations, and your last food delivery.",
      ],
      [
        "LEAVE YOUR COORDINATES BLANK.",
        "Null Island Holidays. We will handle the rest.",
      ],
    ],
  },
  {
    brand: "Enterprise Fizz",
    signal: "DRINKS",
    look: "garage",
    stamp: "bottle",
    mark: "EF",
    ticker: "CONTACT SALES FOR NUTRITION FACTS",
    cuts: [
      [
        "EXPERIENCE WATER AT SCALE.",
        "The Starter plan includes a sealed can and a detailed hydration roadmap.",
      ],
      [
        "LOOKING FOR THE TAB?",
        "That feature is included with Enterprise Plus.",
      ],
      [
        "BOOK YOUR FIRST SIP.",
        "A beverage solutions engineer will respond within three business days.",
      ],
    ],
  },
  {
    brand: "Revert Funeral Home",
    signal: "SERVICES",
    look: "press",
    stamp: "flower",
    mark: "RF",
    ticker: "QUIETLY SERVING THE MAIN BRANCH SINCE THE LAST INCIDENT",
    cuts: [
      [
        "SAY GOODBYE TO A FEATURE.",
        "A tasteful service for software that briefly touched the lives of three beta users.",
      ],
      [
        "A FEW WORDS FROM QA.",
        "“We did mention this.” Thank you. The family appreciates your honesty.",
      ],
      [
        "GONE BUT STILL IN THE LOG.",
        "Revert Funeral Home. Reintroductions welcome.",
      ],
    ],
  },
];

const REFILLS = [
  {
    name: "One more prompt",
    amount: 500,
    fake: "0.99",
    mark: "01",
    desc: "A perfectly believable stopping point.",
  },
  {
    name: "The company card",
    amount: 1250,
    fake: "9.99",
    mark: "02",
    desc: "Submit it under office supplies.",
  },
  {
    name: "Series A funding",
    amount: 2500,
    fake: "99.99",
    mark: "03",
    desc: "Congratulations on your pre-revenue traction.",
  },
];

const CUT_MS = 1800;
const REWARD = 350;

const GLYPHS = {
  scale: [
    ".......##.......",
    "......####......",
    "..############..",
    "...#...##...#...",
    "..#.#..##..#.#..",
    ".#...#.##.#...#.",
    "######.##.######",
    ".####..##..####.",
    ".......##.......",
    "......####......",
    "....########....",
  ],
  house: [
    ".......##.......",
    "......####......",
    ".....######..##.",
    "....########.##.",
    "...#####.######.",
    "..#####...######",
    ".###############",
    "...###########..",
    "...##..##...##..",
    "...##..##...##..",
    "...###########..",
  ],
  bus: [
    "..###########...",
    ".#############..",
    ".##..#..#...##..",
    ".##..#..#...##..",
    ".#############..",
    ".##########..##.",
    ".##.....###..##.",
    ".##############.",
    "...##.....##....",
    "..####...####...",
    "...##.....##....",
  ],
  pill: [
    ".........####...",
    "........######..",
    ".......########.",
    "......#########.",
    ".....##########.",
    "....##.########.",
    "...##...######..",
    "..##.....####...",
    ".##.....####....",
    ".##....####.....",
    "..########......",
    "...######.......",
  ],
  wrench: [
    "........##...##.",
    ".......###...###",
    ".......###...###",
    ".......#########",
    "........#######.",
    ".......#######..",
    "......####......",
    ".....####.......",
    "....####........",
    "...####.........",
    "..##.##.........",
    "..####..........",
    "...##...........",
  ],
  glasses: [
    "................",
    "................",
    "................",
    "################",
    "#######..#######",
    ".#####....#####.",
    "..###......###..",
    "................",
    "................",
  ],
  box: [
    "......###.......",
    "....#######.....",
    "..#####.#####...",
    ".####..###.####.",
    "...#####.####...",
    ".##..#####..###.",
    ".####..#..#####.",
    ".######.#######.",
    ".######.#######.",
    "...####.#####...",
    ".....##.###.....",
    ".......##.......",
  ],
  fork: [
    "...###.....###..",
    "..##.##...##.##.",
    "..##.##...##.##.",
    "...###.....###..",
    "....#.......#...",
    "....#......##...",
    "....#....###....",
    "....######......",
    "....#...........",
    "...###..........",
    "..##.##.........",
    "...###..........",
  ],
  bed: [
    ".#..............",
    ".#..............",
    ".#.###..........",
    ".#.###..######..",
    ".#.....########.",
    ".##############.",
    ".##############.",
    ".#............#.",
    ".#............#.",
  ],
  bottle: [
    "......####......",
    "......####......",
    ".......##.......",
    ".......##.......",
    "......####......",
    ".....######.....",
    ".....######.....",
    ".....#....#.....",
    ".....#.##.#.....",
    ".....#....#.....",
    ".....######.....",
    ".....######.....",
  ],
  duck: [
    ".........####...",
    "........##.###..",
    "........########",
    "........######..",
    "..#.....####....",
    ".###...#####....",
    ".############...",
    ".############...",
    "..##########....",
    "...########.....",
    ".....#####......",
  ],
  phone: [
    "..############..",
    ".##############.",
    ".####......####.",
    ".......##.......",
    "....##.##.##....",
    "....########....",
    "...####..####...",
    "..###..##..###..",
    ".#####.##.#####.",
    ".######..######.",
    ".##############.",
  ],
  mug: [
    ".....#...#......",
    "....#...#.......",
    ".....#...#......",
    "................",
    "..##########....",
    "..########.####.",
    "..########...##.",
    "..########..###.",
    "..############..",
    "...######.......",
    ".#############..",
  ],
  bowl: [
    "....#....#......",
    ".....#....#.....",
    "....#....#......",
    "................",
    ".##############.",
    ".##############.",
    "..############..",
    "...##########...",
    ".....######.....",
    "....########....",
  ],
  key: [
    ".........#####..",
    "........###.###.",
    "........##...##.",
    "........###.###.",
    ".......#######..",
    "......####......",
    ".....####.......",
    "....####........",
    "...######.......",
    "..####.###......",
    ".####...#.......",
    "..##............",
  ],
  radio: [
    ".........##.....",
    ".......##.......",
    ".....##.........",
    "...##...........",
    ".##############.",
    ".##......##..##.",
    ".##############.",
    ".##.##.##.#####.",
    ".##.##.##.##.##.",
    ".##############.",
  ],
  palm: [
    ".......#.#......",
    "....########....",
    "..############..",
    ".##.#######.###.",
    "...##.##.###..#.",
    "..##..##..###...",
    "...#..##...#....",
    "......##........",
    ".....###........",
    ".....##.........",
    "....###.........",
    "..##########....",
  ],
  flower: [
    ".......##.......",
    ".....######.....",
    ".....##..##.....",
    "....##.##.##....",
    ".....##..##.....",
    "......####......",
    ".......##.......",
    "...###.##.......",
    "....#####.###...",
    "......######....",
    ".......##.......",
    ".......##.......",
  ],
};

function stampCanvas(name) {
  const canvas = document.createElement("canvas");
  const glyph = GLYPHS[name];
  canvas.width = 44;
  canvas.height = 44;
  canvas.setAttribute("aria-hidden", "true");
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.fillStyle = "#fff";
  const left = Math.floor((44 - 2 * glyph[0].length) / 2);
  const top = Math.floor((44 - 2 * glyph.length) / 2);
  glyph.forEach((row, y) =>
    Array.from(row).forEach((pixel, x) => {
      if (pixel === "#") ctx.fillRect(left + 2 * x, top + 2 * y, 2, 2);
    }),
  );
  return canvas;
}

function selectSpot(api) {
  const previous = api.get("sponsors.playlist", null);
  let deck = Array.isArray(previous?.deck)
    ? previous.deck.filter(
        (i) => Number.isInteger(i) && i >= 0 && i < SPOTS.length,
      )
    : [];
  if (!deck.length) {
    deck = SPOTS.map((_, i) => i);
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    if (!previous) {
      const first = deck.indexOf(0);
      [deck[0], deck[first]] = [deck[first], deck[0]];
    } else if (deck[0] === previous.last) {
      [deck[0], deck[1]] = [deck[1], deck[0]];
    }
  }
  const id = deck.shift();
  api.set("sponsors.playlist", { deck, last: id });
  return { spot: SPOTS[id], channel: String(id + 1).padStart(2, "0") };
}

function button(label, className, action) {
  const node = document.createElement("button");
  node.type = "button";
  node.className = className;
  node.textContent = label;
  node.addEventListener("click", action);
  return node;
}

function addLine(parent, tag, className, value) {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = value;
  parent.append(node);
  return node;
}

function mountStamp(node, name) {
  node.append(stampCanvas(name));
}

export function initSponsors(api) {
  const juice = juiceOf(api);
  let active = null;
  const fmt = (n) => api.format(n);

  function stopClock(session) {
    window.clearTimeout(session.clock);
    session.clock = 0;
  }

  function begin(title, eyebrow, callback) {
    if (active) stopClock(active);
    const host = document.createElement("section");
    host.className = "sp-network";
    const session = { host, callback, clock: 0, settled: false };
    active = session;
    api.modal(title, host, {
      wide: true,
      eyebrow,
      onClose() {
        stopClock(session);
        if (active === session) active = null;
      },
    });
    return session;
  }

  function receipt(session, amount, source) {
    const { host } = session;
    host.replaceChildren();
    const ticket = document.createElement("div");
    ticket.className = "sp-receipt";
    const top = addLine(
      ticket,
      "div",
      "sp-ticket-line",
      "GIT RICH QUICK   /   TREASURY WINDOW",
    );
    top.setAttribute("aria-hidden", "true");
    addLine(ticket, "div", "sp-overline", "TRANSACTION APPROVED");
    addLine(ticket, "h3", "sp-receipt-total", "+" + fmt(amount));
    addLine(ticket, "div", "sp-receipt-unit", "TOKENS CREDITED");
    addLine(ticket, "p", "sp-receipt-detail", source);
    const bottom = document.createElement("div");
    bottom.className = "sp-receipt-bottom";
    addLine(bottom, "strong", "", "ACTUAL CHARGE");
    addLine(bottom, "strong", "", "$0.00");
    ticket.append(bottom);
    const code = addLine(ticket, "div", "sp-receipt-code", "");
    code.setAttribute("aria-hidden", "true");
    const actions = document.createElement("div");
    actions.className = "sp-actions";
    actions.append(
      button("Back to the floor", "sp-primary g-btn big volt", () =>
        api.closeModal(),
      ),
      button("Watch another ad ▶", "sp-plain g-btn big ice", () =>
        air(session),
      ),
    );
    host.append(ticket, actions);
    actions.firstElementChild.focus({ preventScroll: true });
    juice.pop(ticket.querySelector(".sp-receipt-total"), "fx-pop");
  }

  // Funding is not a win, so it skips the hype bonus: just coins into the wallet.
  function shower(from, amount, big) {
    if (!juice.enabled || !from) return;
    const r = from.getBoundingClientRect();
    const at = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    juice.coinsTo(at, amount);
    juice.float(at, "+" + fmt(amount), { size: big ? 44 : 34 });
    juice.burst(at, {
      count: big ? 46 : 26,
      colors: ["#fff3b0", "#ffd166", "#ffb703", "#fff"],
    });
    juice.burst(at, { kind: "ring", colors: ["#ffe066"] });
    if (big) {
      juice.burst(at, { kind: "confetti", count: 60, speed: 1.1 });
      juice.shake(0.35);
    } else juice.shake(0.15);
  }

  function pay(session, amount, source, isAd, from) {
    if (active !== session || session.settled) return;
    session.settled = true;
    stopClock(session);
    api.earn(amount, source);
    if (isAd) api.stat("ads");
    api.sound("win");
    shower(from, amount, amount >= 1000);
    if (session.callback) {
      const resume = session.callback;
      session.callback = null;
      api.closeModal();
      api.toast("+" + fmt(amount) + " tokens funded");
      resume();
    } else {
      receipt(session, amount, source);
    }
  }

  function air(session) {
    stopClock(session);
    session.settled = false;
    const { host } = session;
    const { spot, channel } = selectSpot(api);
    host.replaceChildren();
    host.innerHTML = `
      <div class="sp-tv sp-look-${spot.look}">
        <div class="sp-signal"><b><i></i> ON AIR</b><span></span><b>GRQ PUBLIC ACCESS</b></div>
        <div class="sp-screen">
          <div class="sp-picture"><div class="sp-seal"></div></div>
          <div class="sp-script" aria-live="polite" aria-atomic="true">
            <span class="sp-brand"></span><h3></h3><p></p>
          </div>
          <div class="sp-screenmark" aria-hidden="true"></div>
        </div>
        <div class="sp-ticker"></div>
      </div>
      <div class="sp-air-controls">
        <div class="sp-air-meter"><span class="sp-overline">SPONSOR BREAK</span><div class="sp-cuts" aria-hidden="true"><i></i><i></i><i></i></div></div>
      </div>`;
    host.querySelector(".sp-signal span").textContent =
      "CH " + channel + "   /   " + spot.signal;
    host.querySelector(".sp-brand").textContent = spot.brand;
    host.querySelector(".sp-screenmark").textContent = spot.mark;
    host.querySelector(".sp-ticker").textContent = spot.ticker;
    mountStamp(host.querySelector(".sp-seal"), spot.stamp);
    const controls = host.querySelector(".sp-air-controls");
    const claim = button(
      "Sponsor break · 6s",
      "sp-primary sp-claim g-btn big lime",
      () => pay(session, REWARD, spot.brand + " sponsor fee", true, claim),
    );
    claim.disabled = true;
    controls.append(claim);
    const bars = [...host.querySelectorAll(".sp-cuts i")];
    const headline = host.querySelector(".sp-script h3");
    const copy = host.querySelector(".sp-script p");
    const screen = host.querySelector(".sp-screen");
    const start = performance.now();
    let lastCut = -1;
    function tick() {
      if (session !== active) return;
      const elapsed = performance.now() - start;
      const cut = Math.min(spot.cuts.length - 1, Math.floor(elapsed / CUT_MS));
      if (cut !== lastCut) {
        headline.textContent = spot.cuts[cut][0];
        copy.textContent = spot.cuts[cut][1];
        screen.dataset.cut = String(cut);
        if (lastCut >= 0) api.sound("tick");
        lastCut = cut;
      }
      bars.forEach((bar, index) => {
        const fill = Math.max(
          0,
          Math.min(1, (elapsed - index * CUT_MS) / CUT_MS),
        );
        bar.style.setProperty("--sp-progress", (fill * 100).toFixed(1) + "%");
      });
      const remaining = spot.cuts.length * CUT_MS - elapsed;
      if (remaining <= 0) {
        claim.disabled = false;
        claim.textContent = "Claim " + fmt(REWARD) + " tokens →";
        host.querySelector(".sp-air-meter .sp-overline").textContent =
          "SPONSOR FEE RELEASED";
        controls.setAttribute("data-finished", "");
        if (juice.enabled) {
          juice.pop(claim, "fx-pop");
          juice.burst(claim, {
            kind: "star",
            count: 16,
            colors: ["#ffe066", "#fff"],
          });
          api.sound("step");
        }
        const transcript = document.createElement("details");
        transcript.className = "sp-transcript";
        addLine(transcript, "summary", "", "Read the broadcast transcript");
        for (const [line, body] of spot.cuts) {
          const cutText = document.createElement("p");
          addLine(cutText, "b", "", line + " ");
          cutText.append(document.createTextNode(body));
          transcript.append(cutText);
        }
        host.append(transcript);
      } else {
        claim.textContent =
          "Sponsor break · " + Math.ceil(remaining / 1000) + "s";
        session.clock = window.setTimeout(tick, Math.min(100, remaining));
      }
    }
    tick();
  }

  function open(reason, onFunded) {
    const session = begin("Token counter", "FLOOR SERVICES / 01", onFunded);
    const { host } = session;
    host.innerHTML = `
      <div class="sp-counter">
        <div class="sp-counter-main">
          <span class="sp-overline">24 HOUR TOKEN WINDOW</span>
          <h3>Your credit is <em>fictional.</em></h3>
          <p class="sp-reason"></p>
        </div>
        <div class="sp-balance"><span>ON HAND</span><strong></strong><b>TOKENS</b></div>
      </div>
      <div class="sp-labelrow"><span class="sp-overline">BUY A FAKE REFILL</span><span>No card needed · $0 actual charge</span></div>
      <div class="sp-packages"></div>
      <div class="sp-or"><i></i><span>OR TAKE A SPONSOR BREAK</span><i></i></div>
      <button class="sp-sponsor-button" type="button">
        <span class="sp-tv-icon" aria-hidden="true">▶</span><span><b>Watch a fake ad</b><small>Six seconds of completely local television.</small></span><strong>+${fmt(REWARD)} <small>TOKENS</small></strong>
      </button>`;
    host.querySelector(".sp-reason").textContent =
      typeof reason === "string" && reason.trim()
        ? reason
        : "Pick up some house tokens. Finance has already lost the receipt.";
    host.querySelector(".sp-balance strong").textContent = fmt(
      api.state.tokens,
    );
    const offers = host.querySelector(".sp-packages");
    for (const pack of REFILLS) {
      const offer = document.createElement("button");
      offer.type = "button";
      offer.className = "sp-pack";
      offer.dataset.rarity = String(REFILLS.indexOf(pack));
      offer.innerHTML = `<span class="sp-pack-id">CREDIT SLIP / ${pack.mark}</span><strong class="sp-pack-amount">+${fmt(pack.amount)}</strong><span class="sp-pack-name"></span><span class="sp-pack-desc"></span><span class="sp-pack-price">FAKE $${pack.fake}<b>↗</b></span>`;
      offer.querySelector(".sp-pack-name").textContent = pack.name;
      offer.querySelector(".sp-pack-desc").textContent = pack.desc;
      offer.addEventListener("click", () =>
        pay(session, pack.amount, pack.name + " fake refill", false, offer),
      );
      offers.append(offer);
    }
    host
      .querySelector(".sp-sponsor-button")
      .addEventListener("click", () => air(session));
  }

  function openAds() {
    air(begin("Sponsor TV", "GRQ BROADCAST NETWORK"));
  }

  const card = document.querySelector("#sponsor-card");
  if (card) {
    card.innerHTML = `
      <button class="sp-floor-card" type="button">
        <span class="sp-floor-signal" aria-hidden="true"><i></i> ON AIR</span>
        <strong>Sponsor TV</strong>
        <span class="sp-floor-link">Watch a spot <i>·</i> <b>+${fmt(REWARD)} TOK</b> <span aria-hidden="true">→</span></span>
        <img src="${new URL("../assets/sponsor-tv.png", import.meta.url).href}" width="142" height="96" alt="">
      </button>`;
    card.querySelector("button").addEventListener("click", openAds);
  }

  return {
    open,
    openAds,
    update() {
      const balance = active?.host.querySelector(".sp-balance strong");
      if (balance) balance.textContent = fmt(api.state.tokens);
    },
    destroy() {
      if (active) stopClock(active);
      active = null;
      card?.replaceChildren();
    },
  };
}
