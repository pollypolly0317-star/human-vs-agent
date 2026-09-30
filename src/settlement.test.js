import test from "node:test";
import assert from "node:assert/strict";
import { settleRound } from "./settlement.js";
import { rounds, decide, summarize } from "./engine.js";
import { createMockWallet } from "./payment.js";
const valid = {
  round: rounds[1],
  humanAnswer: true,
  confidence: 75,
  decision: { buy: true },
  openingBalance: 10,
  receipt: { id: "MOCK-test", status: "confirmed", amountCents: 2, balance: 8 },
};
test("unconfirmed, wrong-amount and wrong-balance receipts cannot unlock scoring", () => {
  for (const receipt of [
    null,
    {},
    { ...valid.receipt, status: "pending" },
    { ...valid.receipt, amountCents: 3 },
    { ...valid.receipt, balance: -1 },
    { ...valid.receipt, balance: 7 },
    { ...valid.receipt, id: "" },
  ])
    assert.throws(() => settleRound({ ...valid, receipt }));
  assert.equal(settleRound(valid).cost, 2);
});
test("human confidence and answer are validated", () => {
  for (const humanAnswer of [null, undefined, "true", 1])
    assert.throws(() => settleRound({ ...valid, humanAnswer }));
  for (const confidence of [NaN, 49, 101, 75.5, "75"])
    assert.throws(() => settleRound({ ...valid, confidence }));
});
test("all eight possible human answer paths reconcile with the wallet", async () => {
  for (let mask = 0; mask < 8; mask++) {
    const wallet = createMockWallet(10, 0),
      results = [];
    for (let i = 0; i < rounds.length; i++) {
      const round = rounds[i],
        openingBalance = await wallet.getBalance(),
        decision = decide(round.initial, round, openingBalance);
      const receipt = decision.buy
        ? await wallet.purchase({
            amountCents: round.cost,
            idempotencyKey: round.id,
          })
        : null;
      results.push(
        settleRound({
          round,
          humanAnswer: Boolean(mask & (1 << i)),
          confidence: i === 0 ? 50 : 100,
          decision,
          receipt,
          openingBalance,
        }),
      );
    }
    const summary = summarize(results);
    assert.equal(summary.agent, 3);
    assert.equal(summary.spend, 5);
    assert.equal(summary.roi, 40);
    assert.equal(await wallet.getBalance(), 5);
    assert.equal(
      summary.human,
      rounds.filter((r, i) => Boolean(mask & (1 << i)) === r.answer).length,
    );
  }
});

test('retry after a lost confirmation recovers the same receipt without a second charge',async()=>{
 const wallet=createMockWallet(10,0);
 const request={amountCents:2,idempotencyKey:'lost-confirmation'};
 // A payment succeeded, but its first response never reached the UI.
 await wallet.purchase(request);
 assert.throws(()=>settleRound({...valid,receipt:null}));
 const receipt=await wallet.purchase(request);
 const result=settleRound({...valid,receipt});
 assert.equal(result.cost,2);assert.equal(await wallet.getBalance(),8);
});
