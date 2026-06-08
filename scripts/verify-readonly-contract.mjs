import { readFileSync } from "node:fs";

const files = [
  "components/RaptCaseStudy.tsx",
  "components/RaptCaseStudyClient.tsx",
  "app/rapt/page.tsx",
  "lib/demos.ts",
];

const combined = files.map((file) => readFileSync(file, "utf8")).join("\n");

const required = [
  "1b4169e0fe874b1686489111896e17a7",
  "All_Indicators_County_Boundaries/FeatureServer/23",
  "new WebMap",
  "new FeatureLayer",
  "new GraphicsLayer",
  "new ClassBreaksRenderer",
  "definitionExpression",
  "new PictureMarkerSymbol",
  "popupEnabled: false",
];

const forbidden = [
  "applyEdits(",
  ".save(",
  ".saveAs(",
  "updateItem",
  "addToDefinition",
  "deleteFromDefinition",
];

for (const token of required) {
  if (!combined.includes(token)) {
    throw new Error(`Missing required read-only demo marker: ${token}`);
  }
}

for (const token of forbidden) {
  if (combined.includes(token)) {
    throw new Error(`Forbidden source-write API found: ${token}`);
  }
}

console.log("RAPT read-only SDK contract verified.");
