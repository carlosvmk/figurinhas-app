"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { decodeShareData, type SharedData } from "@/utils/share";
import { getAlbumById } from "@/data/albums";
import { loadCustomAlbums } from "@/utils/storage";
import { expandSection } from "@/utils/album";
import StickerCellReadonly from "@/components/StickerCellReadonly";
import type { AlbumDefinition } from "@/types/album";

export default function SharePage() {
  return (
    <React.Suspense fallback={<main className="p-4 max-w-[980px] mx-auto"><p className="opacity-60">Carregando...</p></main>}>
      <SharePageInner />
    </React.Suspense>
  );
}

function SharePageInner() {
  const searchParams = useSearchParams();
  const [data, setData] = React.useState<SharedData | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    const encoded = searchParams.get("d");
    if (!encoded) {
      setError(true);
      return;
    }
    const decoded = decodeShareData(encoded);
    if (!decoded) {
      setError(true);
      return;
    }
    setData(decoded);
  }, [searchParams]);

  if (error) {
    return (
      <main className="p-4 max-w-[980px] mx-auto">
        <h1 className="text-lg font-black mb-4">Link inválido</h1>
        <p className="opacity-85 mb-4">
          Este link de compartilhamento está corrompido ou expirado.
        </p>
        <Link
          href="/"
          className="px-4 py-2.5 rounded-[10px] bg-foreground text-background font-bold no-underline inline-block"
        >
          Abrir meu álbum
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="p-4 max-w-[980px] mx-auto">
        <p className="opacity-60">Carregando...</p>
      </main>
    );
  }

  return <ShareView data={data} />;
}

function ShareView({ data }: { data: SharedData }) {
  const { albumId, albumName, quantities, sharedAt } = data;

  // Try to find album definition for sections
  const album: AlbumDefinition | undefined = React.useMemo(() => {
    const found = getAlbumById(albumId);
    if (found) return found;
    return loadCustomAlbums().find((a) => a.id === albumId);
  }, [albumId]);

  // Build sticker IDs from album sections or from quantities keys
  const allIds = React.useMemo(() => {
    if (album) return album.sections.flatMap(expandSection);
    // Fallback: use quantities keys sorted
    return Object.keys(quantities).sort((a, b) => {
      const na = parseInt(a), nb = parseInt(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
  }, [album, quantities]);

  const completas = allIds.filter((id) => (quantities[id] ?? 0) >= 1).length;
  const total = allIds.length;
  const faltam = total - completas;
  const percent = total === 0 ? 0 : Math.round((completas / total) * 1000) / 10;
  const repetidasTipos = allIds.reduce((sum, id) => {
    const q = quantities[id] ?? 0;
    return q >= 2 ? sum + (q - 1) : sum;
  }, 0);

  const missingIds = allIds.filter((id) => (quantities[id] ?? 0) === 0);
  const dupIds = allIds.filter((id) => (quantities[id] ?? 0) >= 2);

  const [showMissing, setShowMissing] = React.useState(false);
  const [showDups, setShowDups] = React.useState(false);

  const dateStr = React.useMemo(() => {
    try {
      return new Date(sharedAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }, [sharedAt]);

  return (
    <main className="p-4 max-w-[980px] mx-auto">
      <div className="mb-4">
        <h1 className="text-lg font-black">{albumName}</h1>
        {dateStr && (
          <p className="text-sm opacity-60 mt-0.5">Atualizado em {dateStr}</p>
        )}
      </div>

      {/* Contadores */}
      <div className="mb-4">
        <div className="flex gap-3 flex-wrap items-baseline mb-2">
          <span className="opacity-85">
            Completas: <b>{completas}</b> / {total} ({percent}%)
          </span>
          <span className="opacity-85">
            Faltam: <b>{faltam}</b>
          </span>
          <span className="opacity-85">
            Repetidas: <b>{repetidasTipos}</b>
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex flex-col gap-4 mb-6">
        {album ? (
          album.sections.map((section) => {
            const ids = expandSection(section);
            return (
              <section key={section.id}>
                <div className="font-black mb-2 text-sm opacity-85">
                  {section.label}
                </div>
                <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(44px,1fr))]">
                  {ids.map((id) => (
                    <StickerCellReadonly key={id} id={id} qty={quantities[id] ?? 0} />
                  ))}
                </div>
              </section>
            );
          })
        ) : (
          <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(44px,1fr))]">
            {allIds.map((id) => (
              <StickerCellReadonly key={id} id={id} qty={quantities[id] ?? 0} />
            ))}
          </div>
        )}
      </div>

      {/* Listas colapsáveis */}
      {missingIds.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowMissing((v) => !v)}
            className="font-bold text-sm opacity-85 cursor-pointer"
          >
            {showMissing ? "▾" : "▸"} Faltantes ({missingIds.length})
          </button>
          {showMissing && (
            <p className="mt-1.5 text-sm opacity-75 leading-relaxed">
              {missingIds.join(", ")}
            </p>
          )}
        </div>
      )}

      {dupIds.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowDups((v) => !v)}
            className="font-bold text-sm opacity-85 cursor-pointer"
          >
            {showDups ? "▾" : "▸"} Repetidas ({dupIds.length})
          </button>
          {showDups && (
            <p className="mt-1.5 text-sm opacity-75 leading-relaxed">
              {dupIds.map((id) => {
                const q = quantities[id] ?? 0;
                return `${id}(x${q})`;
              }).join(", ")}
            </p>
          )}
        </div>
      )}

      {/* CTA */}
      <div className="mt-8 text-center">
        <Link
          href="/"
          className="px-4 py-2.5 rounded-[10px] bg-foreground text-background font-bold no-underline inline-block"
        >
          Abrir meu álbum
        </Link>
      </div>
    </main>
  );
}
