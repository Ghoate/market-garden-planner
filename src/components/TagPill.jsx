import React from "react";
import { tagColor } from "../constants.js";

export function TagPill({ tag, onRemove }) {
  var tc = tagColor(tag);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: tc.bg, border: `1px solid ${tc.border}`, borderRadius: 10, padding: "2px 8px", fontFamily: "'DM Mono', monospace", fontSize: 10, color: tc.label }}>
      {tag}
      {onRemove && (
        <button onClick={onRemove} style={{ background: "none", border: "none", color: tc.label, cursor: "pointer", fontSize: 11, padding: 0, lineHeight: 1, opacity: 0.7 }}>
          x
        </button>
      )}
    </span>
  );
}