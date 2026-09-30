// Adapter amounts are safe integer USDC cents. Real signing/receipt verification
// belongs on a server; this implementation never sends money or network requests.
export function createMockWallet(initialBalance = 10, delay = 1100) {
  if (!Number.isSafeInteger(initialBalance) || initialBalance < 0)
    throw new Error("Invalid wallet balance");
  if (!Number.isFinite(delay) || delay < 0 || delay > 30000)
    throw new Error("Invalid confirmation delay");
  let balance = initialBalance;
  const receipts = new Map();
  return {
    mode: "mock",
    async getBalance() {
      return balance;
    },
    async purchase({ amountCents, idempotencyKey } = {}) {
      if (!Number.isSafeInteger(amountCents) || amountCents <= 0)
        throw new Error("Invalid payment amount");
      if (
        typeof idempotencyKey !== "string" ||
        !/^[a-zA-Z0-9_-]{1,100}$/.test(idempotencyKey)
      )
        throw new Error("Invalid payment reference");
      const existing = receipts.get(idempotencyKey);
      if (existing) {
        if (existing.amountCents !== amountCents)
          throw new Error(
            "Payment reference already used for a different amount",
          );
        return existing.pending;
      }
      if (amountCents > balance) throw new Error("Insufficient wallet balance");
      // Reserve before yielding so concurrent requests cannot overspend.
      balance -= amountCents;
      const receipt = Object.freeze({
        id: `MOCK-${idempotencyKey}`,
        amountCents,
        balance,
        status: "confirmed",
        mode: "mock",
      });
      const pending = new Promise((resolve) =>
        setTimeout(() => resolve(receipt), delay),
      );
      receipts.set(idempotencyKey, { amountCents, pending });
      return pending;
    },
  };
}
