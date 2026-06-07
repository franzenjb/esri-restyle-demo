import { notFound } from "next/navigation";
import DemoShell from "@/components/DemoShell";
import { DEMOS } from "@/lib/demos";

export function generateStaticParams() {
  return Object.keys(DEMOS).map((key) => ({ key }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const config = DEMOS[key];
  if (!config) notFound();
  return <DemoShell config={config} />;
}
