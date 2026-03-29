import React from "react";
import { COLORS } from "../constants.js";

export function SowWindowPanel({
  calcWin,
  springHarvest,
  fallHarvest,
  springRisk,
  fallRisk,
  springDTM,
  fallDTM,
}) {
  var fmtDate = function (d) {
    return d
      ? d.toLocaleDateString("en-CA", { month: "long", day: "numeric" })
      : "unknown";
  };

  return (
    <div
      style={{
        marginTop: 16,
        padding: 14,
        background: COLORS.soil,
        borderRadius: 8,
        border: "1px solid " + COLORS.clay + "30",
      }}
    >
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          color: COLORS.muted,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 12,
        }}
      >
        Predicted Seed Sowing Windows (single harvest, no row cover) BETA FEATURE
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Spring */}
        <div
          style={{
            padding: 10,
            background: COLORS.bark,
            borderRadius: 6,
            border: "1px solid " + COLORS.leaf + "30",
          }}
        >
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: COLORS.leaf,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            Spring
          </div>
          <div style={{ marginBottom: 6 }}>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                color: COLORS.muted,
              }}
            >
              Earliest sow
            </div>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 13,
                color: COLORS.cream,
                fontWeight: 500,
              }}
            >
              {fmtDate(calcWin.earliest)}
            </div>
          </div>
          <div style={{ marginBottom: 6 }}>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                color: COLORS.muted,
              }}
            >
              Predicted harvest
            </div>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 13,
                color: COLORS.harvestLight,
                fontWeight: 500,
              }}
            >
              {fmtDate(springHarvest)}
            </div>
          </div>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              color: COLORS.muted,
              marginTop: 4,
              fontStyle: "italic",
            }}
          >
            {springDTM}d in bed · First date soil hits germ min (40°F)
          </div>
        </div>

        {/* Fall */}
        <div
          style={{
            padding: 10,
            background: COLORS.bark,
            borderRadius: 6,
            border: "1px solid " + COLORS.frost + "30",
          }}
        >
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: COLORS.frost,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            Fall
          </div>
          <div style={{ marginBottom: 6 }}>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                color: COLORS.muted,
              }}
            >
              Latest sow
            </div>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 13,
                color: COLORS.cream,
                fontWeight: 500,
              }}
            >
              {fmtDate(calcWin.latest)}
            </div>
          </div>
          <div style={{ marginBottom: 6 }}>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                color: COLORS.muted,
              }}
            >
              Predicted harvest
            </div>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 13,
                color: COLORS.harvestLight,
                fontWeight: 500,
              }}
            >
              {fmtDate(fallHarvest)}
            </div>
          </div>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              color: COLORS.muted,
              marginTop: 4,
              fontStyle: "italic",
            }}
          >
            {fallDTM}d in bed · Last date before day length drops below 10h
          </div>
        </div>
      </div>
    </div>
  );
}
