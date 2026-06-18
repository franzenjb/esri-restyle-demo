import type { Metadata } from "next";
import RaptCaseStudy from "@/components/RaptCaseStudyClient";

export const metadata: Metadata = {
  title: "Ugly ArcGIS map -> beautiful decision product",
  description:
    "A public ArcGIS Maps SDK case study using a staged before-view and public FEMA RAPT indicator layers to build a polished decision product in the browser.",
};

export default function Page() {
  return <RaptCaseStudy />;
}
