"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { DemoConfig, PopupField } from "@/lib/demos";

import Map from "@arcgis/core/Map.js";
import MapView from "@arcgis/core/views/MapView.js";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer.js";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer.js";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol.js";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol.js";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol.js";
import PopupTemplate from "@arcgis/core/PopupTemplate.js";
import FeatureFilter from "@arcgis/core/layers/support/FeatureFilter.js";
import Home from "@arcgis/core/widgets/Home.js";
import BasemapToggle from "@arcgis/core/widgets/BasemapToggle.js";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils.js";

import { isSignedIn, signIn, signOut } from "@/lib/auth";
import styles from "./RestyleDemo.module.css";

type Resolved = {
  geometry: "polygon" | "point";
  numericField?: string;
  numericLabel: string;
  categoryField?: string;
  categoryLabel: string;
  categoryOptions: { value: string; label: string }[];
  popupTitle: string;
  popupFields: PopupField[];
  range: { min: number; max: number };
};

const SYSTEM = /^(objectid|fid|globalid|shape|shape_|shape__|gdb_|se_anno)/i;

function isNumericType(t: string) {
  return ["double", "integer", "small-integer", "single", "long"].includes(t);
}

function fmt(value: unknown, format?: PopupField["format"]) {
  if (value === null || value === undefined || value === "") return "—";
  if (format && typeof value === "number") {
    if (format === "currency")
      return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });
    if (format === "percent") return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
    if (format === "number")
      return value.toLocaleString("en-US", { maximumFractionDigits: 1 });
  }
  if (typeof value === "number")
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return String(value);
}

export default function RestyleDemo({ config }: { config: DemoConfig }) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const rightLayerRef = useRef<FeatureLayer | null>(null);
  const rightViewRef = useRef<MapView | null>(null);

  const [authState, setAuthState] = useState<"checking" | "out" | "in">(
    config.requiresAuth ? "checking" : "in"
  );
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [resolved, setResolved] = useState<Resolved | null>(null);

  // Restyle controls (act only on the right map)
  const [schemeId, setSchemeId] = useState(config.colorSchemes[0].id);
  const [symbolId, setSymbolId] = useState(config.symbolStyles[0].id);
  const [category, setCategory] = useState("__all__");
  const [threshold, setThreshold] = useState(0);

  // ---- auth gate ----------------------------------------------------------
  useEffect(() => {
    if (!config.requiresAuth) return;
    isSignedIn().then((ok) => setAuthState(ok ? "in" : "out"));
  }, [config.requiresAuth]);

  const doSignIn = useCallback(async () => {
    try {
      await signIn();
      setAuthState("in");
    } catch {
      setErrorMsg("Sign-in was cancelled or blocked.");
    }
  }, []);

  const doSignOut = useCallback(() => {
    signOut();
    window.location.reload();
  }, []);

  // ---- build the two maps -------------------------------------------------
  useEffect(() => {
    if (authState !== "in") return;
    if (!leftRef.current || !rightRef.current) return;

    let leftView: MapView | null = null;
    let rightView: MapView | null = null;
    let cancelled = false;

    (async () => {
      setStatus("loading");
      try {
        // Two independent layer instances from the SAME source item, so the
        // left keeps its authored renderer while the right is overridden.
        const mk = () =>
          config.source.url
            ? new FeatureLayer({ url: config.source.url })
            : new FeatureLayer({
                portalItem: { id: config.source.itemId! },
                ...(config.source.layerId !== undefined
                  ? { layerId: config.source.layerId }
                  : {}),
              });

        const leftLayer = mk();
        const rightLayer = mk();
        rightLayerRef.current = rightLayer;

        await rightLayer.load();
        if (cancelled) return;

        const r = resolveConfig(config, rightLayer);

        // Statistics for the numeric range (drives ramp + threshold slider).
        if (r.numericField) {
          try {
            const q = rightLayer.createQuery();
            q.outStatistics = [
              { statisticType: "min", onStatisticField: r.numericField, outStatisticFieldName: "mn" } as never,
              { statisticType: "max", onStatisticField: r.numericField, outStatisticFieldName: "mx" } as never,
            ];
            const res = await rightLayer.queryFeatures(q);
            const a = res.features[0]?.attributes;
            if (a && a.mn !== null && a.mx !== null) {
              r.range = { min: Math.floor(a.mn), max: Math.ceil(a.mx) };
            }
          } catch {
            /* keep default range */
          }
        }

        // Distinct category values when requested.
        if (config.categoryValues === "distinct" && r.categoryField) {
          try {
            const q = rightLayer.createQuery();
            q.where = "1=1";
            q.outFields = [r.categoryField];
            q.returnDistinctValues = true;
            q.orderByFields = [r.categoryField];
            q.num = 1000;
            const res = await rightLayer.queryFeatures(q);
            r.categoryOptions = res.features
              .map((f) => f.attributes[r.categoryField!])
              .filter((v) => v !== null && v !== undefined && v !== "")
              .map((v) => ({ value: String(v), label: String(v) }));
          } catch {
            r.categoryOptions = [];
          }
        }

        if (cancelled) return;
        setResolved(r);
        setThreshold(r.range.min);

        const popup = makePopupTemplate(r);
        leftLayer.popupTemplate = popup;
        rightLayer.popupTemplate = popup;

        // Right map starts already re-styled with the first preset.
        rightLayer.renderer = makeRenderer(config, r, schemeId, symbolId);

        const leftMap = new Map({ basemap: "gray-vector", layers: [leftLayer] });
        const rightMap = new Map({ basemap: "gray-vector", layers: [rightLayer] });

        leftView = new MapView({
          container: leftRef.current!,
          map: leftMap,
          center: config.center ?? [-96, 38.5],
          zoom: config.zoom ?? 4,
          ui: { components: ["zoom"] },
        });
        rightView = new MapView({
          container: rightRef.current!,
          map: rightMap,
          center: config.center ?? [-96, 38.5],
          zoom: config.zoom ?? 4,
          ui: { components: ["zoom"] },
        });
        rightViewRef.current = rightView;

        // Home (top-left) + basemap toggle (lower-right, SitAware pattern).
        leftView.ui.add(new Home({ view: leftView }), "top-left");
        rightView.ui.add(new Home({ view: rightView }), "top-left");
        rightView.ui.add(
          new BasemapToggle({ view: rightView, nextBasemap: "satellite" }),
          "bottom-right"
        );

        // Link extents both ways.
        await Promise.all([leftView.when(), rightView.when()]);
        if (cancelled) return;
        linkViews(leftView, rightView);

        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setErrorMsg(
          e instanceof Error ? e.message : "Could not load the source layer."
        );
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      leftView?.destroy();
      rightView?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState, config]);

  // ---- apply restyle whenever a control changes ---------------------------
  useEffect(() => {
    const layer = rightLayerRef.current;
    if (!layer || !resolved) return;
    layer.renderer = makeRenderer(config, resolved, schemeId, symbolId);
  }, [schemeId, symbolId, resolved, config]);

  // category filter -> definitionExpression
  useEffect(() => {
    const layer = rightLayerRef.current;
    if (!layer || !resolved?.categoryField) return;
    layer.definitionExpression =
      category === "__all__"
        ? ""
        : `${resolved.categoryField} = '${category.replace(/'/g, "''")}'`;
  }, [category, resolved]);

  // numeric threshold -> featureFilter on the right layerview
  useEffect(() => {
    const view = rightViewRef.current;
    const layer = rightLayerRef.current;
    if (!view || !layer || !resolved?.numericField) return;
    view.whenLayerView(layer).then((lv) => {
      lv.filter =
        threshold > resolved.range.min
          ? new FeatureFilter({
              where: `${resolved.numericField} >= ${threshold}`,
            })
          : null;
    });
  }, [threshold, resolved]);

  // ---- render -------------------------------------------------------------
  if (config.requiresAuth && authState === "checking") {
    return <div className={styles.center}>Checking Red Cross sign-in…</div>;
  }

  if (config.requiresAuth && authState === "out") {
    return (
      <div className={styles.gate}>
        <div className={styles.gateCard}>
          <span className={styles.badge}>Red Cross · Sign-in</span>
          <h2>Red Cross sign-in required</h2>
          <p>
            {config.title} is a Red Cross ArcGIS Online organizational layer. Sign
            in with your Red Cross account and the SDK re-styles it in your
            browser — read-only, never modifying the source.
          </p>
          <button className={styles.primary} onClick={doSignIn}>
            Sign in with ArcGIS
          </button>
          {errorMsg && <p className={styles.err}>{errorMsg}</p>}
          <p className={styles.note}>
            Sign-in works only on the *.jbf.com deployment, where the OAuth
            redirect URI is registered.
          </p>
        </div>
      </div>
    );
  }

  const scheme = config.colorSchemes;
  const symbols = config.symbolStyles;

  return (
    <div className={styles.wrap}>
      <div className={styles.banner}>
        <strong>The map on the left is the live original.</strong> It is not
        modified. The map on the right is the same data re-rendered in your
        browser.
      </div>

      <div className={styles.controls}>
        <div className={styles.group}>
          <label>Color scheme</label>
          <div className={styles.seg}>
            {scheme.map((s) => (
              <button
                key={s.id}
                className={schemeId === s.id ? styles.segOn : styles.segOff}
                onClick={() => setSchemeId(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.group}>
          <label>{resolved?.geometry === "point" ? "Marker" : "Fill style"}</label>
          <div className={styles.seg}>
            {symbols.map((s) => (
              <button
                key={s.id}
                className={symbolId === s.id ? styles.segOn : styles.segOff}
                onClick={() => setSymbolId(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {resolved?.categoryField && resolved.categoryOptions.length > 0 && (
          <div className={styles.group}>
            <label>{resolved.categoryLabel}</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="__all__">All</option>
              {resolved.categoryOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {resolved?.numericField && resolved.range.max > resolved.range.min && (
          <div className={styles.group}>
            <label>
              {resolved.numericLabel} ≥{" "}
              <span className="font-mono">{threshold}</span>
            </label>
            <input
              type="range"
              min={resolved.range.min}
              max={resolved.range.max}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
          </div>
        )}

        {config.requiresAuth && (
          <button className={styles.signout} onClick={doSignOut}>
            Sign out
          </button>
        )}
      </div>

      <div className={styles.maps}>
        <figure className={styles.pane}>
          <figcaption className={styles.capLeft}>
            As authored in AGOL · untouched
          </figcaption>
          <div ref={leftRef} className={styles.map} />
        </figure>
        <figure className={styles.pane}>
          <figcaption className={styles.capRight}>
            Re-styled live in your browser
          </figcaption>
          <div ref={rightRef} className={styles.map} />
        </figure>
      </div>

      {status === "loading" && (
        <div className={styles.overlay}>Loading the source layer…</div>
      )}
      {status === "error" && (
        <div className={styles.overlay}>
          {errorMsg}
          {config.requiresAuth && (
            <>
              {" "}
              If this is a permissions or CORS error, the *.jbf.com origin may
              need to be added to the org&rsquo;s Allowed Origins.
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---- helpers --------------------------------------------------------------

function resolveConfig(config: DemoConfig, layer: FeatureLayer): Resolved {
  const geometry: "polygon" | "point" =
    layer.geometryType === "polygon"
      ? "polygon"
      : layer.geometryType === "point" || layer.geometryType === "multipoint"
        ? "point"
        : config.expectedGeometry;

  const fields = layer.fields ?? [];
  const usable = fields.filter((f) => !SYSTEM.test(f.name));

  const numericField =
    config.numericField ??
    usable.find((f) => isNumericType(f.type))?.name;
  const categoryField =
    config.categoryField ??
    usable.find((f) => f.type === "string")?.name;

  let popupFields = config.popupFields;
  if (!popupFields) {
    popupFields = usable.slice(0, 6).map((f) => ({
      field: f.name,
      label: f.alias || f.name,
      format: isNumericType(f.type) ? ("number" as const) : ("text" as const),
    }));
  }

  const titleField =
    categoryField ?? usable.find((f) => f.type === "string")?.name;
  const popupTitle =
    config.popupTitle ?? (titleField ? `{${titleField}}` : config.title);

  let categoryOptions: { value: string; label: string }[] = [];
  if (Array.isArray(config.categoryValues)) categoryOptions = config.categoryValues;

  return {
    geometry,
    numericField,
    numericLabel: config.numericLabel ?? numericField ?? "Value",
    categoryField,
    categoryLabel: config.categoryLabel ?? categoryField ?? "Category",
    categoryOptions,
    popupTitle,
    popupFields,
    range: { min: 0, max: 100 },
  };
}

function makeRenderer(
  config: DemoConfig,
  r: Resolved,
  schemeId: string,
  symbolId: string
): SimpleRenderer {
  const scheme = config.colorSchemes.find((s) => s.id === schemeId) ?? config.colorSchemes[0];
  const sym = config.symbolStyles.find((s) => s.id === symbolId) ?? config.symbolStyles[0];

  if (r.geometry === "polygon") {
    const [low, high] = scheme.colors.length === 2 ? scheme.colors : [scheme.colors[0], scheme.colors[0]];
    let symbol: SimpleFillSymbol;
    if (sym.kind === "hollow") {
      symbol = new SimpleFillSymbol({
        color: [0, 0, 0, 0],
        outline: new SimpleLineSymbol({ color: high, width: 1 }),
      });
    } else if (sym.kind === "hatch") {
      symbol = new SimpleFillSymbol({
        style: "diagonal-cross",
        color: high,
        outline: new SimpleLineSymbol({ color: [255, 255, 255, 0.6], width: 0.3 }),
      });
    } else {
      symbol = new SimpleFillSymbol({
        color: low,
        outline: new SimpleLineSymbol({ color: [255, 255, 255, 0.5], width: 0.3 }),
      });
    }

    const renderer = new SimpleRenderer({ symbol });

    // Continuous color ramp on the numeric field (only for solid + hatch).
    if (r.numericField && sym.kind !== "hollow") {
      renderer.visualVariables = [
        {
          type: "color",
          field: r.numericField,
          stops: [
            { value: r.range.min, color: low },
            { value: r.range.max, color: high },
          ],
        } as never,
      ];
    }
    return renderer;
  }

  // point geometry
  const color = scheme.colors[0];
  const style = sym.kind === "diamond" ? "diamond" : sym.kind === "square" ? "square" : "circle";
  return new SimpleRenderer({
    symbol: new SimpleMarkerSymbol({
      style: style as never,
      color,
      size: 9,
      outline: new SimpleLineSymbol({ color: [255, 255, 255, 0.9], width: 0.7 }),
    }),
  });
}

function makePopupTemplate(r: Resolved): PopupTemplate {
  const fields = r.popupFields;
  return new PopupTemplate({
    title: r.popupTitle,
    outFields: ["*"],
    content: (event: { graphic: { attributes: Record<string, unknown> } }) => {
      const a = event.graphic.attributes;
      const rows = fields
        .map(
          (f) =>
            `<div style="display:flex;justify-content:space-between;gap:16px;padding:4px 0;border-bottom:1px solid #e4ded1;">
               <span style="color:#4a4540;font-size:13px;">${f.label}</span>
               <span style="color:#0a0a0a;font-weight:600;font-size:13px;font-family:'IBM Plex Mono',monospace;">${fmt(a[f.field], f.format)}</span>
             </div>`
        )
        .join("");
      return `<div style="font-family:'Source Sans 3',system-ui,sans-serif;min-width:240px;">${rows}</div>`;
    },
  });
}

function linkViews(a: MapView, b: MapView) {
  // reactiveUtils.watch fires asynchronously, so a synchronous flag reset does
  // not suppress the reciprocal echo — that causes an infinite A->B->A loop that
  // pegs the main thread. Release the lock on the next animation frame so the
  // echoed change lands while the lock is still held, then is ignored.
  let syncing = false;
  const wire = (from: MapView, to: MapView) =>
    reactiveUtils.watch(
      () => from.viewpoint,
      (vp) => {
        if (syncing || !vp) return;
        syncing = true;
        to.viewpoint = vp;
        requestAnimationFrame(() => {
          syncing = false;
        });
      }
    );
  wire(a, b);
  wire(b, a);
}
