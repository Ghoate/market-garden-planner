import React from "react";
import { COLORS } from "../constants.js";
import { TagPill } from "./TagPill.jsx";
import { calcSowWindow } from "../engine.jsx";

export function VarietyCard({ v, onEdit, onRemove }) {
  var curYear = new Date().getFullYear();
  var win = calcSowWindow(v, curYear, null);
  var fmtD = function (d) {
    return d
      ? d.toLocaleDateString("en-CA", { month: "short", day: "numeric" })
      : "?";
  };
  var sowLabel =
    win.earliest || win.latest
      ? "sow " + fmtD(win.earliest) + " - " + fmtD(win.latest)
      : null;

  return (
    <div
      style={{
        background: COLORS.bark,
        borderRadius: 8,
        padding: "14px 16px",
        border: "1px solid " + COLORS.clay + "30",
        cursor: "pointer",
      }}
      onClick={function () {
        onEdit(v);
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              color: COLORS.cream,
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            {v.name}
          </span>
          {v.cropType && (
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: COLORS.muted,
              }}
            >
              {v.cropType}
            </span>
          )}
          {v.requiredTag && <TagPill tag={v.requiredTag} />}
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: COLORS.sprout,
            }}
          >
            {v.daysToMaturity}d DTM
          </span>
          {v.bedPrepWeeks > 0 && (
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: COLORS.harvest,
              }}
            >
              {v.bedPrepWeeks}w prep
            </span>
          )}
          {v.pricePerUnit && (
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: COLORS.harvestLight,
              }}
            >
              ${v.pricePerUnit}/{v.unitWeight || 1}lb
            </span>
          )}
          {sowLabel && (
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                color: COLORS.frost,
                background: COLORS.opportunity,
                border: "1px solid " + COLORS.frost + "40",
                borderRadius: 4,
                padding: "1px 6px",
              }}
            >
              {sowLabel}
            </span>
          )}
        </div>
        <button
          onClick={function (e) {
            e.stopPropagation();
            onRemove(v.id);
          }}
          style={{
            background: "transparent",
            border: "none",
            color: COLORS.muted,
            cursor: "pointer",
            fontSize: 16,
            padding: "0 4px",
          }}
        >
          x
        </button>
      </div>
    </div>
  );
}
