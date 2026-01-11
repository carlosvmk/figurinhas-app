"use client";

type StickerCellProps = {
  id: string;
  qty: number;
  onClick: () => void;
  highlight?: boolean;
  dim?: boolean;
  disabled?: boolean;
};

export default function StickerCell({ id, qty, onClick, highlight, dim, disabled }: StickerCellProps) {
  const bg = qty === 0 ? "#e5e7eb" : qty === 1 ? "#22c55e" : "#3b82f6";
  const fg = qty === 0 ? "#111827" : "#ffffff";

  return (
    <button
      id={`sticker-${id}`}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Figurinha ${id}. Quantidade ${qty}`}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        borderRadius: 10,
        border: highlight ? "3px solid #f59e0b" : "1px solid rgba(0,0,0,0.12)",
        boxShadow: highlight ? "0 0 0 4px rgba(245, 158, 11, 0.35)" : "none",
        background: bg,
        color: fg,
        fontWeight: 800,
        fontSize: 14,
        cursor: disabled ? "not-allowed" : "pointer",
        userSelect: "none",
        opacity: dim ? 0.25 : 1,
        filter: dim ? "grayscale(35%)" : "none",
      }}
    >
      {id}

      {qty >= 2 && (
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            minWidth: 18,
            height: 18,
            padding: "0 6px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.95)",
            color: "#111827",
            fontSize: 12,
            lineHeight: "18px",
            fontWeight: 900,
          }}
        >
          {qty}
        </span>
      )}
    </button>
  );
}
