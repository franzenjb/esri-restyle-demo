// Literal route from the project goal (/biomed). The originally specified
// BioMed feature layer (1cf18f94…) is an .xlsx spreadsheet, not a loadable
// feature layer, so this RC demo slot uses real Red Cross org county geography.
import DemoShell from "@/components/DemoShell";
import { DEMOS } from "@/lib/demos";

export default function Page() {
  return <DemoShell config={DEMOS.counties} />;
}
