import DemoShell from "@/components/DemoShell";
import { DEMOS } from "@/lib/demos";

export default function Page() {
  return <DemoShell config={DEMOS["biomed-rc"]} />;
}
