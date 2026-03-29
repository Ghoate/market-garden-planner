import React from "react";
import { COLORS } from "../constants.js";

export function F(props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {props.label}
      </label>
      {props.children}
    </div>
  );
}