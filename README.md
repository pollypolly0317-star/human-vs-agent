# Human vs Agent

A fast three-round educational hackathon MVP built with React and Vite. Fully local: no API keys required.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:5173. `npm run build` creates `dist/`; `npm test` checks payment idempotency, budget limits, scoring, and ROI.

## Demo script (about 90 seconds)

1. Brain myth: choose False, adjust confidence, lock. Agent starts at 94% and saves its money.
2. Venus rotation: choose True. Agent starts at 62%, buys NASA evidence for 0.02 mock USDC, and changes False → True.
3. Atomic clocks: choose an answer. Agent starts at 53%, buys NIST evidence for 0.03 mock USDC, and changes False → True.
4. Open final results: agent accuracy 100%, spend 0.05 USDC, remaining balance 0.05 USDC, Knowledge ROI 40 extra correct answers / USDC (2 corrected answers ÷ 0.05).

Correct answers earn 100 points. Human confidence does not affect score. Replay resets the wallet and all results. Refresh starts a new game. The game uses curated claims, preset agent answers, and an explicit confidence threshold; it does not call a live AI model. Source documents are linked in the reveal and recap. Sources are publicly available; mock fees demonstrate an evidence-service business model, not actual fees charged by NASA/NIST/BrainFacts.

## Replace mock payments

`src/payment.js` is the payment adapter boundary:

- `getBalance()` returns integer USDC cents.
- `purchase({ amountCents, idempotencyKey })` resolves only after confirmation, returning `{ id, amountCents, balance, status, mode }`.
- Repeated requests with the same key must not charge twice. Insufficient funds must fail without changing the balance.

Replace `createMockWallet()` with an adapter backed by your sponsor wallet, pay.sh, or Solana service. Keep signing credentials on a backend. Use a fresh session-scoped idempotency key for every game, verify transaction confirmation server-side, and return the confirmed balance. Convert integer cents to USDC base units on the server (1 cent = 10,000 base units for a 6-decimal token). Do not treat the current mock receipt as a chain transaction. No sponsor API contract or credentials were supplied, so no live integration is claimed.

`src/engine.js` holds claims, source links, decision policy and summary calculations. `decide()` accepts initial confidence, the priced offer, and balance, never the human's choice or the ground truth. Replace preset predictions and the confidence policy with your live model behind a backend; keep ground truth for scoring separate from the live model request. For a real paid evidence service, unlock source content server-side only after payment verification. All demo data is intentionally visible in this frontend bundle.

## Submission

See [SUBMISSION.md](SUBMISSION.md) for the project summary, technical notes and a short presentation outline. The current release uses a scripted agent and mock payments; no live AI, sponsor payment service, or blockchain transaction is connected.

## Validation and limitations

The wallet rejects invalid/unsafe amounts and missing references, blocks reference reuse with a changed amount, reserves funds before concurrent requests, and returns immutable balance snapshots. Each game uses a fresh payment-reference namespace. Settlement checks confirmed status, amount and expected balance before scoring; failed rounds keep the human answer locked and retries retain their reference. Knowledge ROI uses net improvement (including regressions) and shows N/A when there was no spend.

Fact-checks were reviewed against BrainFacts/SfN, NASA and NIST on 2026-09-30. The clock claim specifies the near-Earth height comparison. Each reveal explains the source and its limitations. Preset confidence is explicitly not a calibrated probability. Demo evidence prices are not publisher fees.

This remains a client-only educational demo. A person controlling their browser can read the bundled answers or modify local game state. Do not use it for real prizes, real-money settlement, or claims of secure competitive scoring. Those require server-owned questions/scoring, authenticated sessions, verified payments and deployment security review. Dependency audit results are a point-in-time check of known advisories, not proof of zero vulnerabilities.
