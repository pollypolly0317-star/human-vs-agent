// Shared, testable settlement guard. It cannot authenticate a blockchain receipt;
// a live integration must do that on its server before returning confirmation.
export function settleRound({
  round,
  humanAnswer,
  confidence,
  decision,
  receipt,
  openingBalance,
}) {
  if (
    typeof humanAnswer !== "boolean" ||
    !Number.isInteger(confidence) ||
    confidence < 50 ||
    confidence > 100
  )
    throw new Error("Choose a valid answer and confidence");
  if (
    decision.buy &&
    (!receipt ||
      receipt.status !== "confirmed" ||
      !receipt.id ||
      receipt.amountCents !== round.cost ||
      !Number.isSafeInteger(receipt.balance) ||
      receipt.balance !== openingBalance - round.cost)
  )
    throw new Error(
      "Payment is not confirmed. Check the payment status before retrying.",
    );
  if (!decision.buy && receipt) throw new Error("Unexpected payment receipt");
  const agentAnswer = decision.buy ? round.answer : round.initial.answer;
  return {
    id: round.id,
    humanAnswer,
    confidence,
    agentAnswer,
    humanCorrect: humanAnswer === round.answer,
    agentCorrect: agentAnswer === round.answer,
    initialCorrect: round.initial.answer === round.answer,
    cost: decision.buy ? receipt.amountCents : 0,
  };
}
