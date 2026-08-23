import type { Metadata } from "next";
import PipelineView from "@/components/pipeline/PipelineView";

export const metadata: Metadata = {
  title: "Pipeline comercial",
  description:
    "Embudo local de prospectos del Opportunity Radar. Los estados y las notas se guardan sólo en este navegador.",
  robots: { index: false, follow: false },
};

export default function PipelinePage() {
  return <PipelineView />;
}
