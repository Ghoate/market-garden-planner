export var COLORS = {
  soil: "#0F1318",
  bark: "#1A2028",
  clay: "#2E3A4A",
  straw: "#8FA8C0",
  cream: "#E8EEF4",
  leaf: "#2D7D4F",
  sprout: "#4CAF7D",
  harvest: "#C17B2A",
  harvestLight: "#E8A83A",
  muted: "#5A7080",
  white: "#F0F5FA",
  opportunity: "#0D2137",
  frost: "#4A90D9",
  frostWarn: "#E05A35",
};

export var STAGE = {
  prep:    { bg:"#1E2D1A", border:"#3A5C30" },
  indoorS: { bg:"#0D2137", border:"#1A5C8A" },
  grow:    { bg:"#1A3A28", border:"#2D6B47" },
  sowTP:   { bg:"#1A4A28", border:"#4CAF7D" },
  harvest: { bg:"#3A2208", border:"#C17B2A" },
};

export var SOW_METHODS = ["Direct","Transplant","Either"];

export var TAG_PALETTE = [
  { bg:"#1A2A3A", border:"#4A7AAD", label:"#7AADD4" },
  { bg:"#3A2A10", border:"#AD7A2A", label:"#D4A830" },
  { bg:"#1A3A2A", border:"#3D8A5C", label:"#6ABD8A" },
  { bg:"#2A1A3A", border:"#7A4AAD", label:"#B47ADD" },
  { bg:"#3A1A1A", border:"#AD4A4A", label:"#DD7A7A" },
  { bg:"#1A2A10", border:"#4A7A2A", label:"#7AAD5C" },
];

export function tagColor(tag) {
  var idx = Math.abs(tag.split("").reduce(function(a,c){return a+c.charCodeAt(0);},0)) % TAG_PALETTE.length;
  return TAG_PALETTE[idx];
}

export var inp = { background: COLORS.bark, border: "1px solid " + COLORS.clay, borderRadius: 4, color: COLORS.cream, fontFamily: "'DM Mono', monospace", fontSize: 13, padding: "5px 8px", outline: "none", width: "100%", boxSizing: "border-box" };
