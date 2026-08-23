import type { Lead } from "./types";

const CSV_COLUMNS: { key: keyof Lead; header: string }[] = [
  { key: "business_id", header: "business_id" },
  { key: "business_name", header: "business_name" },
  { key: "niche", header: "niche" },
  { key: "commune", header: "commune" },
  { key: "address", header: "address" },
  { key: "latitude", header: "latitude" },
  { key: "longitude", header: "longitude" },
  { key: "website_url", header: "website_url" },
  { key: "website_classification", header: "website_classification" },
  { key: "instagram_url", header: "instagram_url" },
  { key: "whatsapp_business", header: "whatsapp_business" },
  { key: "public_business_email", header: "public_business_email" },
  { key: "public_business_phone", header: "public_business_phone" },
  { key: "rating", header: "rating" },
  { key: "review_count", header: "review_count" },
  { key: "digital_need_score", header: "digital_need_score" },
  { key: "commercial_attractiveness_score", header: "commercial_attractiveness_score" },
  { key: "contactability_score", header: "contactability_score" },
  { key: "landing_fit_score", header: "landing_fit_score" },
  { key: "local_opportunity_score", header: "local_opportunity_score" },
  { key: "priority_score", header: "priority_score" },
  { key: "confidence_score", header: "confidence_score" },
  { key: "priority_tier", header: "priority_tier" },
  { key: "source_primary", header: "source_primary" },
  { key: "evidence_notes", header: "evidence_notes" },
];

function csvCell(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function leadsToCsv(leads: Lead[]) {
  const header = CSV_COLUMNS.map((c) => c.header).join(",");
  const rows = leads.map((lead) =>
    CSV_COLUMNS.map((column) => csvCell(lead[column.key])).join(","),
  );
  return [header, ...rows].join("\n");
}

export function leadsToGeoJson(leads: Lead[]) {
  return JSON.stringify(
    {
      type: "FeatureCollection",
      name: "opportunity-radar-valparaiso-selection",
      features: leads
        .filter((l) => l.latitude !== null && l.longitude !== null)
        .map((lead) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [lead.longitude, lead.latitude] },
          properties: {
            business_id: lead.business_id,
            business_name: lead.business_name,
            niche: lead.niche,
            commune: lead.commune,
            address: lead.address,
            priority_score: lead.priority_score,
            confidence_score: lead.confidence_score,
            priority_tier: lead.priority_tier,
            website_classification: lead.website_classification,
          },
        })),
    },
    null,
    2,
  );
}

export function downloadText(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
