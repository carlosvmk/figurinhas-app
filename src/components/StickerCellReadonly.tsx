type Props = {
  id: string;
  qty: number;
};

export default function StickerCellReadonly({ id, qty }: Props) {
  const bgClass = qty === 0 ? "bg-sticker-missing" : qty === 1 ? "bg-sticker-have" : "bg-sticker-dup";
  const fgClass = qty === 0 ? "text-gray-900" : "text-white";

  return (
    <div
      className={[
        "relative w-full aspect-square rounded-[10px] text-sm font-extrabold select-none",
        "border border-black/12 flex items-center justify-center",
        bgClass,
        fgClass,
      ].join(" ")}
    >
      {id}

      {qty >= 2 && (
        <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1.5 rounded-full bg-white/95 text-gray-900 text-xs leading-[18px] font-black">
          {qty}
        </span>
      )}
    </div>
  );
}
