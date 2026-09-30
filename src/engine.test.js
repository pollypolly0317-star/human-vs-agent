import test from "node:test";
import assert from "node:assert/strict";
import { decide, rounds, summarize } from "./engine.js";
import { createMockWallet } from "./payment.js";
test("policy saves on confident claims and respects budget", () => {
  assert.equal(decide(rounds[0].initial, rounds[0], 10).buy, false);
  assert.equal(decide(rounds[1].initial, rounds[1], 10).buy, true);
  assert.equal(decide(rounds[2].initial, rounds[2], 2).buy, false);
});
test("concurrent repeated payment charges exactly once", async () => {
  const wallet = createMockWallet(10, 0);
  const receipt = await Promise.all([
    wallet.purchase({ amountCents: 3, idempotencyKey: "a" }),
    wallet.purchase({ amountCents: 3, idempotencyKey: "a" }),
  ]);
  assert.deepEqual(receipt[0], receipt[1]);
  assert.equal(await wallet.getBalance(), 7);
  await assert.rejects(
    wallet.purchase({ amountCents: 8, idempotencyKey: "b" }),
  );
  assert.equal(await wallet.getBalance(), 7);
});
test("three-round demo reconciles spend, accuracy and learning ROI", async () => {
  const wallet = createMockWallet(10, 0),
    results = [];
  for (const round of rounds) {
    const buy = decide(round.initial, round, await wallet.getBalance()).buy;
    if (buy)
      await wallet.purchase({
        amountCents: round.cost,
        idempotencyKey: round.id,
      });
    results.push({
      humanCorrect: true,
      agentCorrect: buy || round.initial.answer === round.answer,
      initialCorrect: round.initial.answer === round.answer,
      cost: buy ? round.cost : 0,
    });
  }
  assert.deepEqual(summarize(results), {
    human: 3,
    agent: 3,
    spend: 5,
    gained: 2,
    roi: 40,
  });
  assert.equal(await wallet.getBalance(), 5);
});

test("rejects invalid balances, amounts, and missing references without charging", async () => {
  for (const balance of [
    -1,
    NaN,
    Infinity,
    1.1,
    "10",
    Number.MAX_SAFE_INTEGER + 1,
  ])
    assert.throws(() => createMockWallet(balance, 0));
  const w = createMockWallet(10, 0);
  for (const amountCents of [
    -1,
    0,
    NaN,
    Infinity,
    0.5,
    "2",
    Number.MAX_SAFE_INTEGER + 1,
  ])
    await assert.rejects(
      w.purchase({ amountCents, idempotencyKey: "invalid" }),
    );
  for (const idempotencyKey of [undefined, "", " ", {}, "x".repeat(101)])
    await assert.rejects(w.purchase({ amountCents: 1, idempotencyKey }));
  assert.equal(await w.getBalance(), 10);
});
test("a reused payment reference with another amount is rejected", async () => {
  const w = createMockWallet(10, 0);
  await w.purchase({ amountCents: 2, idempotencyKey: "same" });
  await assert.rejects(
    w.purchase({ amountCents: 3, idempotencyKey: "same" }),
    /different amount/,
  );
  assert.equal(await w.getBalance(), 8);
});
test("concurrent distinct payments never overspend; receipts keep their own balances", async () => {
  const w = createMockWallet(5, 2);
  const [a, b, c] = await Promise.allSettled([
    w.purchase({ amountCents: 2, idempotencyKey: "a" }),
    w.purchase({ amountCents: 3, idempotencyKey: "b" }),
    w.purchase({ amountCents: 1, idempotencyKey: "c" }),
  ]);
  assert.equal(a.value.balance, 3);
  assert.equal(b.value.balance, 0);
  assert.equal(c.status, "rejected");
  assert.equal(await w.getBalance(), 0);
  assert.throws(() => {
    a.value.balance = 99;
  });
});
test("invalid policy data cannot trigger spending", () => {
  for (const confidence of [NaN, Infinity, -1, 49, 101, "60"])
    assert.throws(() => decide({ answer: true, confidence }, { cost: 2 }, 10));
  for (const cost of [NaN, -1, 1.5, "2"])
    assert.throws(() => decide({ answer: true, confidence: 60 }, { cost }, 10));
  assert.equal(
    decide({ answer: true, confidence: 80 }, { cost: 3 }, 10).buy,
    false,
  );
  assert.equal(
    decide({ answer: true, confidence: 79 }, { cost: 3 }, 3).buy,
    true,
  );
});
test("ROI counts regressions and avoids division by zero", () => {
  assert.equal(summarize([]).roi, null);
  assert.equal(
    summarize([
      {
        humanCorrect: false,
        agentCorrect: false,
        initialCorrect: true,
        cost: 2,
      },
    ]).roi,
    -50,
  );
  assert.equal(
    summarize([
      {
        humanCorrect: true,
        agentCorrect: true,
        initialCorrect: false,
        cost: 2,
      },
      {
        humanCorrect: false,
        agentCorrect: false,
        initialCorrect: true,
        cost: 3,
      },
    ]).roi,
    0,
  );
});
