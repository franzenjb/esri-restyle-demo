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
  // Source: an AGOL portal item (optionally pinned to a sublayer index), or a
  // direct public service-layer URL.
  source: { itemId?: string; layerId?: number; url?: string };
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
  { id: "ember", label: "Ember", colors: ["#f6b9a0", "#9e0f1b"] },
  { id: "harbor", label: "Harbor", colors: ["#a7cae3", "#0b3d66"] },
  { id: "moss", label: "Moss", colors: ["#b9c898", "#2c4a1a"] },
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

  // ---- RED CROSS (login-gated): County geography choropleth ---------------
  // Master_ARC_Geography_2022 service, County polygons (layer 5). Real Red Cross
  // organizational data, not confidential. Login is still required by the app to
  // demonstrate the named-user OAuth flow.
  counties: {
    key: "counties",
    title: "Red Cross Counties — Population",
    tagline:
      "Red Cross county geography (3,162 counties), re-styled live in your browser after Red Cross sign-in.",
    audience: "redcross",
    requiresAuth: true,
    source: {
      url: "https://services.arcgis.com/pGfbNJoYypmNq86F/arcgis/rest/services/Master_ARC_Geography_2022/FeatureServer/5",
    },
    autodetect: false,
    expectedGeometry: "polygon",
    numericField: "Pop_2023",
    numericLabel: "2023 Population",
    categoryField: "Division",
    categoryLabel: "Division",
    categoryValues: "distinct",
    popupTitle: "{County}, {State}",
    popupFields: [
      { field: "County", label: "County", format: "text" },
      { field: "Chapter", label: "Chapter", format: "text" },
      { field: "Region", label: "Region", format: "text" },
      { field: "Division", label: "Division", format: "text" },
      { field: "Pop_2023", label: "Population (2023)", format: "number" },
    ],
    colorSchemes: POLYGON_SCHEMES,
    symbolStyles: POLYGON_SYMBOLS,
    center: [-96, 38.5],
    zoom: 4,
  },

  // ---- RED CROSS (login-gated): Chapter geography, same technique ---------
  // Same service, Chapter polygons (layer 3) — different geography + preset to
  // prove the re-styling generalizes across layers.
  chapters: {
    key: "chapters",
    title: "Red Cross Chapters — Geography",
    tagline:
      "Red Cross chapter boundaries (226 chapters), re-styled with a different palette and filter.",
    audience: "redcross",
    requiresAuth: true,
    source: {
      url: "https://services.arcgis.com/pGfbNJoYypmNq86F/arcgis/rest/services/Master_ARC_Geography_2022/FeatureServer/3",
    },
    autodetect: false,
    expectedGeometry: "polygon",
    categoryField: "Division",
    categoryLabel: "Division",
    categoryValues: "distinct",
    popupTitle: "{Chapter}",
    popupFields: [
      { field: "Chapter", label: "Chapter", format: "text" },
      { field: "Region", label: "Region", format: "text" },
      { field: "Division", label: "Division", format: "text" },
      { field: "City", label: "City", format: "text" },
      { field: "State", label: "State", format: "text" },
    ],
    colorSchemes: [POLYGON_SCHEMES[1], POLYGON_SCHEMES[2], POLYGON_SCHEMES[0]],
    symbolStyles: POLYGON_SYMBOLS,
    center: [-96, 38.5],
    zoom: 4,
  },

  // ---- RED CROSS (login-gated): FLARE county fire activity ----------------
  // Private item — loads for signed-in users with access. autodetect picks the
  // numeric fire-count field + a category field after the layer loads.
  flare: {
    key: "flare",
    title: "FLARE — County Fire Activity",
    tagline:
      "Red Cross FLARE county fire counts (2,914 counties), re-styled live after Red Cross sign-in.",
    audience: "redcross",
    requiresAuth: true,
    source: { itemId: "6cfb67cba4bb4c769ff33824ac5e2fd1" },
    autodetect: true,
    expectedGeometry: "polygon",
    categoryValues: "distinct",
    colorSchemes: POLYGON_SCHEMES,
    symbolStyles: POLYGON_SYMBOLS,
    center: [-96, 38.5],
    zoom: 4,
  },

  // ---- RED CROSS (login-gated): Damage Assessment points -----------------
  // Private item — loads for signed-in users with access. Point markers.
  da: {
    key: "da",
    title: "Damage Assessments — Standardized",
    tagline:
      "Red Cross standardized DA points (since 6/30/2023), re-styled live after Red Cross sign-in.",
    audience: "redcross",
    requiresAuth: true,
    source: { itemId: "3d29e7f60ea7422d9954a370d084b2a4" },
    autodetect: true,
    expectedGeometry: "point",
    categoryValues: "distinct",
    colorSchemes: POINT_SCHEMES,
    symbolStyles: POINT_SYMBOLS,
    center: [-96, 38.5],
    zoom: 4,
  },
};

export function getDemo(key: string): DemoConfig | undefined {
  return DEMOS[key];
}
