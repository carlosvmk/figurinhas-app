"use client";

import React from "react";
import StickerCell from "./StickerCell";

type StickerGridProps = {
  ids: string[];
  quantities: Record<string, number>;
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  filterMissing?: boolean;
};

export default function StickerGrid({
  ids,
  quantities,
  onInc,
  onDec,
  filterMissing = false,
}: StickerGridProps) {
  return (
    <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(44px,1fr))]">
      {ids.map((id) => {
        const qty = quantities[id] ?? 0;
        const dim = filterMissing && qty > 0;

        return (
          <StickerCell
            key={id}
            id={id}
            qty={qty}
            onTap={() => onInc(id)}
            onLongPress={() => onDec(id)}
            dim={dim}
          />
        );
      })}
    </div>
  );
}
