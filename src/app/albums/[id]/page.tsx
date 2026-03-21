"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";
import StickerGrid from "@/components/StickerGrid";
import useAlbumState from "@/hooks/useAlbumState";
import { getAlbumById } from "@/data/albums";
import { expandSection } from "@/utils/album";
import { loadCustomAlbums } from "@/utils/storage";
import type { AlbumDefinition } from "@/types/album";

const ONBOARDING_KEY = "figurinhas:onboarding:grid:v1";

export default function AlbumPage() {
  const params = useParams<{ id: string }>();
  const albumId = params?.id ?? "topps-ucl-2025-2026";

  const album: AlbumDefinition | undefined = React.useMemo(() => {
    const found = getAlbumById(albumId);
    if (found) return found;
    return loadCustomAlbums().find((a) => a.id === albumId);
  }, [albumId]);

  const { quantities, inc, dec, reset } = useAlbumState(albumId);

  const [filterMissing, setFilterMissing] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  React.useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true);
      const timer = setTimeout(() => {
        setShowOnboarding(false);
        localStorage.setItem(ONBOARDING_KEY, "1");
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem(ONBOARDING_KEY, "1");
  };

  const handleInc = (id: string) => {
    dismissOnboarding();
    inc(id);
  };

  const handleDec = (id: string) => {
    const qty = quantities[id] ?? 0;
    if (qty === 0) {
      try { navigator.vibrate([10, 10, 10]); } catch {}
      return;
    }
    try { navigator.vibrate(30); } catch {}
    dec(id);
  };

  // Contadores
  const allIds = React.useMemo(() => album?.sections.flatMap(expandSection) ?? [], [album]);
  const completas = React.useMemo(
    () => allIds.filter((id) => (quantities[id] ?? 0) >= 1).length,
    [allIds, quantities]
  );
  const total = allIds.length;
  const faltam = total - completas;
  const percent = total === 0 ? 0 : Math.round((completas / total) * 1000) / 10;
  const repetidasTipos = React.useMemo(
    () => allIds.reduce((sum, id) => {
      const q = quantities[id] ?? 0;
      return q >= 2 ? sum + (q - 1) : sum;
    }, 0),
    [allIds, quantities]
  );

  const onReset = () => {
    if (confirm("Tem certeza que deseja zerar o álbum neste dispositivo?")) reset();
  };

  if (!album) {
    return (
      <main className="p-4 max-w-[980px] mx-auto">
        <Link href="/" className="no-underline font-bold">← Álbuns</Link>
        <p className="mt-4">Álbum não encontrado.</p>
      </main>
    );
  }

  return (
    <main className="p-4 max-w-[980px] mx-auto">
      <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
        <Link
          href="/"
          className="px-3 py-2 rounded-[10px] border border-border-default no-underline font-bold"
        >
          ← Álbuns
        </Link>

        <div className="text-lg font-black">{album.name}</div>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setFilterMissing((v) => !v)}
            className={[
              "px-3 py-2 rounded-[10px] border font-bold text-sm transition-colors",
              filterMissing
                ? "bg-foreground text-background border-foreground"
                : "border-border-default opacity-70",
            ].join(" ")}
          >
            Faltam
          </button>

          <Link
            href={`/albums/${album.id}/listas`}
            className="px-3 py-2 rounded-[10px] border border-border-default no-underline font-extrabold"
          >
            Listas
          </Link>

          <button onClick={onReset} className="px-3 py-2 rounded-[10px]">
            Zerar
          </button>
        </div>
      </div>

      {/* Progresso */}
      <div className="mb-3">
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

      {/* Render por seção */}
      <div className="flex flex-col gap-4">
        {album.sections.map((section) => {
          const ids = expandSection(section);
          return (
            <section key={section.id}>
              <div className="font-black mb-2 text-sm opacity-85">
                {section.label}
              </div>

              <StickerGrid
                ids={ids}
                quantities={quantities}
                onInc={handleInc}
                onDec={handleDec}
                filterMissing={filterMissing}
              />
            </section>
          );
        })}
      </div>

      {/* Onboarding */}
      {showOnboarding && (
        <div
          onClick={dismissOnboarding}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full bg-foreground/90 text-background text-sm font-medium shadow-lg backdrop-blur-sm animate-fade-in"
        >
          Toque para adicionar · Segure para remover
        </div>
      )}
    </main>
  );
}
