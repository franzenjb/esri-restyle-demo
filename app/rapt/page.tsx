import type { Metadata } from "next";
import RaptCaseStudy from "@/components/RaptCaseStudyClient";

export const metadata: Metadata = {
  title: "Ugly ArcGIS map -> beautiful decision product",
  description:
    "A public FEMA RAPT case study showing an untouched ArcGIS WebMap transformed into a polished decision product in the browser with the ArcGIS Maps SDK for JavaScript.",
};

export default function Page() {
  return <RaptCaseStudy />;
}
