"use client";

import React from "react";
import StickerCell from "./StickerCell";

type FilterMode = "all" | "missing" | "dups";

type StickerGridProps = {
  start: number;
  end: number;
  quantities: Record<string, number>;
  onAct: (id: string) => void;
  highlightId?: string;
  filter?: FilterMode;
};

export default function StickerGrid({
  start,
  end,
  quantities,
  onAct,
  highlightId,
  filter = "all",
}: StickerGridProps) {
  const ids = React.useMemo(() => {
    const arr: string[] = [];
    for (let i = start; i <= end; i++) arr.push(String(i));
    return arr;
  }, [start, end]);

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

        // “Filtro visual”: apagamos o que não é alvo
        const dim =
          filter === "all" ? false :
          filter === "missing" ? !isMissing :
          /* filter === "dups" */ !isDup;

        // opcional: desabilitar clique quando está apagado (evita erro)
        const disabled = dim;

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
