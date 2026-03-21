"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";
import StickerGrid from "@/components/StickerGrid";
import useAlbumState from "@/hooks/useAlbumState";
import { expandSection } from "@/utils/album";
import { loadAlbums } from "@/utils/storage";
import { encodeShareData } from "@/utils/share";
import type { AlbumDefinition } from "@/types/album";

const ONBOARDING_KEY = "figurinhas:onboarding:grid:v1";

export default function AlbumPage() {
  const params = useParams<{ id: string }>();
  const albumId = params?.id ?? "topps-ucl-2025-2026";

  const album: AlbumDefinition | undefined = React.useMemo(() => {
    return loadAlbums().find((a) => a.id === albumId);
  }, [albumId]);

  const { quantities, inc, dec, reset } = useAlbumState(albumId);

  const [filterMissing, setFilterMissing] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = React.useState<string | null>(null);
  const shareLinkRef = React.useRef<HTMLInputElement>(null);

  const handleShare = () => {
    if (!album) return;
    const encoded = encodeShareData({
      albumId: album.id,
      albumName: album.name,
      quantities,
      sharedAt: new Date().toISOString(),
    });
    const url = `${window.location.origin}/share?d=${encoded}`;
    setShareUrl(url);
    setCopyFeedback(null);
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    // clipboard must be called synchronously inside click handler for iOS Safari
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).then(
        () => {
          setCopyFeedback("Copiado!");
          setTimeout(() => setCopyFeedback(null), 2000);
        },
        () => {
          // clipboard failed (iOS restriction) — select text as fallback
          shareLinkRef.current?.select();
          setCopyFeedback("Selecione e copie");
        }
      );
    } else {
      shareLinkRef.current?.select();
      setCopyFeedback("Selecione e copie");
    }
  };

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

        <div className="ml-auto flex flex-wrap gap-2">
          <button
            onClick={handleShare}
            className="px-3 py-2 rounded-[10px] border border-border-default font-bold text-sm opacity-70 transition-colors"
          >
            Compartilhar
          </button>

          <Link
            href={`/compare?albumId=${album.id}`}
            className="px-3 py-2 rounded-[10px] border border-border-default no-underline font-bold text-sm opacity-70 transition-colors"
          >
            Comparar
          </Link>

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

      {/* Modal de compartilhamento */}
      {shareUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background rounded-2xl p-5 mx-4 max-w-md w-full shadow-xl">
            <p className="font-bold mb-2 text-sm">Link do álbum:</p>
            <div className="flex gap-2 items-center">
              <input
                ref={shareLinkRef}
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 min-w-0 p-2.5 rounded-lg border border-border-default text-sm font-mono bg-foreground/5 cursor-default outline-none select-all"
                onFocus={(e) => e.target.select()}
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2.5 rounded-lg bg-foreground text-background font-bold text-sm whitespace-nowrap shrink-0"
              >
                {copyFeedback === "Copiado!" ? "Copiado!" : "Copiar"}
              </button>
            </div>
            {copyFeedback === "Selecione e copie" && (
              <p className="mt-2 text-xs opacity-60">Selecione e copie</p>
            )}
            <button
              onClick={() => { setShareUrl(null); setCopyFeedback(null); }}
              className="mt-3 w-full py-2 rounded-lg border border-border-default font-bold text-sm opacity-70"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

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
