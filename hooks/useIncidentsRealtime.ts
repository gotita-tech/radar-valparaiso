"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Incident, IncidentCategory } from "@/lib/incidents/types";
import type { Tables } from "@/lib/supabase/database.types";

export type LiveStatus = "connecting" | "live" | "polling" | "offline";

const POLL_INTERVAL_MS = 60_000;

/**
 * Incidentes en vivo.
 *
 * La lista llega ya renderizada desde el servidor; esto sólo la mantiene al
 * día. Si el canal de Realtime no llega a conectarse —red bloqueada, WebSocket
 * cortado por un proxy— se degrada a un refetch periódico en vez de quedarse
 * mudo, y la interfaz enseña en qué modo está.
 *
 * Un único canal por montaje, cerrado en el cleanup: sin esto, cada render en
 * modo estricto de React dejaría una suscripción abierta.
 */
export function useIncidentsRealtime(
  initial: Incident[],
  categories: IncidentCategory[],
) {
  const [incidents, setIncidents] = useState<Incident[]>(initial);
  const [status, setStatus] = useState<LiveStatus>("connecting");

  // El servidor manda: si revalida y trae otra lista, se adopta.
  useEffect(() => {
    setIncidents(initial);
  }, [initial]);

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const categoriesRef = useRef(categoriesById);
  categoriesRef.current = categoriesById;

  const withCategory = useCallback((row: Tables<"incidents">): Incident => {
    return { ...row, category: categoriesRef.current.get(row.category_id) ?? null };
  }, []);

  const upsert = useCallback(
    (row: Tables<"incidents">) => {
      setIncidents((current) => {
        // Realtime respeta RLS, pero el estado puede cambiar bajo los pies:
        // un incidente rechazado deja de ser visible y sale de la lista.
        if (row.status === "rejected") {
          return current.filter((item) => item.id !== row.id);
        }

        const incident = withCategory(row);
        const index = current.findIndex((item) => item.id === row.id);

        if (index === -1) return [incident, ...current];

        const next = [...current];
        next[index] = incident;
        return next;
      });
    },
    [withCategory],
  );

  const remove = useCallback((id: string) => {
    setIncidents((current) => current.filter((item) => item.id !== id));
  }, []);

  const refetch = useCallback(async () => {
    try {
      const response = await fetch("/api/incidents", { cache: "no-store" });
      if (!response.ok) return;

      const payload: unknown = await response.json();
      if (
        payload &&
        typeof payload === "object" &&
        Array.isArray((payload as { incidents?: unknown }).incidents)
      ) {
        setIncidents((payload as { incidents: Incident[] }).incidents);
      }
    } catch {
      // Una actualización perdida no es un error que mostrar: la siguiente
      // vuelta lo arregla y la lista actual sigue siendo válida.
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setStatus("offline");
      return;
    }

    let channel: RealtimeChannel | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const startPolling = () => {
      if (pollTimer || cancelled) return;
      setStatus("polling");
      pollTimer = setInterval(() => {
        void refetch();
      }, POLL_INTERVAL_MS);
    };

    try {
      const supabase = createClient();

      channel = supabase
        .channel("incidents-feed")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "incidents" },
          (payload) => upsert(payload.new as Tables<"incidents">),
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "incidents" },
          (payload) => upsert(payload.new as Tables<"incidents">),
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "incidents" },
          (payload) => {
            const old = payload.old as Partial<Tables<"incidents">>;
            if (old.id) remove(old.id);
          },
        )
        .subscribe((subscriptionStatus) => {
          if (cancelled) return;

          if (subscriptionStatus === "SUBSCRIBED") {
            setStatus("live");
            // Recupera lo ocurrido entre el render del servidor y la conexión.
            void refetch();
            return;
          }

          if (
            subscriptionStatus === "CHANNEL_ERROR" ||
            subscriptionStatus === "TIMED_OUT" ||
            subscriptionStatus === "CLOSED"
          ) {
            startPolling();
          }
        });
    } catch {
      startPolling();
    }

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      if (channel) void channel.unsubscribe();
    };
  }, [upsert, remove, refetch]);

  return { incidents, status, refetch };
}
