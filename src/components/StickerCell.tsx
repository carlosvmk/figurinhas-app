"use client";

import React from "react";

type StickerCellProps = {
  id: string;
  qty: number;
  onTap: () => void;
  onLongPress: () => void;
  dim?: boolean;
};

export default function StickerCell({ id, qty, onTap, onLongPress, dim }: StickerCellProps) {
  const bgClass = qty === 0 ? "bg-sticker-missing" : qty === 1 ? "bg-sticker-have" : "bg-sticker-dup";
  const fgClass = qty === 0 ? "text-gray-900" : "text-white";

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = React.useRef(false);
  const [pulse, setPulse] = React.useState(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startPress = () => {
    console.log("[StickerCell] touchstart/mousedown", id);
    firedRef.current = false;
    timerRef.current = setTimeout(() => {
      console.log("[StickerCell] LONG PRESS ativado", id);
      firedRef.current = true;
      // Haptic feedback (progressive enhancement — não existe no iOS Safari)
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(30);
      }
      onLongPress();
      setPulse(true);
    }, 500);
  };

  const endPress = () => {
    console.log("[StickerCell] touchend/mouseup", id, "fired:", firedRef.current);
    clearTimer();
    if (!firedRef.current) {
      console.log("[StickerCell] TAP ativado", id);
      onTap();
    }
  };

  const cancelPress = () => {
    clearTimer();
    firedRef.current = true; // prevent tap from firing
  };

  return (
    <button
      id={`sticker-${id}`}
      type="button"
      aria-label={`Figurinha ${id}. Quantidade ${qty}`}
      onTouchStart={startPress}
      onTouchEnd={(e) => { e.preventDefault(); endPress(); }}
      onTouchMove={cancelPress}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={cancelPress}
      onContextMenu={(e) => e.preventDefault()}
      onAnimationEnd={() => setPulse(false)}
      className={[
        "group relative w-full aspect-square rounded-[10px] text-sm font-extrabold select-none cursor-pointer",
        "border border-black/12 transition-transform duration-150",
        bgClass,
        fgClass,
        dim ? "opacity-25 grayscale-[35%]" : "",
        pulse ? "animate-sticker-pulse" : "",
      ].join(" ")}
    >
      {id}

      {qty >= 2 && (
        <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1.5 rounded-full bg-white/95 text-gray-900 text-xs leading-[18px] font-black">
          {qty}
        </span>
      )}

      {/* Desktop: botão − no hover */}
      {qty > 0 && (
        <span
          onClick={(e) => { e.stopPropagation(); onLongPress(); }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          className="hidden group-hover:flex absolute -top-1.5 -right-1.5 w-5 h-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-black cursor-pointer leading-none"
        >
          −
        </span>
      )}
    </button>
  );
}
