"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Quantities } from "@/types/album";

function storageKey(albumId: string) {
  return `album:${albumId}:quantities`;
}

function loadFromStorage(albumId: string): Quantities {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey(albumId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Quantities = {};
    for (const [k, v] of Object.entries(parsed)) {
      const id = String(k).trim();
      if (!id) continue;
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isFinite(n)) continue;
      const qty = Math.max(0, Math.min(99, Math.floor(n)));
      if (qty > 0) out[id] = qty;
    }
    return out;
  } catch {
    return {};
  }
}

export default function useAlbumState(albumId: string) {
  const albumIdRef = useRef(albumId);

  const [quantities, setQuantities] = useState<Quantities>(() =>
    loadFromStorage(albumId)
  );

  // Quando albumId muda, recarrega do localStorage
  useEffect(() => {
    if (albumIdRef.current !== albumId) {
      albumIdRef.current = albumId;
      setQuantities(loadFromStorage(albumId));
    }
  }, [albumId]);

  // Salva no localStorage sempre que quantities muda
  useEffect(() => {
    window.localStorage.setItem(
      storageKey(albumIdRef.current),
      JSON.stringify(quantities)
    );
  }, [quantities]);

  const inc = useCallback((id: string) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.min(99, (prev[id] ?? 0) + 1),
    }));
  }, []);

  const dec = useCallback((id: string) => {
    setQuantities((prev) => {
      const next = { ...prev };
      const q = Math.max(0, (next[id] ?? 0) - 1);
      if (q === 0) delete next[id];
      else next[id] = q;
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setQuantities({});
  }, []);

  const importQuantities = useCallback(
    (imported: Quantities) => {
      setQuantities((prev) => {
        const next = { ...prev };
        for (const [id, qty] of Object.entries(imported)) {
          next[id] = Math.min(99, (next[id] ?? 0) + qty);
        }
        return next;
      });
    },
    []
  );

  const removeQuantities = useCallback(
    (toRemove: Quantities) => {
      setQuantities((prev) => {
        const next = { ...prev };
        for (const [id, qty] of Object.entries(toRemove)) {
          const q = (next[id] ?? 0) - qty;
          if (q <= 0) delete next[id];
          else next[id] = q;
        }
        return next;
      });
    },
    []
  );

  return { quantities, inc, dec, reset, importQuantities, removeQuantities };
}
