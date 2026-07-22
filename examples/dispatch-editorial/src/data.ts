// Mock editorial data for "Dispatch," a data-journalism magazine.
// Every number is a plausible journalistic invention, not a sourced figure.
// Kept in one module so charts across views share the same seeded facts.

/* ============================================================================
   FEATURE — "The Bitter Arithmetic of a Warming Cup" (coffee & climate)
   ========================================================================== */

// ICE arabica futures, monthly close in US cents per pound, 18 months.
export const futuresSeries: number[] = [
  168, 172, 165, 178, 190, 187, 203, 221, 214, 232, 248, 255, 241, 263, 288, 301, 316, 342,
];

// The spring run-up only — woven into a sentence as a tiny sparkline.
export const springRunUp: number[] = [241, 263, 288, 301, 316, 342];

// Year-over-year price comparison for the inline Delta (c/lb).
export const priceNow = 342;
export const priceYearAgo = 214;

// Signed YoY change in the retail bag index, for the inline TrendArrow.
export const retailYoY = 0.19;

// Brazil's annual harvest swing, percent change vs the prior crop year.
export const harvestSwing: number[] = [4, -2, 6, -3, -9, -5];

// Seasonal rainfall anomaly (mm below the 30-year normal) across 46 stations
// in Brazil's coffee belt — raw observations, binned by the histogram.
export const rainfallAnomaly: number[] = [
  -420, -380, -510, -290, -340, -470, -230, -560, -410, -300, -390, -480, -260, -350, -440, -520,
  -310, -370, -430, -280, -500, -360, -450, -240, -400, -330, -490, -270, -410, -380, -540, -320,
  -460, -250, -420, -350, -470, -300, -390, -410, -530, -290, -440, -360, -480, -330,
];

// The psychological price ceiling the market kept breaching (c/lb).
export const priceCeiling = 300;
// Index of the month the ceiling was first breached (0-based into futuresSeries).
export const breachIndex = 15;

// Stock drawdown across the spring, a tiny bar strip in prose (weeks of cover).
export const stockCover: number[] = [11, 10, 10, 9, 8, 7, 6, 6];

// Rainfall by growing region: 30-year normal vs the 2025 season (mm).
export const rainfallByRegion = [
  { label: "Minas Gerais", from: 1420, to: 980 },
  { label: "Espírito Santo", from: 1180, to: 870 },
  { label: "Sul de Minas", from: 1350, to: 1010 },
  { label: "Central Highlands", from: 1980, to: 1490 },
];

// Producing-country yields, bags per hectare, 2015 vs 2025.
export const yieldsByCountry = [
  { label: "Brazil", from: 28, to: 22 },
  { label: "Vietnam", from: 41, to: 33 },
  { label: "Colombia", from: 19, to: 26 },
  { label: "Ethiopia", from: 7, to: 8 },
  { label: "Honduras", from: 16, to: 13 },
];

// Where the beans go: destination share of green-coffee exports, percent.
export const exportDestinations = [
  { label: "European Union", value: 41 },
  { label: "United States", value: 24 },
  { label: "Japan", value: 11 },
  { label: "Canada", value: 6 },
  { label: "Other", value: 18 },
];

/* ============================================================================
   SECOND STORY — "The Line That Never Sleeps" (a city's overnight transit)
   ========================================================================== */

// Average overnight boardings, in thousands, month by month across the pilot.
export const overnightRidership: number[] = [
  4.2, 5.1, 6.8, 7.3, 8.9, 9.4, 11.2, 12.6, 13.1, 14.8, 16.2, 17.9,
];

// Cost to move one overnight rider, dollars: projected vs realized.
export const costPerRiderProjected = 4.1;
export const costPerRiderNow = 2.85;

// Fare-evasion rate change year over year (signed), for the inline TrendArrow.
export const fareEvasionYoY = -0.12;

// On-time performance streak, night by night — win/loss against the 5-min bar.
export const onTimeNights: number[] = [1, 1, -1, 1, 1, 1, -1, 1, 1, 1, 1, -1];

// Weekly overnight incidents reported, a small down-trending strip in prose.
export const incidentsWeekly: number[] = [14, 12, 13, 9, 10, 7, 6, 5];

// Operating budget, two levels, in millions of dollars. Parent = program area,
// children = line items. PartitionStrip reads share of the whole.
export const budgetComposition = [
  {
    label: "Operations",
    children: [
      { label: "Operators", value: 14.2 },
      { label: "Maintenance", value: 6.1 },
      { label: "Security", value: 4.4 },
      { label: "Cleaning", value: 2.3 },
    ],
  },
  {
    label: "Capital",
    children: [
      { label: "Rolling stock", value: 7.8 },
      { label: "Stations", value: 3.6 },
      { label: "Signals", value: 2.9 },
    ],
  },
  {
    label: "Overhead",
    children: [
      { label: "Admin", value: 2.1 },
      { label: "Insurance", value: 1.5 },
    ],
  },
];

// Spend by district: budgeted (ref) vs actual (value), in millions. Under
// budget is the good outcome, so `positive="down"` on the chart.
export const districtSpend = [
  { label: "Downtown", value: 11.5, ref: 12.1 },
  { label: "Riverside", value: 8.4, ref: 7.9 },
  { label: "Northgate", value: 6.2, ref: 6.8 },
  { label: "Eastpark", value: 5.3, ref: 5.0 },
  { label: "Harbor", value: 3.7, ref: 4.1 },
];

// Reader poll, ordered most-negative → most-positive, share of respondents.
// "Was the overnight line worth the cost?" (n = 2,140). Middle = neutral.
export const readerPoll = [
  { label: "Strongly oppose", value: 8 },
  { label: "Oppose", value: 14 },
  { label: "No opinion", value: 21 },
  { label: "Support", value: 33 },
  { label: "Strongly support", value: 24 },
];

// Late-night venue reopenings along the corridor, a small run in prose.
export const venueReopenings: number[] = [3, 5, 4, 8, 11, 9, 14, 18];

/* ============================================================================
   THE ALMANAC — glyph charts as almanac entries
   ========================================================================== */

// Regional station models for the "State of the Skies" table.
export type Station = {
  station: string;
  place: string;
  cloud: number;
  wind: { direction: number; magnitude: number };
  temp: number;
  dewpoint: number;
  pressure: number;
};

export const stations: Station[] = [
  {
    station: "KPDX",
    place: "Portland",
    cloud: 0.75,
    wind: { direction: 225, magnitude: 15 },
    temp: 54,
    dewpoint: 48,
    pressure: 1013,
  },
  {
    station: "KBOI",
    place: "Boise",
    cloud: 0.2,
    wind: { direction: 315, magnitude: 8 },
    temp: 61,
    dewpoint: 39,
    pressure: 1019,
  },
  {
    station: "KSEA",
    place: "Seattle",
    cloud: 1.0,
    wind: { direction: 200, magnitude: 22 },
    temp: 51,
    dewpoint: 47,
    pressure: 1006,
  },
  {
    station: "KMSO",
    place: "Missoula",
    cloud: 0.45,
    wind: { direction: 290, magnitude: 11 },
    temp: 49,
    dewpoint: 34,
    pressure: 1016,
  },
];

// Prevailing wind for the season (from-direction, mph).
export const prevailingWind = { direction: 245, magnitude: 18 };
// The autumn songbird corridor: net flow bearing and volume (birds/hr, ÷10).
export const migrationFlow = { direction: 190, magnitude: 34 };

// Moon phase tonight (illuminated fraction, cycle mapping) + a countdown.
export const moonTonight = 0.72;
export const moonNewIn = 0.28;

// Fraction of the season elapsed toward the winter solstice.
export const solsticeElapsed = 0.68;

// Mountain snowpack as a share of the April-1 normal (fill-word "SNOWPACK").
export const snowpackFraction = 0.41;
// Reservoir storage as a share of capacity (fill-word "RESERVOIR").
export const reservoirFraction = 0.63;

// Fire-weather severity for the week, 0–6 (dice-pips severity cell).
export const fireDanger = 4;
// Air-quality severity, 0–6.
export const airSeverity = 2;

// Five weeks of measurable-rain days, intensity 0–4 (garden-grid, 7 rows).
// Column-major by design so each 7-cell column is one week.
export const rainRhythm: (number | null)[] = [
  2,
  1,
  0,
  3,
  4,
  1,
  0, // week 1
  0,
  0,
  2,
  3,
  1,
  0,
  0, // week 2
  1,
  2,
  4,
  4,
  2,
  1,
  0, // week 3
  0,
  1,
  1,
  0,
  3,
  2,
  0, // week 4
  3,
  4,
  2,
  1,
  0,
  0,
  1, // week 5
];

// The week's forecast high temperatures, Mon–Sun (music-staff melody, °F).
export const weekHighs: (number | null)[] = [58, 61, 63, 57, 52, 55, 60];
// Predicted tide highs across a week, feet (a second staff melody).
export const tideHighs: (number | null)[] = [7.8, 8.1, 8.6, 8.9, 8.4, 7.9, 7.2];
