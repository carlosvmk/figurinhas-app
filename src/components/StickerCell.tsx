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
  const bgClass = qty === 0 ? "bg-sticker-missing" : qty === 1 ? "bg-sticker-have" : "bg-sticker-dup";
  const fgClass = qty === 0 ? "text-gray-900" : "text-white";

  return (
    <button
      id={`sticker-${id}`}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Figurinha ${id}. Quantidade ${qty}`}
      className={[
        "relative w-full aspect-square rounded-[10px] text-sm font-extrabold select-none",
        bgClass,
        fgClass,
        highlight
          ? "border-3 border-sticker-highlight shadow-[0_0_0_4px_rgba(245,158,11,0.35)]"
          : "border border-black/12",
        dim ? "opacity-25 grayscale-[35%]" : "",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      {id}

      {qty >= 2 && (
        <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1.5 rounded-full bg-white/95 text-gray-900 text-xs leading-[18px] font-black">
          {qty}
        </span>
      )}
    </button>
  );
}
