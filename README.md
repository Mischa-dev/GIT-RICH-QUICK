# Git Rich Quick

![My coding agent ran out of tokens. So I hit the slots.](./assets/share-card.png)

Your coding agent bills by the step. Your branch needs one more commit. Finance sent you to a casino.

## Play

**[Play Git Rich Quick in your browser](https://mischa-dev.github.io/GIT-RICH-QUICK/)**

Run `npm start` and open **http://127.0.0.1:4173**. Node 22.13 or newer is enough. You start with 1,200 fake tokens. The game saves in your browser and serves its own art, pixel fonts and synth audio.

Press any key. The agent's IDE takes the middle of the screen.

### The loop

1. **Pick a ticket and vibe at the agent.** Type a prompt (every keystroke throws sparks and builds a combo) and press Enter.
2. **Watch it code.** VIBE-1 streams the patch into the editor and burns tokens on every step. Mash any letter key (or VIBE HARDER) to make it go faster. The tokens still burn.
3. **It runs out of tokens right before the finish.** CONTINUE? 9… 8… 7…
4. **Watch a brainrot ad.** The sponsor spot plays on top with a neon runner underneath and word-by-word captions.
5. **ALL IN?** Put your whole balance on red or black (a real single-zero wheel). Win, and the agent resumes by itself.
6. **SHIPPED.** The diff slams into the editor and the payout rains into your wallet. Pick the next ticket.

### Run an ungodly number of agents

The row above the IDE is your fleet. **SPAWN** (or ×5) puts another agent on a random ticket. Every agent bills the same wallet, so the more you run, the faster you're broke.

- Agents ping when they finish and wait for **REVIEW**. **ACCEPT ALL** merges them one after another as a **MERGE TRAIN**, and every car in the train pays a little more than the last.
- Agents that can't pay turn red and **STARVE** until you feed them.
- **WALL** shows every agent streaming code at once.
- Start with 4 slots, then buy more, up to 24.

### While it codes

- **Side bets on your own build:** "ALL GREEN FIRST TRY? 2×" and "CRIT MERGE? 4×" pop up mid-run on a 4-second timer.
- **The test reel:** 48 tests race green. Sometimes it stops at 47/48 and re-runs, and you pay again.
- **Ship streak:** every consecutive ship pays 10% more (up to ×2) and speeds the music up. Let the CONTINUE countdown hit zero and it's gone.
- **The announcer** yells at you. Turn him off in Sound & FX if you must.

### Slop skills

Toggles under the prompt that do exactly what they say:

- **AUTO-PROMPT** re-sends whatever's in its box every time the agent ships: ×1, ×3, ×10 or ∞.
- **ULTRATHINK** costs 3× the tokens, is slower, and crits far more often.
- **MAKE NO MISTAKES** is appended to your prompt. It costs a bit more and helps a bit.
- **YOLO MODE** (`--dangerously-skip-permissions`) skips review for free and sometimes `rm -rf`s your progress back to Edit.
- **FIX IT** shoves a running agent along for 15 tokens. It will tell you you're absolutely right.
- **🙏 PRAY** costs 25 tokens and has a tiny chance to ship the run on the spot.

### Everything else

- **Everything moves on the beat.** The screen punches on the kick, strobes on the snare when it's hot, lasers sweep behind everything and bulbs chase around the IDE. Warm up and it starts raining coins.
- **Hype meter.** Five tiers from COLD to TRANSCENDENT multiply wins up to ×2 and drive the lasers, colours and music.
- **XP, levels and ranks.** Every level pays a token bonus.
- **Side slot and side bets.** Commit Slots (third-reel anticipation, AUTO ×10, a progressive jackpot on 777), Merge Conflict, Blame Roulette, Deploy or Die, the Token Pond and Sponsor TV.
- **Ledger** records every transaction. Print a PNG receipt when someone asks how you financed your code.

| Key | Does |
| --- | --- |
| `A`–`Z` | Mash while the agent codes |
| `Enter` | Send the prompt |
| `Space` | Spin the side slot |
| `1` | Focus the IDE |
| `2` `3` `4` | Merge Conflict, Blame Roulette, Deploy or Die |
| `5` `6` | Token Pond, Sponsor TV |
| `9` | Ledger |
| `N` / `Shift`+`N` | Spawn an agent / five agents (`Shift` needed while VIBE-1 is coding) |
| `M` | Accept all finished agents |
| `W` | Agent wall |
| `Esc` | Close a scene |

Open **Sound & FX** (the speaker button) for music, effects and visual intensity (Chill, Hyped, Feral). If your system asks for reduced motion, the shake, strobes, particles and backdrop motion turn off.

Direct links skip the boot screen: `#desk`, `#slots`, `#pond`, `#ads`, `#merge`, `#roulette`, `#deploy`, `#t3`, `#ledger` and `#receipt`.

## Bring a real T3 thread

**Connect T3** opens an edited brief as a draft in T3 Code. You press Send in T3. To charge your fictional wallet for real reported usage, run `npm run t3` on the machine with your T3 server, open **http://127.0.0.1:7777**, and pair a thread. Every 1,000 new reported model tokens costs one casino token. Your real agent and its real spending limits remain under T3's control. [T3 setup and remote machines](./T3.md)

## Development

The production game uses ES modules and has zero runtime package dependencies. To run the regression suite and build a static distribution:

```sh
npm ci
npm test
npm run build
```

Serve the contents of `dist/` from any static web server. Standalone hosting needs only the files in that directory. Font license notices (Barlow, Barlow Condensed, Space Mono; all OFL) are in `assets/fonts/`.
