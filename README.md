# Git Rich Quick

![My coding agent ran out of tokens. So I hit the slots.](./assets/share-card.png)

Your coding agent bills by the step. Your branch needs one more commit. Finance sent you to a casino.

## Play

Run `npm start` and open **http://127.0.0.1:4173**. Node 22.13 or newer is enough. The game starts with 1,200 fake tokens, saves in your browser and serves its own art, fonts and synth audio.

For the fastest route to financial distress, open **Agent Desk**, take the dark-mode ticket, choose **Overclock**, and deploy. When the agent runs out of tokens, Sponsor TV will pay you 350 to watch three cuts of deeply questionable television. Your worker picks up at its last checkpoint.

- **Commit Slots** has six reel symbols, six stakes and a hold after two misses. The cabinet paytable shows the returns. Space spins from the floor.
- **Agent Desk** has eight contracts, streamed output, diffs, commit history and downloadable patches. Work continues while you play.
- **The Token Pond** is always free to fish. Land a catch with two timed pulls and fill the ten-species log.
- **Merge Conflict**, **Blame Roulette** and **Deploy or Die** put the same wallet through higher-or-lower, roulette and crash games.
- **Sponsor TV** rotates through 22 commercials. The token counter also takes an entirely imaginary company card.
- **Ledger** records the transactions. Print a PNG receipt when someone asks how you financed your code.

Direct links accept `#desk`, `#slots`, `#pond`, `#ads`, `#merge`, `#roulette`, `#deploy`, `#t3`, `#ledger` and `#receipt`.

## Bring a real T3 thread

**Connect T3** opens an edited brief as a draft in T3 Code. You press Send in T3. To charge your fictional wallet for real reported usage, run `npm run t3` on the machine with your T3 server, open **http://127.0.0.1:7777**, and pair a thread. Every 1,000 new reported model tokens costs one casino token. Your real agent and its real spending limits remain under T3's control. [T3 setup and remote machines](./T3.md)

## Development

The production game uses ES modules and has zero runtime package dependencies. To run the regression suite and build a static distribution:

```sh
npm ci
npm test
npm run build
```

Serve the contents of `dist/` from any static web server. Standalone hosting needs only the files in that directory. Font license notices are in `assets/fonts/`.
