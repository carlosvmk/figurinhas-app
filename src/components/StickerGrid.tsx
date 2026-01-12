"use client";

import React from "react";
import StickerCell from "./StickerCell";

type FilterMode = "all" | "missing" | "dups";

type StickerGridProps = {
  ids: string[];
  quantities: Record<string, number>;
  onAct: (id: string) => void;
  highlightId?: string;
  filter?: FilterMode;
};

export default function StickerGrid({
  ids,
  quantities,
  onAct,
  highlightId,
  filter = "all",
}: StickerGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))",
      }}
    >
      {ids.map((id) => {
        const qty = quantities[id] ?? 0;
        const isMissing = qty === 0;
        const isDup = qty >= 2;

        const dim =
          filter === "all"
            ? false
            : filter === "missing"
            ? !isMissing
            : !isDup;

        const disabled = dim; // se quiser permitir clicar mesmo apagado: troque por false

        return (
          <StickerCell
            key={id}
            id={id}
            qty={qty}
            onClick={() => onAct(id)}
            highlight={highlightId === id}
            dim={dim}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
}
