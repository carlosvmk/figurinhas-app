"use client";

import React from "react";

type Quantities = Record<string, number>;

function storageKey(albumId: string) {
  return `album:${albumId}:quantities`;
}

function safeParse(value: string | null): unknown {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function sanitizeQuantities(input: unknown): Quantities {
  if (!input || typeof input !== "object") return {};
  const obj = input as Record<string, unknown>;
  const out: Quantities = {};

  for (const [k, v] of Object.entries(obj)) {
    const id = String(k).trim();
    if (!id) continue;

    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) continue;

    const qty = Math.max(0, Math.min(99, Math.floor(n)));
    if (qty > 0) out[id] = qty;
  }
  return out;
}

export default function useAlbumState(albumId: string) {
  const [quantities, setQuantities] = React.useState<Quantities>({});

  // Carrega do localStorage ao montar (client-side)
  React.useEffect(() => {
    const key = storageKey(albumId);
    const raw = window.localStorage.getItem(key);
    const parsed = safeParse(raw);
    setQuantities(sanitizeQuantities(parsed));
  }, [albumId]);

  // Salva automaticamente
  React.useEffect(() => {
    const key = storageKey(albumId);
    window.localStorage.setItem(key, JSON.stringify(quantities));
  }, [albumId, quantities]);

  const inc = React.useCallback((id: string) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: (prev[id] ?? 0) + 1,
    }));
  }, []);

  const dec = React.useCallback((id: string) => {
    setQuantities((prev) => {
      const next = { ...prev };
      const q = Math.max(0, (next[id] ?? 0) - 1);
      if (q === 0) delete next[id];
      else next[id] = q;
      return next;
    });
  }, []);

  const reset = React.useCallback(() => {
    setQuantities({});
  }, []);

  return { quantities, inc, dec, reset };
}
