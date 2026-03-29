// user-config.js
// User configuration data — seeded with current user values (Langley WA).
// In production this will be fetched from the database per user.

// ─── Location ────────────────────────────────────────────────────────────────

export var LOCATION = {
  farmName:    "My Market Garden",
  location:    "Langley WA",
  zipCode:     "98260",
  latitude:    48.03,       // degrees N — drives daylight/photoperiod calculation
  longitude:   -122.55,     // degrees W — not used in calculations yet
  elevationFt: 50,          // feet — not used in calculations yet
};

// Derived — latitude in radians for trig calculations
export var LAT_RAD = LOCATION.latitude * Math.PI / 180;

// ─── Climate ─────────────────────────────────────────────────────────────────
// Monthly normals [hi°F, lo°F]
// TODO: replace with live NOAA API lookup by zip code

export var CLIMATE = {
  1:  [46, 36],
  2:  [49, 37],
  3:  [52, 39],
  4:  [57, 42],
  5:  [63, 47],
  6:  [68, 52],
  7:  [70, 55],
  8:  [70, 56],
  9:  [66, 51],
  10: [58, 45],
  11: [50, 40],
  12: [46, 37],
};

// ─── Frost & Soil Dates ───────────────────────────────────────────────────────

export var FROST = {
  lastFrost:        "04-15",
  firstFrost:       "11-01",
  soilWorkableDate: "2026-02-20",
  minSoilTempDate:  "2026-03-01",
};

// ─── Market Season ────────────────────────────────────────────────────────────

export var SEASON = {
  firstMarket:  "2026-05-14",
  lastMarket:   "2026-10-25",
  firstHarvest: "2026-05-14",
  lastHarvest:  "2026-10-25",
};

// ─── Farm / Bed Dimensions ────────────────────────────────────────────────────

export var FARM = {
  bedLengthFt: 8,
  bedWidthIn:  30,
  bedGapFt:    0.5,
};

// ─── Beds ─────────────────────────────────────────────────────────────────────
// Your specific beds — added here as your starting data.

export var BEDS = [
  { id:1,  name:"WF 1",     lengthFt:8, widthIn:30, tag:"wf", availFrom:"", availTo:"" },
  { id:2,  name:"WF 2",     lengthFt:8, widthIn:30, tag:"wf", availFrom:"", availTo:"" },
  { id:3,  name:"WF 3",     lengthFt:8, widthIn:30, tag:"wf", availFrom:"", availTo:"" },
  { id:4,  name:"Bed 1",    lengthFt:8, widthIn:30, tag:"",   availFrom:"", availTo:"" },
  { id:5,  name:"Bed 2",    lengthFt:8, widthIn:30, tag:"",   availFrom:"", availTo:"" },
  { id:6,  name:"Bed 3",    lengthFt:8, widthIn:30, tag:"",   availFrom:"", availTo:"" },
  { id:7,  name:"Bed 4",    lengthFt:8, widthIn:30, tag:"",   availFrom:"", availTo:"" },
  { id:8,  name:"Bed 5",    lengthFt:8, widthIn:30, tag:"",   availFrom:"", availTo:"" },
  { id:9,  name:"Bed 6",    lengthFt:8, widthIn:30, tag:"",   availFrom:"", availTo:"" },
  { id:10, name:"Bed 7",    lengthFt:8, widthIn:30, tag:"",   availFrom:"", availTo:"" },
  { id:11, name:"Bed 8",    lengthFt:8, widthIn:30, tag:"",   availFrom:"", availTo:"" },
  { id:12, name:"Bed 9",    lengthFt:8, widthIn:30, tag:"",   availFrom:"", availTo:"" },
  { id:13, name:"Bed 10",   lengthFt:8, widthIn:30, tag:"",   availFrom:"", availTo:"" },
  { id:14, name:"Bed 11",   lengthFt:8, widthIn:30, tag:"",   availFrom:"", availTo:"" },
  { id:15, name:"Bed 12",   lengthFt:8, widthIn:30, tag:"",   availFrom:"", availTo:"" },
  { id:16, name:"Bed 13",   lengthFt:8, widthIn:30, tag:"",   availFrom:"", availTo:"" },
  { id:17, name:"Narrow 1", lengthFt:8, widthIn:24, tag:"",   availFrom:"", availTo:"" },
  { id:18, name:"Narrow 2", lengthFt:8, widthIn:24, tag:"",   availFrom:"", availTo:"" },
  { id:19, name:"Strip 1",  lengthFt:8, widthIn:12, tag:"",   availFrom:"", availTo:"" },
  { id:20, name:"Strip 2",  lengthFt:8, widthIn:12, tag:"",   availFrom:"", availTo:"" },
  { id:21, name:"Strip 3",  lengthFt:8, widthIn:12, tag:"",   availFrom:"", availTo:"" },
  { id:22, name:"Strip 4",  lengthFt:8, widthIn:12, tag:"",   availFrom:"", availTo:"" },
  { id:23, name:"Strip 5",  lengthFt:8, widthIn:12, tag:"",   availFrom:"", availTo:"" },
  { id:24, name:"Strip 6",  lengthFt:8, widthIn:12, tag:"",   availFrom:"", availTo:"" },
  { id:25, name:"Strip 7",  lengthFt:8, widthIn:12, tag:"",   availFrom:"", availTo:"" },
];

// ─── Composed config object ───────────────────────────────────────────────────
// Single object used to initialize the app's config state.

export var CONFIG = Object.assign(
  {},
  LOCATION,
  FROST,
  SEASON,
  FARM,
  { trimCalendar: true }
);


export var defaultVarieties = [
  { id: 4, fieldHoldWeeks: 0, fieldHoldHarvests: 1, name: "Astro Arugula (Baby)", cropType: "Greens", daysToGermination: 5, daysToMaturity: 21, transplantLeadWeeks: 0, harvestWindowWeeks: 1, bedPrepWeeks: 2, grownOnPlastic: false, sowMethod: "Direct", gddBase: 40, gddToMaturity: 299, frostHardy: true, requiredTag: "", harvestType: "cutAndComeAgain", cuts: 2, regrowthWeeks: 1, yieldPer25ft: 20, unitWeight: 0.25, pricePerUnit: 2.5, seedsPerFoot: 20, rowSpacingIn: 4, rowsPerBed: 9, seeder: "Jang YYJ24 -- gears 14F/9R, brush down", bedPrepTask: "Stale seedbed 21d, flame weed at cotyledon", planningBufferDays: 3, harvestNotes: "Cut 1\" above soil. Wash gently max 4 min. 0.25lb per bag. Sell within 3 days.", trayType: "", seedsPerCell: "", germTempMin: 40, germTempIdeal: 55, germTempMax: 75 },
  { id: 5, fieldHoldWeeks: 0, fieldHoldHarvests: 1, name: "Allstar Gourmet Lettuce Mix (Baby)", cropType: "Lettuce", daysToGermination: 6, daysToMaturity: 28, transplantLeadWeeks: 0, harvestWindowWeeks: 1, bedPrepWeeks: 2, grownOnPlastic: false, sowMethod: "Direct", gddBase: 40, gddToMaturity: 400, frostHardy: true, requiredTag: "", harvestType: "cutAndComeAgain", cuts: 2, regrowthWeeks: 2, yieldPer25ft: 40, unitWeight: 0.25, pricePerUnit: 3.0, seedsPerFoot: 24, rowSpacingIn: 4, rowsPerBed: 9, seeder: "Jang YYJ24 -- gears 14F/9R, brush down", bedPrepTask: "Stale seedbed 21d, flame weed at cotyledon", planningBufferDays: 3, harvestNotes: "Cut 1\" above soil. Wash gently max 3 min. 0.25lb per bag. Sell within 4 days.", trayType: "", seedsPerCell: "", germTempMin: 40, germTempIdeal: 55, germTempMax: 75 },
  { id: 7, fieldHoldWeeks: 1, fieldHoldHarvests: 1, name: "Salanova Premier (Baby Leaf)", cropType: "Lettuce", daysToGermination: 5, daysToMaturity: 55, transplantLeadWeeks: 3, harvestWindowWeeks: 1, bedPrepWeeks: 1, grownOnPlastic: false, sowMethod: "Transplant", gddBase: 40, gddToMaturity: 550, frostHardy: true, requiredTag: "", harvestType: "cutAndComeAgain", cuts: 2, regrowthWeeks: 3, yieldPer25ft: 35, unitWeight: 0.5, pricePerUnit: 4.0, seedsPerFoot: 0, rowSpacingIn: 10, rowsPerBed: 3, seeder: "", bedPrepTask: "Transplant 10in apart in 3 rows", planningBufferDays: 5, harvestNotes: "Single base cut, leaves fall into bag. Rinse gently. 0.5lb per bag. 14-day shelf life.", trayType: "128-cell", seedsPerCell: "1", germTempMin: 40, germTempIdeal: 60, germTempMax: 70 },
  { id: 8, fieldHoldWeeks: 2, fieldHoldHarvests: 2, name: "Salanova Premier (Head)", cropType: "Lettuce", daysToGermination: 5, daysToMaturity: 55, transplantLeadWeeks: 3, harvestWindowWeeks: 1, bedPrepWeeks: 1, grownOnPlastic: false, sowMethod: "Transplant", gddBase: 40, gddToMaturity: 550, frostHardy: true, requiredTag: "", harvestType: "whole", cuts: 1, regrowthWeeks: 0, yieldPer25ft: 35, unitWeight: 0.5, pricePerUnit: 4.0, seedsPerFoot: 0, rowSpacingIn: 10, rowsPerBed: 3, seeder: "", bedPrepTask: "Transplant 10in apart in 3 rows", planningBufferDays: 5, harvestNotes: "Cut at base, whole head. Rinse gently. 14-day shelf life.", trayType: "128-cell", seedsPerCell: "1", germTempMin: 40, germTempIdeal: 60, germTempMax: 70 },
  { id: 6, fieldHoldWeeks: 0, fieldHoldHarvests: 1, name: "Supersweet 100 Cherry Tomato", cropType: "Tomato", daysToGermination: 6, daysToMaturity: 65, transplantLeadWeeks: 6, harvestWindowWeeks: 0, bedPrepWeeks: 1, grownOnPlastic: true, sowMethod: "Transplant", gddBase: 50, gddToMaturity: 1150, frostHardy: false, requiredTag: "", harvestType: "whole", cuts: 1, regrowthWeeks: 0, yieldPer25ft: 30, unitWeight: 1, pricePerUnit: 5.0, seedsPerFoot: 0, rowSpacingIn: 24, rowsPerBed: 1, seeder: "", bedPrepTask: "Plastic mulch, drip tape, stake or string trellis", planningBufferDays: 7, harvestNotes: "Pick clusters 80% red. Handle gently. Store 55-60F. Sell within 5 days.", trayType: "50-cell", seedsPerCell: "1", germTempMin: 60, germTempIdeal: 75, germTempMax: 85 },
{
  id: 9,
  fieldHoldWeeks: 0,
  fieldHoldHarvests: 1,
  name: "French Breakfast Radish",
  cropType: "Radish",
  daysToGermination: 4,
  daysToMaturity: 25,
  transplantLeadWeeks: 0,
  harvestWindowWeeks: 1,
  bedPrepWeeks: 1,
  grownOnPlastic: false,
  sowMethod: "Direct",
  gddBase: 40,
  gddToMaturity: 350,
  frostHardy: true,
  requiredTag: "",
  harvestType: "whole",
  cuts: 1,
  regrowthWeeks: 0,
  yieldPer25ft: 15,
  unitWeight: 0.5,
  pricePerUnit: 3.0,
  seedsPerFoot: 35,
  rowSpacingIn: 3,
  rowsPerBed: 9,
  seeder: "Jang YYJ24",
  bedPrepTask: "Loose, friable soil. Float row cover at sowing for flea beetle control.",
  planningBufferDays: 2,
  harvestNotes: "Harvest at 3\" length. Bunch, hydrocool, refrigerate. Sell within 5 days.",
  trayType: "",
  seedsPerCell: "",
  germTempMin: 40,
  germTempIdeal: 60,
  germTempMax: 75,
}

];