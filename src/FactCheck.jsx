import React from "react";
import { ExternalLink } from "lucide-react";
import { factNotes } from "./engine";
export function FactCheck({ round, bought }) {
  const note = factNotes[round.id];
  return (
    <div className="fact-check">
      <div className="between fact-heading">
        <strong>Fact-check receipt</strong>
        <span>{note.type}</span>
      </div>
      <a href={round.url} target="_blank" rel="noopener noreferrer">
        {round.source}
        <ExternalLink size={13} />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      <p>{note.nuance}</p>
      <details>
        <summary>Why trust this source?</summary>
        <p>
          This claim was checked against the linked publisher’s own explanation
          on {note.checked}. This is a curated fact-check, not a fresh web
          search. Open the source to inspect the context.
        </p>
        <p>
          {bought
            ? "The mock payment represents an evidence service. "
            : "No evidence purchase was needed this round. "}
          The original source is free to read; the publisher did not charge this
          demo fee.
        </p>
      </details>
    </div>
  );
}
