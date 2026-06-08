"use client";

import dynamic from "next/dynamic";

const RaptCaseStudy = dynamic(() => import("./RaptCaseStudy"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "#f4f7f8",
        color: "#25313c",
        fontFamily: "var(--font-body), system-ui, sans-serif",
      }}
    >
      Loading the FEMA RAPT decision product...
    </div>
  ),
});

export default RaptCaseStudy;
