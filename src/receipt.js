import { format } from "./economy.js";

export function openReceipt(api) {
  const { tokens, stats, spent, earned, peak } = api.state;
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 940;
  canvas.className = "receipt-canvas";
  const ctx = canvas.getContext("2d");
  let line = "I am financing software development at a slot machine.";
  if (stats.commits) line = "I can explain how I funded this commit.";
  if (stats.fish && !stats.commits)
    line = "The fish are carrying this engineering department.";
  if (stats.ads && !stats.fish && !stats.commits)
    line = "This build was made possible by our sponsors.";
  const caption =
    line + " Git Rich Quick · " + format(tokens) + " fake tokens.";
  function paint() {
    const w = canvas.width;
    ctx.fillStyle = "#15131b";
    ctx.fillRect(0, 0, w, canvas.height);
    ctx.fillStyle = "#211c2c";
    for (let x = -900; x < w + 100; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 4, 0);
      ctx.lineTo(x + 944, 940);
      ctx.lineTo(x + 940, 940);
      ctx.fill();
    }
    ctx.fillStyle = "#f7e6b8";
    ctx.fillRect(60, 46, 780, 833);
    for (let x = 60; x < 840; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 879);
      ctx.lineTo(x + 12, 893);
      ctx.lineTo(x + 24, 879);
      ctx.fill();
    }
    ctx.fillStyle = "#3b2931";
    ctx.textAlign = "left";
    ctx.font = "20px SpaceMono,monospace";
    ctx.fillText("THE DEV CASINO   /   CASHIER COPY", 99, 111);
    ctx.font = "900 92px BarlowCondensed,Impact,sans-serif";
    ctx.fillText("GIT RICH QUICK", 95, 204);
    ctx.strokeStyle = "#6c5645";
    ctx.setLineDash([9, 9]);
    ctx.beginPath();
    ctx.moveTo(98, 240);
    ctx.lineTo(802, 240);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#66432e";
    ctx.font = "22px SpaceMono,monospace";
    ctx.fillText("TOKEN BALANCE", 99, 295);
    ctx.fillStyle = "#2f242a";
    ctx.font = "900 89px BarlowCondensed,Impact,sans-serif";
    ctx.fillText(format(tokens) + " TOK", 96, 382);
    const rows = [
      ["Contracts shipped", stats.commits || 0],
      ["Slot spins", stats.spins || 0],
      ["Fish landed", stats.fish || 0],
      ["Ads endured", stats.ads || 0],
      ["Tokens burned", spent],
      ["Tokens earned", earned],
      ["Peak bankroll", peak],
    ];
    ctx.font = "23px SpaceMono,monospace";
    rows.forEach(([label, val], i) => {
      const y = 436 + i * 40;
      ctx.textAlign = "left";
      ctx.fillText(label, 99, y);
      ctx.textAlign = "right";
      ctx.fillText(format(val), 800, y);
    });
    ctx.textAlign = "left";
    ctx.fillStyle = "#a44733";
    ctx.font = "700 26px Barlow,Arial";
    const words = line.split(" ");
    let s = "",
      y = 752;
    for (const w of words) {
      if (ctx.measureText(s + w).width > 680) {
        ctx.fillText(s, 98, y);
        s = "";
        y += 33;
      }
      s += w + " ";
    }
    ctx.fillText(s, 98, y);
    ctx.fillStyle = "#6c5645";
    ctx.font = "16px SpaceMono,monospace";
    ctx.fillText("NO CASH VALUE   //   ALL SALES IMAGINARY", 99, 844);
  }
  paint();
  document.fonts?.ready.then(paint);
  const panel = document.createElement("div"),
    buttons = document.createElement("div");
  buttons.className = "receipt-actions";
  panel.append(canvas, buttons);
  function button(txt, fn, primary) {
    const b = document.createElement("button");
    b.className = "hud-btn" + (primary ? " primary" : "");
    b.textContent = txt;
    b.onclick = fn;
    buttons.append(b);
  }
  button(
    "Download receipt PNG",
    () =>
      canvas.toBlob((blob) => {
        if (!blob) return;
        const u = URL.createObjectURL(blob),
          a = document.createElement("a");
        a.href = u;
        a.download = "git-rich-quick-receipt.png";
        a.click();
        setTimeout(() => URL.revokeObjectURL(u), 2000);
      }, "image/png"),
    true,
  );
  button("Copy caption", async () => {
    try {
      await navigator.clipboard.writeText(caption);
      api.toast("Caption copied.");
    } catch {
      const t = document.createElement("textarea");
      t.value = caption;
      t.readOnly = true;
      buttons.append(t);
      t.select();
    }
  });
  api.modal("Your run receipt", panel, { eyebrow: "CASHIER / SHARE" });
}
