"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";

import ArcGISMap from "@arcgis/core/Map.js";
import WebMap from "@arcgis/core/WebMap.js";
import Graphic from "@arcgis/core/Graphic.js";
import Point from "@arcgis/core/geometry/Point.js";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import ClassBreaksRenderer from "@arcgis/core/renderers/ClassBreaksRenderer.js";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol.js";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol.js";
import PictureMarkerSymbol from "@arcgis/core/symbols/PictureMarkerSymbol.js";
import MapView from "@arcgis/core/views/MapView.js";
import BasemapGallery from "@arcgis/core/widgets/BasemapGallery.js";
import Expand from "@arcgis/core/widgets/Expand.js";
import Home from "@arcgis/core/widgets/Home.js";
import ScaleBar from "@arcgis/core/widgets/ScaleBar.js";
import esriConfig from "@arcgis/core/config.js";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils.js";

import styles from "./RaptCaseStudy.module.css";

const COUNTY_LAYER_URL =
  "https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/All_Indicators_County_Boundaries/FeatureServer/23";
const SOURCE_WEB_MAP_ID = "1b4169e0fe874b1686489111896e17a7";

esriConfig.log.level = "error";

type AudienceKey = "executive" | "operations" | "public";
type FocusKey = "florida" | "southeast";
type IndicatorKey = "Age" | "Disability" | "No_Vehicle";
type SymbolKey =
  | "rawDiamond"
  | "rawStar"
  | "rawSquare"
  | "rawPurple"
  | "rawYellowDiamond"
  | "school"
  | "law"
  | "home"
  | "response"
  | "priority";

type CountyDetails = {
  name: string;
  state: string;
  age: number | null;
  disability: number | null;
  noVehicle: number | null;
  active: number | null;
};

type CountyStats = {
  countyCount: number;
  highCount: number;
  moderateCount: number;
  lowerCount: number;
  top: CountyDetails[];
};

type IndicatorConfig = {
  key: IndicatorKey;
  label: string;
  shortLabel: string;
  plainLanguage: string;
  highLabel: string;
  breaks: {
    min: number;
    max: number;
    label: string;
    rawColor: string;
    polishedColor: string;
  }[];
};

const INDICATORS: IndicatorConfig[] = [
  {
    key: "Age",
    label: "Population age 65 and older",
    shortLabel: "Age 65+",
    plainLanguage:
      "Older adults may need extra time, transportation support, medical continuity, and accessible communications before and after a disaster.",
    highLabel: "Higher age-related resilience challenge",
    breaks: [
      {
        min: 0,
        max: 15.48,
        label: "0 - 15.48% (Lower Challenge to Resilience)",
        rawColor: "#fbffd2",
        polishedColor: "#e9f5ee",
      },
      {
        min: 15.49,
        max: 19.45,
        label: "15.49 - 19.45%",
        rawColor: "#b7e3bf",
        polishedColor: "#c8e4d6",
      },
      {
        min: 19.46,
        max: 23.6,
        label: "19.46 - 23.60%",
        rawColor: "#42c9cf",
        polishedColor: "#8cc7bb",
      },
      {
        min: 23.61,
        max: 29.83,
        label: "23.61 - 29.83%",
        rawColor: "#3399c8",
        polishedColor: "#f1bd62",
      },
      {
        min: 29.84,
        max: 74.07,
        label: "29.84 - 74.07% (Higher Challenge to Resilience)",
        rawColor: "#353fa2",
        polishedColor: "#d95b43",
      },
    ],
  },
  {
    key: "Disability",
    label: "Population with a disability",
    shortLabel: "Disability",
    plainLanguage:
      "Higher disability rates change shelter accessibility, transportation planning, medical equipment continuity, and public information strategy.",
    highLabel: "Higher disability-related resilience challenge",
    breaks: [
      {
        min: 0,
        max: 12.9,
        label: "0 - 12.90% (Lower Challenge to Resilience)",
        rawColor: "#f7ffd7",
        polishedColor: "#edf6ef",
      },
      {
        min: 12.91,
        max: 15.76,
        label: "12.91 - 15.76%",
        rawColor: "#bde7bc",
        polishedColor: "#cde8d7",
      },
      {
        min: 15.77,
        max: 18.71,
        label: "15.77 - 18.71%",
        rawColor: "#48bdc5",
        polishedColor: "#8fcabd",
      },
      {
        min: 18.72,
        max: 22.59,
        label: "18.72 - 22.59%",
        rawColor: "#2d8cc6",
        polishedColor: "#f0bb61",
      },
      {
        min: 22.6,
        max: 51.92,
        label: "22.60 - 51.92% (Higher Challenge to Resilience)",
        rawColor: "#2e3492",
        polishedColor: "#c94f46",
      },
    ],
  },
  {
    key: "No_Vehicle",
    label: "Households without a vehicle",
    shortLabel: "No vehicle",
    plainLanguage:
      "No-vehicle households turn evacuation, cooling-center access, distribution routes, and door-to-door outreach into an operational problem.",
    highLabel: "Higher transportation resilience challenge",
    breaks: [
      {
        min: 0,
        max: 6.2,
        label: "0 - 6.20% (Lower Challenge to Resilience)",
        rawColor: "#fbffd8",
        polishedColor: "#eef6ef",
      },
      {
        min: 6.21,
        max: 9.51,
        label: "6.21 - 9.51%",
        rawColor: "#bde5b8",
        polishedColor: "#cce7d6",
      },
      {
        min: 9.52,
        max: 14.02,
        label: "9.52 - 14.02%",
        rawColor: "#49c7cd",
        polishedColor: "#8dc8bb",
      },
      {
        min: 14.03,
        max: 23.78,
        label: "14.03 - 23.78%",
        rawColor: "#2f94c9",
        polishedColor: "#efba61",
      },
      {
        min: 23.79,
        max: 68.34,
        label: "23.79 - 68.34% (Higher Challenge to Resilience)",
        rawColor: "#30419f",
        polishedColor: "#ca5047",
      },
    ],
  },
];

const AUDIENCES: Record<AudienceKey, { label: string; frame: string; action: string }> = {
  executive: {
    label: "Executive",
    frame: "Where does leadership need a clean, fast resilience read?",
    action: "Lead with the highest-challenge counties and keep the source proof visible.",
  },
  operations: {
    label: "Operations",
    frame: "Where do county conditions change field logistics?",
    action: "Use curated pins and top-county callouts to focus staffing, transport, and outreach.",
  },
  public: {
    label: "Public",
    frame: "How do we explain county resilience factors without raw GIS clutter?",
    action: "Use plain language, readable classes, and no schema-heavy popup dumps.",
  },
};

const FOCUS_AREAS: Record<
  FocusKey,
  {
    label: string;
    where: string;
    pointWhere: string;
    center: [number, number];
    zoom: number;
  }
> = {
  florida: {
    label: "Florida",
    where: "STUSPS = 'FL'",
    pointWhere: "STATE = 'FL'",
    center: [-81.7, 27.9],
    zoom: 7,
  },
  southeast: {
    label: "Southeast",
    where: "STUSPS IN ('FL','GA','AL','SC','NC')",
    pointWhere: "STATE IN ('FL','GA','AL','SC','NC')",
    center: [-82.9, 31.2],
    zoom: 5,
  },
};

const POINT_SOURCES = [
  {
    label: "Fire stations",
    url: "https://services2.arcgis.com/FiaPA4ga0iQKduv3/arcgis/rest/services/Structures_Medical_Emergency_Response_v1/FeatureServer/2",
    afterSymbol: "response" as const,
    afterLimit: 24,
  },
  {
    label: "Local law enforcement",
    url: "https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/Local_Law_Enforcement_Locations_RAPT/FeatureServer/0",
    afterSymbol: "law" as const,
    afterLimit: 18,
  },
  {
    label: "Mobile home parks",
    url: "https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/Mobile_Home_Parks_RAPT/FeatureServer/2",
    afterSymbol: "home" as const,
    afterLimit: 16,
  },
  {
    label: "Public schools",
    url: "https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/Public_Schools/FeatureServer/3",
    afterSymbol: "school" as const,
    afterLimit: 22,
  },
];

const symbolCache = new Map<string, PictureMarkerSymbol>();

function getIndicator(key: IndicatorKey) {
  return INDICATORS.find((indicator) => indicator.key === key) ?? INDICATORS[0];
}

export default function RaptCaseStudy() {
  const beforeEl = useRef<HTMLDivElement>(null);
  const afterEl = useRef<HTMLDivElement>(null);
  const stageEl = useRef<HTMLDivElement>(null);

  const beforeView = useRef<MapView | null>(null);
  const afterView = useRef<MapView | null>(null);
  const afterLayer = useRef<FeatureLayer | null>(null);
  const polishedPinsLayer = useRef<GraphicsLayer | null>(null);
  const queryRun = useRef(0);

  const [indicatorKey, setIndicatorKey] = useState<IndicatorKey>("Age");
  const [audience, setAudience] = useState<AudienceKey>("executive");
  const [focusKey, setFocusKey] = useState<FocusKey>("florida");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [stats, setStats] = useState<CountyStats>({
    countyCount: 0,
    highCount: 0,
    moderateCount: 0,
    lowerCount: 0,
    top: [],
  });
  const [selectedCounty, setSelectedCounty] = useState<CountyDetails | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [panelWidth, setPanelWidth] = useState(334);

  const indicator = useMemo(() => getIndicator(indicatorKey), [indicatorKey]);
  const focus = FOCUS_AREAS[focusKey];
  const audienceFrame = AUDIENCES[audience];

  useEffect(() => {
    if (!beforeEl.current || !afterEl.current) return;

    let cancelled = false;
    let left: MapView | null = null;
    let right: MapView | null = null;

    async function boot() {
      setStatus("loading");
      try {
        const beforeCounties = new FeatureLayer({
          url: COUNTY_LAYER_URL,
          outFields: detailFields(),
          title: "FEMA RAPT indicator layer - source proof",
          definitionExpression: "1=0",
          listMode: "hide",
        });
        const afterCounties = new FeatureLayer({
          url: COUNTY_LAYER_URL,
          outFields: ["*"],
          title: "FEMA RAPT county indicators - polished view",
          definitionExpression: FOCUS_AREAS.florida.where,
          renderer: makePolishedCountyRenderer(getIndicator("Age")),
        });

        const polishedPins = new GraphicsLayer({
          title: "App-derived decision overlays",
        });

        afterLayer.current = afterCounties;
        polishedPinsLayer.current = polishedPins;

        const leftMap = new WebMap({
          portalItem: { id: SOURCE_WEB_MAP_ID },
        });
        const rightMap = new ArcGISMap({
          basemap: "gray-vector",
          layers: [afterCounties, polishedPins],
        });
        leftMap.add(beforeCounties);

        left = new MapView({
          container: beforeEl.current!,
          map: leftMap,
          center: FOCUS_AREAS.florida.center,
          zoom: FOCUS_AREAS.florida.zoom,
          popupEnabled: false,
          ui: { components: ["zoom"] },
          constraints: { snapToZoom: false },
        });
        right = new MapView({
          container: afterEl.current!,
          map: rightMap,
          center: FOCUS_AREAS.florida.center,
          zoom: FOCUS_AREAS.florida.zoom,
          popupEnabled: false,
          ui: { components: ["zoom"] },
          constraints: { snapToZoom: false },
        });

        beforeView.current = left;
        afterView.current = right;

        installMapChrome(left);
        installMapChrome(right);

        await Promise.all([left.when(), right.when(), beforeCounties.load(), afterCounties.load()]);
        if (cancelled) return;

        linkViews(left, right);
        right.on("click", (event) => {
          void selectCountyAt(event.mapPoint);
        });

        await refreshFocusAndOverlays(FOCUS_AREAS.florida, getIndicator("Age"));
        if (!cancelled) setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load FEMA RAPT data.");
        setStatus("error");
      }
    }

    void boot();

    return () => {
      cancelled = true;
      left?.destroy();
      right?.destroy();
    };
    // The ArcGIS views are created once; UI state changes update layer refs below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    afterLayer.current?.set("renderer", makePolishedCountyRenderer(indicator));
    void refreshFocusAndOverlays(focus, indicator);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indicatorKey, focusKey]);

  const startResize = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const stage = stageEl.current;
    if (!stage) return;

    const move = (moveEvent: globalThis.PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      const next = Math.round(rect.right - moveEvent.clientX);
      setPanelWidth(Math.min(440, Math.max(284, next)));
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
  }, []);

  async function refreshFocusAndOverlays(
    nextFocus: (typeof FOCUS_AREAS)[FocusKey],
    nextIndicator: IndicatorConfig
  ) {
    const run = queryRun.current + 1;
    queryRun.current = run;

    const rightLayer = afterLayer.current;
    if (!rightLayer) return;

    rightLayer.definitionExpression = nextFocus.where;

    const views = [beforeView.current, afterView.current].filter(Boolean) as MapView[];
    for (const view of views) {
      view.center = nextFocus.center;
      view.zoom = nextFocus.zoom;
    }

    try {
      const counties = await queryCounties(rightLayer, nextFocus.where);
      if (queryRun.current !== run) return;

      setStats(makeCountyStats(counties, nextIndicator));
      setSelectedCounty((current) => {
        if (!current) return makeCountyDetails(counties[0], nextIndicator);
        return current;
      });

      const pointGroups = await queryPointGroups(nextFocus.pointWhere);
      if (queryRun.current !== run) return;

      polishedPinsLayer.current?.removeAll();
      polishedPinsLayer.current?.addMany([
        ...makePolishedPinGraphics(pointGroups),
        ...makePriorityCountyGraphics(counties, nextIndicator),
      ]);
    } catch (err) {
      if (queryRun.current !== run) return;
      setError(err instanceof Error ? err.message : "Could not query RAPT features.");
      setStatus("error");
    }
  }

  async function selectCountyAt(point: Point) {
    const layer = afterLayer.current;
    if (!layer) return;

    const q = layer.createQuery();
    q.geometry = point;
    q.spatialRelationship = "intersects";
    q.where = focus.where;
    q.returnGeometry = false;
    q.outFields = detailFields();
    q.num = 1;

    const result = await layer.queryFeatures(q);
    const feature = result.features[0];
    if (feature) setSelectedCounty(makeCountyDetails(feature, indicator));
  }

  const gridStyle = {
    gridTemplateColumns: detailsOpen ? `minmax(0, 1fr) ${panelWidth}px` : "minmax(0, 1fr) 48px",
  };

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <a className={styles.homeLink} href="/">
          ArcGIS SDK rescue case study
        </a>
        <div className={styles.proofMini}>
          <span>Your public WebMap</span>
          <span>No source edits</span>
          <span>Browser-only SDK styling</span>
        </div>
      </header>

      <section className={styles.hero}>
        <div>
          <h1>Ugly ArcGIS map → beautiful decision product</h1>
          <p>
            Your public ArcGIS map loads untouched on the left. The right side
            turns the public FEMA RAPT county indicators into a focused decision
            surface without changing the WebMap or the source layers.
          </p>
        </div>
        <div className={styles.sourceBox}>
          <span>Before map</span>
          <strong>SDK Restyle Test Map</strong>
          <code>WebMap {SOURCE_WEB_MAP_ID}</code>
        </div>
      </section>

      <section className={styles.controls} aria-label="Demo controls">
        <div className={styles.controlGroup}>
          <span>County choropleth</span>
          <div className={styles.segmented}>
            {INDICATORS.map((item) => (
              <button
                key={item.key}
                className={indicatorKey === item.key ? styles.activeSegment : ""}
                onClick={() => setIndicatorKey(item.key)}
              >
                {item.shortLabel}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.controlGroup}>
          <span>Audience frame</span>
          <div className={styles.segmented}>
            {(Object.keys(AUDIENCES) as AudienceKey[]).map((key) => (
              <button
                key={key}
                className={audience === key ? styles.activeSegment : ""}
                onClick={() => setAudience(key)}
              >
                {AUDIENCES[key].label}
              </button>
            ))}
          </div>
        </div>

        <label className={styles.selectLabel}>
          <span>definitionExpression</span>
          <select value={focusKey} onChange={(event) => setFocusKey(event.target.value as FocusKey)}>
            {(Object.keys(FOCUS_AREAS) as FocusKey[]).map((key) => (
              <option key={key} value={key}>
                {FOCUS_AREAS[key].label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section ref={stageEl} className={styles.stage} style={gridStyle}>
        <div className={styles.compare}>
          <article className={styles.mapPanel}>
            <div className={styles.beforeCaption}>
              <strong>BEFORE</strong>
              <span>your public WebMap, loaded untouched</span>
            </div>
            <div ref={beforeEl} className={styles.map} />
            <div className={styles.rawToolbar} aria-hidden="true">
              <span>Legend</span>
              <span>Basemap</span>
              <span>Boundary</span>
              <span>County</span>
              <span>Infrastructure</span>
              <span>NRI</span>
            </div>
            <div className={styles.rawLegend}>
              <strong>Saved ArcGIS map</strong>
              <span>
                <i className={styles.rawDiamondLegend} />
                Public WebMap item
              </span>
              <span>
                <i className={styles.rawStarLegend} />
                Operational layers as authored
              </span>
              <span>
                <i className={styles.rawSquareLegend} />
                No client cleanup on BEFORE
              </span>
            </div>
          </article>

          <article className={styles.mapPanel}>
            <div className={styles.afterCaption}>
              <strong>AFTER</strong>
              <span>polished decision product</span>
            </div>
            <div ref={afterEl} className={styles.map} />
            <div className={styles.legendCard}>
              <strong>{indicator.label}</strong>
              {indicator.breaks
                .slice()
                .reverse()
                .map((item) => (
                  <span key={item.label}>
                    <i style={{ background: item.polishedColor }} />
                    {item.label}
                  </span>
                ))}
            </div>
            <div className={styles.callout}>
              <span>{focus.label}</span>
              <strong>{stats.highCount}</strong>
              <em>{indicator.highLabel}</em>
            </div>
          </article>
        </div>

        <aside className={detailsOpen ? styles.details : styles.detailsClosed}>
          <button
            className={styles.resizeHandle}
            type="button"
            aria-label="Resize details panel"
            onPointerDown={startResize}
          />
          <button
            className={styles.collapse}
            type="button"
            onClick={() => setDetailsOpen((open) => !open)}
            aria-label={detailsOpen ? "Collapse details panel" : "Open details panel"}
          >
            {detailsOpen ? "›" : "‹"}
          </button>

          {detailsOpen && (
            <div className={styles.detailsBody}>
              <div className={styles.audience}>
                <span>{audienceFrame.label}</span>
                <h2>{audienceFrame.frame}</h2>
                <p>{audienceFrame.action}</p>
              </div>

              <div className={styles.metricGrid}>
                <Metric label="Higher challenge" value={stats.highCount} />
                <Metric label="Moderate" value={stats.moderateCount} />
                <Metric label="Lower" value={stats.lowerCount} />
              </div>

              <section className={styles.detailsBlock}>
                <h3>Selected county</h3>
                <CountyReadout county={selectedCounty} />
              </section>

              <section className={styles.detailsBlock}>
                <h3>Top counties</h3>
                <ol className={styles.topList}>
                  {stats.top.map((county) => (
                    <li key={`${county.state}-${county.name}`}>
                      <span>{county.name}</span>
                      <strong>{formatPercent(county.active)}</strong>
                    </li>
                  ))}
                </ol>
              </section>

              <section className={styles.detailsBlock}>
                <h3>What changed</h3>
                <p>{indicator.plainLanguage}</p>
              </section>
            </div>
          )}
        </aside>
      </section>

      <section className={styles.proofStrip}>
        <strong>PROOF: all changes happen in your browser</strong>
        {[
          "FeatureLayer from public service",
          "Public WebMap loaded read-only",
          "Renderer override",
          "definitionExpression filter",
          "App-owned details panel",
          "GraphicsLayer overlays",
          "SVG PictureMarkerSymbol",
          "Synced before/after extents",
          "No applyEdits, no saveAs, no item update",
        ].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </section>

      {status !== "ready" && (
        <div className={status === "error" ? styles.error : styles.loading}>
          {status === "error" ? error : "Loading public FEMA RAPT layers..."}
        </div>
      )}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.metric}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function CountyReadout({ county }: { county: CountyDetails | null }) {
  if (!county) {
    return <p className={styles.empty}>Click a county on the AFTER map.</p>;
  }

  return (
    <div className={styles.countyReadout}>
      <strong>
        {county.name}, {county.state}
      </strong>
      <span>Age 65+ {formatPercent(county.age)}</span>
      <span>Disability {formatPercent(county.disability)}</span>
      <span>No vehicle {formatPercent(county.noVehicle)}</span>
    </div>
  );
}

function installMapChrome(view: MapView) {
  view.ui.add(new Home({ view }), "top-left");
  view.ui.add(new ScaleBar({ view, unit: "dual" }), "bottom-left");
  view.ui.add(
    new Expand({
      view,
      content: new BasemapGallery({ view }),
      expandIcon: "basemap",
      expandTooltip: "Basemap gallery",
    }),
    "bottom-right"
  );
}

function makeRawCountyRenderer(indicator: IndicatorConfig) {
  return makeCountyRenderer(indicator, "rawColor", "raw", 0.75);
}

function makePolishedCountyRenderer(indicator: IndicatorConfig) {
  return makeCountyRenderer(indicator, "polishedColor", "polished", 0.88);
}

function makeCountyRenderer(
  indicator: IndicatorConfig,
  colorKey: "rawColor" | "polishedColor",
  tone: "raw" | "polished",
  opacity: number
) {
  return new ClassBreaksRenderer({
    field: indicator.key,
    defaultSymbol: new SimpleFillSymbol({
      color: [210, 215, 220, 0.42],
      outline: new SimpleLineSymbol({ color: [123, 132, 142, 0.5], width: 0.5 }),
    }),
    classBreakInfos: indicator.breaks.map((item) => ({
      minValue: item.min,
      maxValue: item.max,
      label: item.label,
      symbol: new SimpleFillSymbol({
        color: hexToRgba(item[colorKey], opacity),
        outline: new SimpleLineSymbol({
          color: tone === "raw" ? [85, 89, 96, 0.82] : [255, 255, 255, 0.72],
          width: tone === "raw" ? 1.1 : 0.55,
        }),
      }),
    })),
  });
}

async function queryCounties(layer: FeatureLayer, where: string) {
  const q = layer.createQuery();
  q.where = where;
  q.outFields = detailFields();
  q.returnGeometry = true;
  q.num = 2000;
  const result = await layer.queryFeatures(q);
  return result.features;
}

async function queryPointGroups(where: string) {
  return Promise.all(
    POINT_SOURCES.map(async (source) => {
      try {
        const layer = new FeatureLayer({ url: source.url, outFields: ["*"] });
        await layer.load();
        const q = layer.createQuery();
        q.where = where;
        q.outFields = ["NAME", "CITY", "STATE", "TYPE", "STATUS"];
        q.returnGeometry = true;
        q.num = source.afterLimit;
        const result = await layer.queryFeatures(q);
        return { source, features: result.features };
      } catch {
        return { source, features: [] as Graphic[] };
      }
    })
  );
}

function makeCountyStats(features: Graphic[], indicator: IndicatorConfig): CountyStats {
  const highMin = indicator.breaks[indicator.breaks.length - 1].min;
  const moderateMin = indicator.breaks[2].min;
  const values = features
    .map((feature) => makeCountyDetails(feature, indicator))
    .filter((county): county is CountyDetails => county !== null);

  return {
    countyCount: values.length,
    highCount: values.filter((county) => (county.active ?? -Infinity) >= highMin).length,
    moderateCount: values.filter(
      (county) => (county.active ?? -Infinity) >= moderateMin && (county.active ?? -Infinity) < highMin
    ).length,
    lowerCount: values.filter((county) => (county.active ?? Infinity) < moderateMin).length,
    top: values
      .slice()
      .sort((a, b) => (b.active ?? -Infinity) - (a.active ?? -Infinity))
      .slice(0, 6),
  };
}

function makeCountyDetails(feature: Graphic | undefined, indicator: IndicatorConfig): CountyDetails | null {
  if (!feature) return null;
  const attributes = feature.attributes as Record<string, unknown>;
  return {
    name: String(attributes.NAME ?? "County"),
    state: String(attributes.STUSPS ?? attributes.STATE_NAME ?? ""),
    age: asNumber(attributes.Age),
    disability: asNumber(attributes.Disability),
    noVehicle: asNumber(attributes.No_Vehicle),
    active: asNumber(attributes[indicator.key]),
  };
}

function makePolishedPinGraphics(
  groups: Awaited<ReturnType<typeof queryPointGroups>>
) {
  const graphics: Graphic[] = [];

  for (const group of groups) {
    for (const feature of group.features.slice(0, group.source.afterLimit)) {
      if (!feature.geometry) continue;
      graphics.push(
        new Graphic({
          geometry: feature.geometry,
          attributes: {
            label: group.source.label,
            name: feature.attributes?.NAME ?? group.source.label,
          },
          symbol: pictureSymbol(group.source.afterSymbol, 25),
        })
      );
    }
  }

  return graphics;
}

function makePriorityCountyGraphics(features: Graphic[], indicator: IndicatorConfig) {
  return features
    .map((feature) => ({ feature, details: makeCountyDetails(feature, indicator) }))
    .filter((item): item is { feature: Graphic; details: CountyDetails } => Boolean(item.details))
    .sort((a, b) => (b.details.active ?? -Infinity) - (a.details.active ?? -Infinity))
    .slice(0, 10)
    .map(({ feature, details }) => {
      const center = feature.geometry?.extent?.center;
      if (!center) return null;
      return new Graphic({
        geometry: new Point({
          x: center.x,
          y: center.y,
          spatialReference: center.spatialReference,
        }),
        attributes: details,
        symbol: pictureSymbol("priority", 30),
      });
    })
    .filter((graphic): graphic is Graphic => graphic !== null);
}

function pictureSymbol(key: SymbolKey, size: number) {
  const cacheKey = `${key}-${size}`;
  const cached = symbolCache.get(cacheKey);
  if (cached) return cached;

  const symbol = new PictureMarkerSymbol({
    url: svgUrl(SVG_MARKERS[key]),
    width: `${size}px`,
    height: `${size}px`,
  });
  symbolCache.set(cacheKey, symbol);
  return symbol;
}

const SVG_MARKERS: Record<SymbolKey, string> = {
  rawDiamond:
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><filter id="s"><feDropShadow dx="2" dy="2" stdDeviation="1" flood-color="#111" flood-opacity=".45"/></filter><path filter="url(#s)" d="M20 3 37 20 20 37 3 20Z" fill="#ff3329" stroke="#ffb3a8" stroke-width="2"/><path d="M12 12 28 28" stroke="#fff" stroke-opacity=".35" stroke-width="2"/></svg>',
  rawStar:
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><path d="m20 3 4.8 10 11 1.6-8 7.8 1.9 11-9.7-5.1-9.7 5.1 1.9-11-8-7.8 11-1.6Z" fill="#f1e900" stroke="#697100" stroke-width="2"/></svg>',
  rawSquare:
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect x="9" y="9" width="22" height="22" fill="#f1a51b" stroke="#7b5300" stroke-width="3"/></svg>',
  rawPurple:
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect x="10" y="10" width="20" height="20" rx="2" fill="#a623f4" stroke="#4f1682" stroke-width="2"/></svg>',
  rawYellowDiamond:
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><path d="M20 6 34 20 20 34 6 20Z" fill="#ffe733" stroke="#1e2f16" stroke-width="3"/></svg>',
  school:
    '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="21" fill="#ffffff" stroke="#0d5f7d" stroke-width="3"/><path d="M12 21 24 13l12 8-12 8Z" fill="#167aa1"/><path d="M17 25v8h18v-8l-11 7Z" fill="#e8f5f8"/></svg>',
  law:
    '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="21" fill="#ffffff" stroke="#123c69" stroke-width="3"/><path d="m24 10 14 6v9c0 9-6 14-14 18-8-4-14-9-14-18v-9Z" fill="#123c69"/><path d="M18 24h12M24 18v12" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/></svg>',
  home:
    '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="21" fill="#fff8ea" stroke="#c57621" stroke-width="3"/><path d="m12 25 12-11 12 11" fill="none" stroke="#c57621" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 24v13h18V24" fill="#f1bd62"/></svg>',
  response:
    '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="21" fill="#ffffff" stroke="#d04432" stroke-width="3"/><path d="M21 11h6v11h11v6H27v11h-6V28H10v-6h11Z" fill="#d04432"/></svg>',
  priority:
    '<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52"><path d="M26 3 47 15v13c0 12-8 19-21 24C13 47 5 40 5 28V15Z" fill="#ffffff" stroke="#0c5b68" stroke-width="3"/><path d="M26 12 38 19v8c0 7-5 12-12 15-7-3-12-8-12-15v-8Z" fill="#0c9a7b"/><path d="m18 27 5 5 11-13" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

function svgUrl(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function detailFields() {
  return [
    "NAME",
    "STUSPS",
    "STATE_NAME",
    "S0101_C01_001E_Population",
    "Age",
    "Age_bins",
    "Disability",
    "Disability_bins",
    "No_Vehicle",
    "No_Vehicle_bins",
    "cria_p",
  ];
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b, alpha] as [number, number, number, number];
}

function linkViews(a: MapView, b: MapView) {
  let syncing = false;
  const wire = (from: MapView, to: MapView) =>
    reactiveUtils.watch(
      () => from.viewpoint,
      (viewpoint) => {
        if (syncing || !viewpoint) return;
        syncing = true;
        to.viewpoint = viewpoint;
        requestAnimationFrame(() => {
          syncing = false;
        });
      }
    );

  wire(a, b);
  wire(b, a);
}
