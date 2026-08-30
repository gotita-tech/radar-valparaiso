import { createClient } from "@/lib/supabase/server";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("app_health")
      .select("status")
      .eq("id", 1)
      .maybeSingle();

    if (error || data?.status !== "ok") {
      return Response.json(
        { ok: false, supabase: "unavailable" },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return Response.json(
      { ok: true, supabase: "connected" },
      { headers: noStoreHeaders },
    );
  } catch {
    return Response.json(
      { ok: false, supabase: "unavailable" },
      { status: 503, headers: noStoreHeaders },
    );
  }
}
