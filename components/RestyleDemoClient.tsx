"use client";

import dynamic from "next/dynamic";

// ArcGIS SDK touches browser-only globals (ResizeObserver, etc.) at module
// load, so this must never render on the server.
const RestyleDemo = dynamic(() => import("./RestyleDemo"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        flex: 1,
        display: "grid",
        placeItems: "center",
        padding: "60px 20px",
        color: "#4a4540",
      }}
    >
      Loading the map engine…
    </div>
  ),
});

export default RestyleDemo;
