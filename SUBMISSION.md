# Hackathon submission — Human vs Agent

## Project description (non-technical)

Human vs Agent is a three-round fact-checking game. You decide whether a claim is true or false and how confident you feel. Your opponent has a tiny wallet: when it is unsure, it can spend some of its budget on evidence before committing to an answer. At the end, you compare accuracy, spending, and whether the extra information helped. The aim is to make critical thinking fun and ask a simple question: when is knowing more worth paying for? This prototype uses a scripted agent and simulated payments.

## Technical description

The app is built with React and Vite. It runs entirely in the browser and has three curated claims, with explanations linked to BrainFacts, NASA, and NIST.

The player selects True or False and a confidence level from 50% to 100%. The demo opponent starts with preset answers and confidence values. A separate decision function buys evidence when confidence is below 80% and the wallet can afford it. That function does not receive the player's answer or the answer key.

The mock wallet starts with 0.10 USDC. It stores amounts as integer cents, rejects invalid amounts, prevents concurrent overspending, and uses a unique payment reference so retries do not charge twice. Before scoring, the app checks the receipt status, amount, and balance. Correct answers earn 100 points. Knowledge ROI is the net increase in correct agent answers compared with its initial answers, divided by USDC spent.

The current version does not call a live language model or send Solana transactions. The payment adapter is separate from the game so a sponsor payment service can replace it later. A real integration would need server-side signing, receipt verification, and scoring. There are 12 automated tests covering budget rules, duplicate requests, invalid receipts, lost-confirmation retries, and all eight player-answer combinations. The main flow was also tested in the browser at mobile and desktop widths.

## Links

- GitHub: https://github.com/pollypolly0317-star/human-vs-agent
- Presentation video: not recorded/provided yet — replace with a public or unlisted video URL before submitting.
- Live demo: not publicly deployed. http://localhost:5173 is only a local development address and should not be submitted as a public demo link.

## 60–90 second presentation outline

1. Show the game: “This is Human vs Agent. You bring your knowledge; the opponent brings a tiny wallet. The question is when evidence is worth paying for.”
2. Round 1: choose False for the brain myth and lock the answer. Point out that the agent is confident and saves its budget.
3. Round 2: choose True for Venus. Show the agent's uncertainty, its 0.02 mock USDC purchase, and the updated answer. Open the fact-check receipt.
4. Round 3: answer the atomic-clock question. Show the second evidence purchase and remaining wallet balance.
5. Show the summary: “The agent spent 0.05 mock USDC and corrected two initial answers. We show accuracy alongside spending so being correct is only part of the story.”
6. Close: “This is a working scripted prototype. Live model decisions and sponsor payments are the next integration step. The educational goal is to help people notice uncertainty and ask for evidence.”

Review and personalize these notes before submitting. Do not claim live AI, sponsor integration, real payments, or a deployed demo until those have actually been implemented.
