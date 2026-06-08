// Literal route from the project goal (/biomed-rc), the second RC demo slot.
// The goal's "RC-owned map built off the BioMed dashboard" item id was never
// supplied, so this slot uses the real, login-gated FLARE county-fire layer.
// Swap DEMOS.flare for the dedicated RC item when its id is available.
import DemoShell from "@/components/DemoShell";
import { DEMOS } from "@/lib/demos";

export default function Page() {
  return <DemoShell config={DEMOS.flare} />;
}
