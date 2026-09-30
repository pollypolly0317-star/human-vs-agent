import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  Check,
  X,
  ExternalLink,
  RotateCcw,
  Wallet,
  LoaderCircle,
} from "lucide-react";
import { rounds, factNotes, decide, money, summarize } from "./engine";
import { createMockWallet } from "./payment";
import { HelpDialog } from "./HelpDialog";
import { FactCheck } from "./FactCheck";
import { settleRound } from "./settlement";
import "./styles.css";
const label = (v) => (v ? "True" : "False");
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function Confidence({ value, human, onChange, disabled }) {
  return (
    <div className={"confidence " + (human ? "human" : "")}>
      <div className="between">
        <label htmlFor={human ? "confidence" : undefined}>
          {human ? "Your confidence" : "Agent confidence"}
        </label>
        <strong>{value}%</strong>
      </div>
      {human ? (
        <input
          id="confidence"
          type="range"
          min="50"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          style={{ "--fill": `${(value - 50) * 2}%` }}
        />
      ) : (
        <div
          className="meter"
          role="meter"
          aria-label="Agent confidence"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${value}%` }} />
        </div>
      )}
      <div className="between hints">
        <span>{human ? "50% · Coin flip" : "Preset estimate"}</span>
        <span>{human ? "100% · Certain" : "Not calibrated"}</span>
      </div>
    </div>
  );
}
function Scoreboard({ stats }) {
  return (
    <section className="scoreboard" aria-label="Scores">
      <div>
        <small>HUMAN</small>
        <strong>
          {stats.human * 100} <span>pts</span>
        </strong>
      </div>
      <div>
        <small>AGENT</small>
        <strong>
          {stats.agent * 100} <span>pts</span>
        </strong>
      </div>
      <div>
        <small>EVIDENCE SPEND</small>
        <strong>
          {money(stats.spend)} <span>USDC</span>
        </strong>
      </div>
    </section>
  );
}
function Summary({ results, onRestart, balance }) {
  const s = summarize(results);
  return (
    <>
      <section className="summary panel">
        <div className="finish-mark">
          <Check size={30} />
        </div>
        <h2>
          {s.human === s.agent
            ? "A draw. Your brain cost less."
            : s.human > s.agent
              ? "Humanity: still in the game."
              : "The robot brought receipts."}
        </h2>
        <p>Three claims checked. Your skepticism just leveled up.</p>
        <div className="metrics">
          {[
            [
              "Human Accuracy",
              `${Math.round((s.human / results.length) * 100)}%`,
              `${s.human} of ${results.length} correct`,
            ],
            [
              "Agent Accuracy",
              `${Math.round((s.agent / results.length) * 100)}%`,
              `${s.agent} of ${results.length} correct`,
            ],
            [
              "Agent Spend",
              `${money(s.spend)}`,
              `USDC · ${money(balance)} left`,
            ],
            [
              "Knowledge ROI",
              s.roi === null ? "N/A" : s.roi.toFixed(0),
              "extra correct answers / USDC",
            ],
          ].map(([name, value, detail]) => (
            <div key={name}>
              <small>{name}</small>
              <strong>{value}</strong>
              <span>{detail}</span>
            </div>
          ))}
        </div>
        <div className="roi-note">
          Evidence added <b>{s.gained} net correct agent answers</b> for{" "}
          <b>{money(s.spend)} USDC</b>. Knowledge ROI = net additional correct
          answers versus initial answers ÷ USDC spent. Scripted example, not a
          model benchmark or financial return. No spend means ROI is N/A.
        </div>
        <button className="primary" onClick={onRestart}>
          <RotateCcw size={17} /> Play again
        </button>
      </section>
      <section className="panel recap">
        <h3>Your knowledge, upgraded.</h3>
        {results.map((r, i) => (
          <div className="recap-row" key={r.id}>
            <span className="round-number">0{i + 1}</span>
            <div>
              <b>{rounds[i].claim}</b>
              <p>{rounds[i].lesson}</p>
              <p className="recap-answers">
                You: {label(r.humanAnswer)} · {r.confidence}% confident{" "}
                <span>Answer: {label(rounds[i].answer)}</span>
              </p>
              <a href={rounds[i].url} target="_blank" rel="noreferrer">
                {rounds[i].source} <ExternalLink size={12} />
              </a>
            </div>
            <span className={r.humanCorrect ? "correct" : "incorrect"}>
              {r.humanCorrect ? "Correct" : "Missed"}
            </span>
          </div>
        ))}
      </section>
    </>
  );
}
function App() {
  const [index, setIndex] = useState(0),
    [choice, setChoice] = useState(null),
    [confidence, setConfidence] = useState(75),
    [phase, setPhase] = useState("choose"),
    [balance, setBalance] = useState(10),
    [results, setResults] = useState([]),
    [decision, setDecision] = useState(null),
    [receipt, setReceipt] = useState(null),
    [error, setError] = useState(""),
    [help, setHelp] = useState(false);
  const wallet = useRef(null),
    busy = useRef(false),
    session = useRef(crypto.randomUUID()),
    claimRef = useRef(null),
    revealRef = useRef(null),
    mainRef = useRef(null);
  if (!wallet.current) wallet.current = createMockWallet();
  const round = rounds[index],
    stats = summarize(results),
    revealed = phase === "reveal",
    done = phase === "summary",
    locked = phase !== "choose";
  useEffect(() => {
    if (index > 0 && phase === "choose") claimRef.current?.focus();
    if (phase === "reveal") revealRef.current?.focus();
    if (phase === "summary") mainRef.current?.focus();
  }, [index, phase]);
  async function play() {
    if (busy.current || choice === null || !["choose", "error"].includes(phase))
      return;
    busy.current = true;
    setError("");
    setReceipt(null);
    try {
      const d =
        decision || decide(round.initial, { cost: round.cost }, balance);
      setDecision(d);
      setPhase("thinking");
      await pause(650);
      let tx = null;
      if (d.buy) {
        setPhase("paying");
        tx = await wallet.current.purchase({
          amountCents: round.cost,
          idempotencyKey: `${session.current}-${round.id}`,
        });
      }
      const result = settleRound({
        round,
        humanAnswer: choice,
        confidence,
        decision: d,
        receipt: tx,
        openingBalance: balance,
      });
      if (tx) {
        setReceipt(tx);
        setBalance(tx.balance);
        setPhase("evidence");
        await pause(950);
      }
      setResults((prev) =>
        prev.some((r) => r.id === result.id) ? prev : [...prev, result],
      );
      setPhase("reveal");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to complete this round",
      );
      setPhase("error");
    } finally {
      busy.current = false;
    }
  }
  function next() {
    if (phase !== "reveal" || busy.current) return;
    if (index === rounds.length - 1) {
      setPhase("summary");
      return;
    }
    setIndex(index + 1);
    setChoice(null);
    setConfidence(75);
    setDecision(null);
    setReceipt(null);
    setPhase("choose");
  }
  function restart() {
    if (busy.current) return;
    session.current = crypto.randomUUID();
    wallet.current = createMockWallet();
    setIndex(0);
    setChoice(null);
    setConfidence(75);
    setPhase("choose");
    setBalance(10);
    setResults([]);
    setDecision(null);
    setReceipt(null);
    setError("");
    mainRef.current?.focus();
  }
  return (
    <>
      <header>
        <div className="brand" aria-label="Human vs Agent">
          <span className="brand-mark">H/A</span>Human vs Agent
        </div>
        <div className="header-actions">
          <button className="text-button" onClick={() => setHelp(true)}>
            How to play
          </button>
          <span className="demo-badge">
            <i />
            Demo mode
          </span>
        </div>
      </header>
      <main ref={mainRef} tabIndex={-1}>
        <section className="intro">
          <h1>Your intuition. Its intelligence.</h1>
          <p>
            You have a brain. It has a wallet. Let’s see who needs a receipt.
          </p>
        </section>
        <nav className="progress" aria-label="Round progress">
          {rounds.map((r, i) => (
            <div
              key={r.id}
              className={
                i === index && !done
                  ? "active"
                  : i < index || done
                    ? "complete"
                    : ""
              }
              aria-current={i === index && !done ? "step" : undefined}
            >
              <span>
                {i < index || done ? (
                  <Check size={18} />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              <b>{r.category}</b>
            </div>
          ))}
        </nav>
        {done ? (
          <Summary results={results} onRestart={restart} balance={balance} />
        ) : (
          <>
            <section className="panel claim">
              <div className="eyeline">
                <span>ROUND 0{index + 1} / 03</span>
                <span>{round.category}</span>
              </div>
              <h2 ref={claimRef} tabIndex={-1}>
                {round.claim}
              </h2>
            </section>
            <div className="arena">
              <section className="panel player">
                <h2>You</h2>
                <small>HUMAN INTUITION · ZERO SUBSCRIPTION FEES</small>
                <div className="choices" role="group" aria-label="Your answer">
                  {[true, false].map((v) => (
                    <button
                      key={String(v)}
                      disabled={locked}
                      aria-pressed={choice === v}
                      className={choice === v ? "selected" : ""}
                      onClick={() => setChoice(v)}
                    >
                      {label(v)}
                      {choice === v && <Check size={17} />}
                    </button>
                  ))}
                </div>
                {!locked && (
                  <p className="choice-hint">
                    {choice === null
                      ? "Pick a side. The robot can wait."
                      : "Answer selected. How sure are you, really?"}
                  </p>
                )}
                <Confidence
                  value={confidence}
                  human
                  onChange={setConfidence}
                  disabled={locked}
                />
                {revealed ? (
                  <div
                    className={
                      "human-result " +
                      (choice === round.answer ? "correct" : "incorrect")
                    }
                  >
                    {choice === round.answer ? (
                      <Check size={20} />
                    ) : (
                      <X size={20} />
                    )}{" "}
                    {choice === round.answer
                      ? "Brain: 1. Myth: 0. +100 points"
                      : "Plot twist. New fact unlocked. +0 points"}
                  </div>
                ) : (
                  <button
                    className="primary"
                    disabled={choice === null || (locked && phase !== "error")}
                    onClick={play}
                  >
                    {phase === "error" ? (
                      <>
                        Retry safely <RotateCcw size={17} />
                      </>
                    ) : locked ? (
                      <>
                        <LoaderCircle className="spin" size={18} /> Answer
                        locked
                      </>
                    ) : (
                      <>
                        Lock in answer <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                )}
              </section>
              <section className="panel agent">
                <div className="between">
                  <h2>Agent</h2>
                  <span className="ai-mark">AI</span>
                </div>
                <small>SCRIPTED DEMO AGENT</small>
                <Confidence
                  value={
                    revealed && decision?.buy
                      ? round.finalConfidence
                      : round.initial.confidence
                  }
                />
                <div className="agent-status" aria-live="polite">
                  {phase === "choose" ? (
                    <>
                      <b>Take your time. I don’t pay rent.</b>
                      <p>My initial answer is preset. No peeking at yours.</p>
                    </>
                  ) : (
                    <>
                      <div className="status-heading">
                        {revealed ? (
                          <Check size={17} />
                        ) : (
                          <LoaderCircle size={17} className="spin" />
                        )}
                        <b>
                          {phase === "error"
                            ? "Round paused. No score recorded."
                            : phase === "thinking"
                              ? "Consulting my very tiny wallet…"
                              : phase === "paying"
                                ? "Confirming mock payment…"
                                : phase === "evidence"
                                  ? "Evidence unlocked. Updating answer…"
                                  : decision?.buy
                                    ? "Evidence purchased. Answer updated."
                                    : "No purchase. Feeling smug for free."}
                        </b>
                      </div>
                      <p>{decision?.reason}</p>
                      <div className="answer-trail">
                        Initial:{" "}
                        <b>
                          {label(round.initial.answer)} ·{" "}
                          {round.initial.confidence}%
                        </b>
                        {revealed && (
                          <>
                            <ArrowRight size={14} />
                            <b>
                              Final:{" "}
                              {label(
                                decision?.buy
                                  ? round.answer
                                  : round.initial.answer,
                              )}
                            </b>
                          </>
                        )}
                      </div>
                      {receipt && (
                        <code>
                          <Check size={12} /> Mock payment confirmed ·{" "}
                          {money(receipt.amountCents)} USDC
                        </code>
                      )}
                    </>
                  )}
                </div>
                <div className="wallet between">
                  <div>
                    <small>WALLET</small>
                    <strong>
                      {money(balance)} <span>USDC</span>
                    </strong>
                  </div>
                  <span>
                    <Wallet size={14} /> AVAILABLE BUDGET
                  </span>
                </div>
              </section>
            </div>
            {error && (
              <p role="alert" className="incorrect">
                {error} Your answer stays locked. Retry uses the same payment
                reference to prevent a second charge.
              </p>
            )}
            {revealed && (
              <section
                className="panel reveal"
                ref={revealRef}
                tabIndex={-1}
                aria-label="Round result and fact-check"
              >
                <div className="reveal-content">
                  <span className="truth-label">
                    {label(round.answer).toUpperCase()}
                  </span>
                  <h3>{factNotes[round.id].quip}</h3>
                  <p>{round.evidence}</p>
                  <FactCheck round={round} bought={decision?.buy} />
                </div>
                <button className="primary" onClick={next}>
                  {index === 2 ? "See final results" : "Next round"}
                  <ArrowRight size={18} />
                </button>
              </section>
            )}
            <Scoreboard stats={stats} />
          </>
        )}
        <footer>
          <span>Trust your brain. Occasionally ask for receipts.</span>
          <span>Scripted agent · Mock USDC · No real funds</span>
        </footer>
      </main>
      {help && <HelpDialog onClose={() => setHelp(false)} />}
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
