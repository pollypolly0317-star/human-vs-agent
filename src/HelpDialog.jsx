import React, { useEffect, useRef } from "react";
import { X, ArrowRight } from "lucide-react";
export function HelpDialog({ onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const element = dialog.current;
    element.showModal();
    return () => {
      element.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="panel modal"
      aria-labelledby="help-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <button
        autoFocus
        className="close"
        aria-label="Close instructions"
        onClick={onClose}
      >
        <X />
      </button>
      <h2 id="help-title">Three rounds. Two egos.</h2>
      <p>
        You bring your brain. The agent brings ten pretend cents. Let’s see
        which goes further.
      </p>
      <ol>
        <li>
          Choose True or False, then set your confidence. 50% means a coin flip;
          100% means certain.
        </li>
        <li>
          Lock your answer. Correct answers earn 100 points; confidence does not
          change your score.
        </li>
        <li>
          Below 80% confidence, the scripted agent buys evidence if its wallet
          can cover it.
        </li>
        <li>
          Read the fact-check, compare answers, and keep the useful skepticism.
        </li>
      </ol>
      <p>
        This is a scripted demonstration, not a live model benchmark. Confidence
        values are preset. The sources are free to read; prices simulate an
        evidence service, not fees charged by those publishers.
      </p>
      <p>
        No real funds or blockchain transactions. Refreshing starts a new game.
      </p>
      <button className="primary" onClick={onClose}>
        Let’s play
        <ArrowRight size={17} />
      </button>
    </dialog>
  );
}
