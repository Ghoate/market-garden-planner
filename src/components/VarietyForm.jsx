import React from "react";
import { COLORS, inp } from "../constants.js";
import { F } from "./FormField.jsx";
import { SowWindowPanel } from "./SowWindowPanel.jsx";
import {
  calcSowWindow,
  sowRisk,
  dayLengthHours,
  dailyGDD,
  PTU_OPT_HOURS,
} from "../engine.jsx";

export function VarietyForm({ form, setForm, editing, onSave, onCancel }) {
  var calcWin =
    form.gddToMaturity && form.gddBase
      ? calcSowWindow(form, new Date().getFullYear(), null)
      : { earliest: null, latest: null, springLatest: null, fallEarliest: null };

  var showCalc = !!(calcWin.earliest || calcWin.latest);

  function predictHarvest(sowDate) {
    if (!sowDate || !form.gddToMaturity || !form.gddBase) return null;
    var dtm = +form.daysToMaturity || 21;
    var acc = 0;
    var days = 0;
    var cur = new Date(sowDate);
    while (acc < form.gddToMaturity && days < 180) {
      var dl = dayLengthHours(cur);
      var gdd = dailyGDD(cur, form.gddBase || 40);
      acc += gdd * (Math.min(dl, PTU_OPT_HOURS) / PTU_OPT_HOURS);
      days++;
      cur.setDate(cur.getDate() + 1);
    }
    if (days >= 180) return null;
    var actualDays = Math.max(days, dtm);
    var h = new Date(sowDate);
    h.setDate(h.getDate() + actualDays);
    return h;
  }

  var springHarvest = predictHarvest(calcWin.earliest);
  var fallHarvest = predictHarvest(calcWin.latest);
  var springRisk = calcWin.earliest
    ? sowRisk(
        calcWin.earliest.toISOString().slice(0, 10),
        springHarvest
          ? Math.round((springHarvest - calcWin.earliest) / 86400000)
          : 60
      )
    : null;
  var fallRisk = calcWin.latest
    ? sowRisk(
        calcWin.latest.toISOString().slice(0, 10),
        fallHarvest
          ? Math.round((fallHarvest - calcWin.latest) / 86400000)
          : 40
      )
    : null;
  var springDTM =
    springHarvest && calcWin.earliest
      ? Math.round((springHarvest - calcWin.earliest) / 86400000)
      : null;
  var fallDTM =
    fallHarvest && calcWin.latest
      ? Math.round((fallHarvest - calcWin.latest) / 86400000)
      : null;

  function upd(key, val) {
    setForm(Object.assign({}, form, { [key]: val }));
  }

  return (
    <div
      style={{
        background: COLORS.bark,
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
        border: "1px solid " + COLORS.clay,
      }}
    >
      <h3
        style={{
          margin: "0 0 16px",
          fontFamily: "'Inter', sans-serif",
          color: COLORS.straw,
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        {editing ? "Edit" : "New"} Variety
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <F label="Name">
          <input style={inp} value={form.name || ""} onChange={function (e) { upd("name", e.target.value); }} placeholder="e.g. Astro Arugula" />
        </F>
        <F label="Crop Type">
          <input style={inp} value={form.cropType || ""} onChange={function (e) { upd("cropType", e.target.value); }} placeholder="Greens" />
        </F>
        <F label="Sow Method">
          <select style={inp} value={form.sowMethod || "Direct"} onChange={function (e) { upd("sowMethod", e.target.value); }}>
            <option>Direct</option>
            <option>Transplant</option>
            <option>Either</option>
          </select>
        </F>
        <F label="Days to Maturity">
          <input style={inp} type="number" value={form.daysToMaturity || ""} onChange={function (e) { upd("daysToMaturity", +e.target.value); }} />
        </F>
        <F label="PTU Target">
          <input style={inp} type="number" value={form.gddToMaturity || ""} onChange={function (e) { upd("gddToMaturity", +e.target.value); }} placeholder="299" />
        </F>
        <F label="GDD Base">
          <input style={inp} type="number" value={form.gddBase || 40} onChange={function (e) { upd("gddBase", +e.target.value); }} />
        </F>
        <F label="Bed Prep (weeks)">
          <input style={inp} type="number" value={form.bedPrepWeeks || 0} onChange={function (e) { upd("bedPrepWeeks", +e.target.value); }} />
        </F>
        <F label="Harvest Window (weeks)">
          <input style={inp} type="number" value={form.harvestWindowWeeks || ""} onChange={function (e) { upd("harvestWindowWeeks", +e.target.value); }} />
        </F>
        <F label="Field Hold (weeks)">
          <input style={inp} type="number" value={form.fieldHoldWeeks || 0} onChange={function (e) { upd("fieldHoldWeeks", +e.target.value); }} placeholder="0" />
        </F>
        <F label="Field Hold Harvests">
          <input style={inp} type="number" value={form.fieldHoldHarvests || 1} onChange={function (e) { upd("fieldHoldHarvests", +e.target.value); }} placeholder="1" />
        </F>
        <F label="Harvest Type">
          <select style={inp} value={form.harvestType || "whole"} onChange={function (e) { upd("harvestType", e.target.value); }}>
            <option value="whole">Whole</option>
            <option value="cutAndComeAgain">Cut and Come Again</option>
          </select>
        </F>
        <F label="Cuts">
          <input style={inp} type="number" value={form.cuts || 1} onChange={function (e) { upd("cuts", +e.target.value); }} />
        </F>
        <F label="Regrowth (weeks)">
          <input style={inp} type="number" value={form.regrowthWeeks || 0} onChange={function (e) { upd("regrowthWeeks", +e.target.value); }} />
        </F>
        <F label="Yield per 25ft (lbs)">
          <input style={inp} type="number" value={form.yieldPer25ft || ""} onChange={function (e) { upd("yieldPer25ft", +e.target.value); }} />
        </F>
        <F label="Unit Weight (lbs)">
          <input style={inp} type="number" value={form.unitWeight || ""} onChange={function (e) { upd("unitWeight", +e.target.value); }} />
        </F>
        <F label="Price per Unit ($)">
          <input style={inp} type="number" value={form.pricePerUnit || ""} onChange={function (e) { upd("pricePerUnit", +e.target.value); }} />
        </F>
        <F label="Required Tag">
          <input style={inp} value={form.requiredTag || ""} onChange={function (e) { upd("requiredTag", e.target.value); }} placeholder="e.g. wf, gh" />
        </F>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <F label="Seeder Notes">
          <input style={inp} value={form.seeder || ""} onChange={function (e) { upd("seeder", e.target.value); }} />
        </F>
        <F label="Bed Prep Task">
          <input style={inp} value={form.bedPrepTask || ""} onChange={function (e) { upd("bedPrepTask", e.target.value); }} />
        </F>
        <F label="Planning Buffer (days)">
          <input style={inp} type="number" value={form.planningBufferDays || 3} onChange={function (e) { upd("planningBufferDays", +e.target.value); }} />
        </F>
        <F label="Harvest Notes">
          <input style={inp} value={form.harvestNotes || ""} onChange={function (e) { upd("harvestNotes", e.target.value); }} />
        </F>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onSave}
          style={{ background: COLORS.leaf, border: "none", borderRadius: 6, color: COLORS.white, fontFamily: "'DM Mono', monospace", fontSize: 13, padding: "8px 20px", cursor: "pointer" }}
        >
          SAVE
        </button>
        <button
          onClick={onCancel}
          style={{ background: "transparent", border: "1px solid " + COLORS.clay, borderRadius: 6, color: COLORS.muted, fontFamily: "'DM Mono', monospace", fontSize: 13, padding: "8px 20px", cursor: "pointer" }}
        >
          CANCEL
        </button>
      </div>

      {showCalc && (
        <SowWindowPanel
          calcWin={calcWin}
          springHarvest={springHarvest}
          fallHarvest={fallHarvest}
          springRisk={springRisk}
          fallRisk={fallRisk}
          springDTM={springDTM}
          fallDTM={fallDTM}
        />
      )}
    </div>
  );
}
