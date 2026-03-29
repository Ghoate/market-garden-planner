import React, { useState } from "react";
import { COLORS } from "../constants.js";
import { EMPTY_VARIETY } from "../models/varieties.js";
import { generateId } from "../engine.jsx";
import { VarietyForm } from "../components/VarietyForm.jsx";
import { VarietyCard } from "../components/VarietyCard.jsx";

export function VarietiesTab({ varieties, setVarieties }) {
  var [editing, setEditing] = useState(null);
  var [form, setForm] = useState({});
  var [showForm, setShowForm] = useState(false);

  function openNew() {
    setEditing(null);
    setForm(Object.assign({}, EMPTY_VARIETY));
    setShowForm(true);
  }

  function openEdit(v) {
    setEditing(v.id);
    setForm(Object.assign({}, v));
    setShowForm(true);
  }

  function save() {
    if (!form.name) return;
    if (editing) {
      setVarieties(
        varieties.map(function (v) {
          return v.id === editing ? Object.assign({}, v, form) : v;
        })
      );
    } else {
      setVarieties(
        varieties.concat([
          Object.assign({}, form, { id: generateId(varieties) }),
        ])
      );
    }
    setShowForm(false);
  }

  function remove(id) {
    setVarieties(varieties.filter(function (v) { return v.id !== id; }));
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: "'Inter', sans-serif",
            color: COLORS.cream,
            fontSize: 26,
            fontWeight: 700,
          }}
        >
          Varieties
        </h2>
        <button
          onClick={openNew}
          style={{
            background: COLORS.leaf,
            border: "none",
            borderRadius: 6,
            color: COLORS.white,
            fontFamily: "'DM Mono', monospace",
            fontSize: 13,
            padding: "8px 18px",
            cursor: "pointer",
          }}
        >
          + ADD VARIETY
        </button>
      </div>

      {showForm && (
        <VarietyForm
          form={form}
          setForm={setForm}
          editing={editing}
          onSave={save}
          onCancel={function () { setShowForm(false); }}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {varieties.map(function (v) {
          return (
            <VarietyCard
              key={v.id}
              v={v}
              onEdit={openEdit}
              onRemove={remove}
            />
          );
        })}
        {varieties.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: COLORS.muted,
              fontFamily: "'DM Mono', monospace",
              fontSize: 14,
            }}
          >
            No varieties yet. Click + ADD VARIETY.
          </div>
        )}
      </div>
    </div>
  );
}
