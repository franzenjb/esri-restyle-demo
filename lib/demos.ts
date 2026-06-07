// Configuration for each re-styling demo.
//
// LEFT map  = the source item rendered with its AGOL-authored default (we set no
//             renderer, so the SDK uses the service/web-map drawingInfo).
// RIGHT map = the SAME source, re-styled entirely in the browser using the
//             options below. Nothing here is ever written back to AGOL.

export type ColorScheme = {
  id: string;
  label: string;
  // For polygons: [lowColor, highColor] across the numeric field.
  // For points:   [fillColor] (single hue).
  colors: [string, string] | [string];
};

export type SymbolStyle = {
  id: string;
  label: string;
  // polygon: "solid" | "hollow" | "hatch"
  // point:   "circle" | "diamond" | "square"
  kind: string;
};

export type PopupField = {
  field: string;
  label: string;
  format?: "number" | "percent" | "currency" | "text";
};

export type DemoConfig = {
  key: string;
  title: string;
  tagline: string;
  audience: "public" | "redcross";
  requiresAuth: boolean;
  // Source: an AGOL portal item, optionally pinned to a sublayer index.
  source: { itemId: string; layerId?: number };
  // When true the engine inspects the loaded layer and fills in any missing
  // field config automatically (used for the private BioMed layers whose schema
  // we cannot read until after sign-in).
  autodetect: boolean;
  expectedGeometry: "polygon" | "point";

  numericField?: string;
  numericLabel?: string;

  categoryField?: string;
  categoryLabel?: string;
  // Explicit dropdown values, or "distinct" to query them from the layer.
  categoryValues?: { value: string; label: string }[] | "distinct";

  popupTitle?: string;
  popupFields?: PopupField[];

  colorSchemes: ColorScheme[];
  symbolStyles: SymbolStyle[];

  center?: [number, number];
  zoom?: number;
};

const POLYGON_SCHEMES: ColorScheme[] = [
  { id: "ember", label: "Ember", colors: ["#fde0c8", "#b3121f"] },
  { id: "harbor", label: "Harbor", colors: ["#dceaf3", "#0b3d66"] },
  { id: "moss", label: "Moss", colors: ["#e7ecd9", "#33581f"] },
];

const POLYGON_SYMBOLS: SymbolStyle[] = [
  { id: "solid", label: "Graduated Fill", kind: "solid" },
  { id: "hollow", label: "Outline Only", kind: "hollow" },
  { id: "hatch", label: "Diagonal Hatch", kind: "hatch" },
];

const POINT_SCHEMES: ColorScheme[] = [
  { id: "red", label: "Red Cross Red", colors: ["#ed1b2e"] },
  { id: "harbor", label: "Harbor Blue", colors: ["#0b3d66"] },
  { id: "moss", label: "Moss Green", colors: ["#33581f"] },
];

const POINT_SYMBOLS: SymbolStyle[] = [
  { id: "circle", label: "Circle", kind: "circle" },
  { id: "diamond", label: "Diamond", kind: "diamond" },
  { id: "square", label: "Square", kind: "square" },
];

// US state postal codes for the RAPT state filter (no query needed).
const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
].map((s) => ({ value: s, label: s }));

export const DEMOS: Record<string, DemoConfig> = {
  // ---- PUBLIC SHOWPIECE: FEMA RAPT (no login) -----------------------------
  rapt: {
    key: "rapt",
    title: "FEMA Resilience Analysis & Planning Tool",
    tagline:
      "FEMA Community Resilience Challenges Index — every U.S. county, a public FEMA layer used inside RAPT.",
    audience: "public",
    requiresAuth: false,
    source: { itemId: "ff17676850114091b28cb4c502e9fb4e", layerId: 54 },
    autodetect: false,
    expectedGeometry: "polygon",
    numericField: "CRCI_percentile",
    numericLabel: "Resilience Challenge Percentile",
    categoryField: "STUPS",
    categoryLabel: "State",
    categoryValues: US_STATES,
    popupTitle: "{COUNTYNAME}, {STATE_NAME}",
    popupFields: [
      { field: "CRCI_percentile", label: "Challenge Percentile", format: "number" },
      { field: "Median_Income", label: "Median Household Income", format: "currency" },
      { field: "Poverty", label: "Population in Poverty", format: "percent" },
      { field: "Unemployment", label: "Unemployment", format: "percent" },
      { field: "Uninsured_Population", label: "Uninsured", format: "percent" },
    ],
    colorSchemes: POLYGON_SCHEMES,
    symbolStyles: POLYGON_SYMBOLS,
    center: [-96, 38.5],
    zoom: 4,
  },

  // ---- RED CROSS (login-gated): BioMed blood-drive source layer -----------
  biomed: {
    key: "biomed",
    title: "BioMed Blood-Drive Map",
    tagline:
      "The org-private BioMed source feature layer, re-styled live in your browser after Red Cross sign-in.",
    audience: "redcross",
    requiresAuth: true,
    source: { itemId: "1cf18f94f20b4f65b651a0d329121d89" },
    autodetect: true,
    expectedGeometry: "point",
    categoryValues: "distinct",
    colorSchemes: POINT_SCHEMES,
    symbolStyles: POINT_SYMBOLS,
    center: [-96, 38.5],
    zoom: 4,
  },

  // ---- RED CROSS (login-gated): second example, same technique -----------
  "biomed-rc": {
    key: "biomed-rc",
    title: "Red Cross Blood Program — Styling Variant",
    tagline:
      "The same BioMed source, re-styled with a different Red Cross palette and filter — proof the technique generalizes.",
    audience: "redcross",
    requiresAuth: true,
    // NOTE: pending the dedicated RC-owned item id from Dragon, this reuses the
    // BioMed source with a distinct default preset. Swap source.itemId when the
    // RC-owned item id is available.
    source: { itemId: "1cf18f94f20b4f65b651a0d329121d89" },
    autodetect: true,
    expectedGeometry: "point",
    categoryValues: "distinct",
    colorSchemes: [POINT_SCHEMES[1], POINT_SCHEMES[2], POINT_SCHEMES[0]],
    symbolStyles: [POINT_SYMBOLS[1], POINT_SYMBOLS[2], POINT_SYMBOLS[0]],
    center: [-96, 38.5],
    zoom: 4,
  },
};

export function getDemo(key: string): DemoConfig | undefined {
  return DEMOS[key];
}
