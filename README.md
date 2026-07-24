# Skull King

A multiplayer web version of Grandpa Beck's *Skull King*, built as an npm-workspaces monorepo:

- **`shared/`** — pure game logic (deck, trick resolution, scoring) with no framework dependencies. Shared by both server and client, and fully unit tested.
- **`server/`** — Node.js + Express + Socket.IO. Holds authoritative, in-memory game state per room. No database.
- **`client/`** — React + TypeScript + Tailwind CSS, mobile-first, pirate-themed.

## Two rules calls worth double-checking against your physical copy

The build prompt flagged some rules/edition uncertainty up front. While implementing, I had to resolve two ambiguities — both are centralized in code so they're easy to flip if your rulebook says otherwise:

1. **Player count is capped at 2–6, not 2–8.** The base deck has 69 cards. Round 10 deals 10 cards/player, so 7+ players can't even be dealt a full round 10 (70+ cards needed). This also matches what's printed on your box. See [`shared/src/types.ts`](shared/src/types.ts).

2. **A Pirate beats the Skull King (when no Mermaid is present).** The prompt's hierarchy text said Pirates "lose to ... the Skull King," but also specified a "Pirate capturing the Skull King" bonus — which would be unreachable under that hierarchy (the Skull King would always win those tricks instead). I flipped that one matchup so the bonus is actually reachable; everything else (Mermaid beguiles the Skull King, Mermaid loses to Pirate normally, trump/suit/escape ordering) is implemented exactly as specified. This is also the commonly cited real-world Skull King rule. See the doc comment on `resolveTrick` in [`shared/src/trickResolution.ts`](shared/src/trickResolution.ts).

If your rulebook disagrees with either, both are small, isolated changes.

## Getting started

```bash
npm install
npm run build:shared
```

Run the server and client in two terminals:

```bash
npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:5173
```

Copy `server/.env.example` to `server/.env` and `client/.env.example` to `client/.env` if you need to override the defaults (ports, CORS origin, server URL).

Open `http://localhost:5173`, create a room, add bots to fill empty seats, and start a game — you can play a full 10-round game solo against up to 5 bots.

## Tests

```bash
npm test
```

Runs the shared package's Vitest suite (43 tests) covering trick-winner resolution — including every Mermaid/Pirate/Skull King interaction — bid validation, scoring (including capture bonuses), and deck/deal correctness. This is where the game's tricky logic lives, so it's the most heavily tested part of the codebase.

## Deploying to Render

`render.yaml` defines a single web service: it builds `shared`, `server`, and `client`, then the Express server serves the built client as static files and handles Socket.IO on the same origin — no separate static site, no CORS to configure, one URL. See `server/src/index.ts`.

Nothing to fill in after deploy; `npm start` (i.e. `npm run start --workspace=server`) just works once the build finishes.

For local dev, the client and server still run as two separate processes (`dev:server` / `dev:client`) since that gives you hot reload on both — that's a dev-time convenience only, unrelated to how it's deployed.

## Extending later

- **Expansion cards** (Kraken, White Whale, Loot, Tigress): the deck, trick resolution, and scoring are all centralized in `shared/`, and `Card` is a discriminated union — add new `kind`s there and extend `resolveTrick`/`scoreRound` without touching the server's room/socket plumbing.
- **More players**: raising `MAX_PLAYERS` beyond 6 requires either a bigger deck (expansion cards help here) or capping which rounds are playable at higher player counts.
