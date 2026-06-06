# Chess Sim

A visual chess board + a small **pluggable-player harness** for having different
players (random bots, a human, or model-backed agents via OpenRouter) play each other.

```bash
npm install
cp .env.example .env   # add your OPENROUTER_API_KEY (or export it in your shell)
npm run dev            # http://localhost:5180
npm test               # headless verification of the harness logic
npm run build          # typecheck + production build
```

## Playing models against each other

Models are reached through [OpenRouter](https://openrouter.ai) — one key, one
OpenAI-compatible endpoint, many models. Set `OPENROUTER_API_KEY` (in `.env` or your
shell). A small Vite middleware ([vite.config.ts](vite.config.ts)) proxies
`/api/openrouter/chat` and injects the key **server-side**, so it is never shipped to
the browser.

Pick a model for White and/or Black from the dropdowns and press Start. The preset list
lives in [`PLAYER_OPTIONS`](src/hooks/useChessGame.ts) — edit it to add any OpenRouter
model slug (see <https://openrouter.ai/models>).

**Move parsing is forgiving.** A model may answer in UCI (`e2e4`) or SAN (`Nf3`, `exd3`);
either is mapped to a legal move. If it produces nothing legal after `maxRetries`, that
side forfeits — so the harness measures chess skill, not notation compliance, while still
catching models that can't follow the contract at all.

## How it works

- **Rules** come entirely from [`chess.js`](https://github.com/jhlywa/chess.js) — legality,
  FEN/PGN/SAN, and terminal detection (checkmate / stalemate / draw).
- **Rendering** is [`react-chessboard`](https://github.com/Clariity/react-chessboard).
- The **`GameController`** ([src/engine/gameController.ts](src/engine/gameController.ts))
  owns the game, generates the legal-move list in UCI, runs the turn loop, enforces the
  move contract, and emits an immutable `GameSnapshot` to the UI after every change.

## The contract

A player only implements one method. See [src/engine/types.ts](src/engine/types.ts):

```ts
interface Player {
  readonly name: string
  getMove(ctx: MoveContext): Promise<MoveDecision>
}
```

`MoveContext` hands the player everything it may know — `fen`, `pgn`, `turn`,
`legalMoves` (UCI strings like `e2e4`, `e7e8q`), `legalSan` (same moves in SAN),
`history`, the opponent's `lastMove`, plus `attempt` / `lastError` on retries. The player
returns a `MoveDecision`: `{ uci, reasoning? }`.

**Enforcement:** if `uci` is not in `legalMoves` (or `getMove` throws), the controller
re-prompts up to `maxRetries` times; if it still fails, that side **forfeits**.

## Adding another player

Implement `Player` — format `ctx` into a prompt, send it, and parse the reply back into a
`MoveDecision`. The model integration already does this; see
[`ModelPlayer`](src/players/modelPlayer.ts), which sends the position through a
`ChatTransport` (the OpenRouter proxy by default — but injectable, which is how the tests
run it without a network). Register new players in
[`makePlayer` / `PLAYER_OPTIONS`](src/hooks/useChessGame.ts) so they appear in the
dropdowns.

## Reference implementations

- [`RandomPlayer`](src/players/randomPlayer.ts) — picks a random legal move (default).
- [`HumanPlayer`](src/players/humanPlayer.ts) — resolves its move from board drags.
- [`ModelPlayer`](src/players/modelPlayer.ts) — OpenRouter model via the proxy; accepts
  UCI or SAN replies.
- [`IllegalPlayer`](src/players/illegalPlayer.ts) — always illegal; exercises the
  retry → forfeit path.
