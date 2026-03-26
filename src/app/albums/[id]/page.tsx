"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";
import StickerGrid from "@/components/StickerGrid";
import useAlbumState from "@/hooks/useAlbumState";
import { expandSection } from "@/utils/album";
import { getDuplicates, getDuplicateStats } from "@/utils/lists";
import { loadAlbums } from "@/utils/storage";
import type { AlbumDefinition } from "@/types/album";

const ONBOARDING_KEY = "figurinhas:onboarding:grid:v1";

export default function AlbumPage() {
  const params = useParams<{ id: string }>();
  const albumId = params?.id ?? "topps-ucl-2025-2026";

  const album: AlbumDefinition | undefined = React.useMemo(() => {
    return loadAlbums().find((a) => a.id === albumId);
  }, [albumId]);

  const { quantities, inc, dec, importQuantities, removeQuantities } = useAlbumState(albumId);

  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [showImportModal, setShowImportModal] = React.useState(false);
  const [importText, setImportText] = React.useState("");
  const [importToast, setImportToast] = React.useState("");
  const [modalTab, setModalTab] = React.useState<"add" | "remove">("add");

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
  const dups = React.useMemo(() => getDuplicates(quantities), [quantities]);
  const { repetidasTotal, repetidasDiferentes } = React.useMemo(() => getDuplicateStats(dups), [dups]);

  // Parsing da lista importada
  const importPreview = React.useMemo(() => {
    if (!importText.trim()) return null;
    const validIds = new Set(allIds);
    const tokens = importText.split(/[\s,;\n\r\t]+/).filter(Boolean);
    const parsed: Record<string, number> = {};
    const ignored: string[] = [];
    for (const raw of tokens) {
      const id = raw.toUpperCase();
      if (validIds.has(id)) {
        parsed[id] = (parsed[id] ?? 0) + 1;
      } else {
        if (!ignored.includes(raw)) ignored.push(raw);
      }
    }
    const recognized = Object.keys(parsed).length;
    const totalCount = Object.values(parsed).reduce((a, b) => a + b, 0);
    return { parsed, recognized, totalCount, ignored };
  }, [importText, allIds]);

  const removePreview = React.useMemo(() => {
    if (modalTab !== "remove" || !importPreview) return null;
    const problematic: string[] = [];
    const safe: string[] = [];
    for (const [id, qty] of Object.entries(importPreview.parsed)) {
      const current = quantities[id] ?? 0;
      if (current < qty || current - qty < 1) {
        problematic.push(id);
      } else {
        safe.push(id);
      }
    }
    return { problematic, safe };
  }, [modalTab, importPreview, quantities]);

  const handleRemove = () => {
    if (!importPreview || !removePreview || removePreview.problematic.length > 0) return;
    removeQuantities(importPreview.parsed);
    const count = importPreview.totalCount;
    setShowImportModal(false);
    setImportText("");
    setModalTab("add");
    setImportToast(`${count} figurinhas removidas`);
    setTimeout(() => setImportToast(""), 3000);
  };

  const handleImport = () => {
    if (!importPreview) return;
    importQuantities(importPreview.parsed);
    const count = importPreview.totalCount;
    setShowImportModal(false);
    setImportText("");
    setImportToast(`${count} figurinhas adicionadas`);
    setTimeout(() => setImportToast(""), 3000);
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
            onClick={() => setShowImportModal(true)}
            className="px-3 py-2 rounded-[10px] border border-border-default font-extrabold cursor-pointer bg-transparent text-[var(--fg)]"
          >
            Gerenciar por lista
          </button>
          <Link
            href={`/albums/${album.id}/listas`}
            className="px-3 py-2 rounded-[10px] border border-border-default no-underline font-extrabold"
          >
            Gerar Lista
          </Link>
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
            Repetidas: <b>{repetidasTotal}</b> ({repetidasDiferentes} diferentes)
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
              />
            </section>
          );
        })}
      </div>

      {/* Modal Importar/Remover Lista */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border-default rounded-2xl p-6 max-w-sm w-[calc(100%-2rem)] shadow-lg flex flex-col gap-4">
            {/* Tabs */}
            <div className="flex gap-0 border border-border-default rounded-xl overflow-hidden">
              <button
                onClick={() => { setModalTab("add"); setImportText(""); }}
                className={`flex-1 py-2 text-sm font-extrabold cursor-pointer border-none ${
                  modalTab === "add"
                    ? "bg-blue-600 text-white"
                    : "bg-transparent text-[var(--fg)] opacity-60"
                }`}
              >
                Adicionar
              </button>
              <button
                onClick={() => { setModalTab("remove"); setImportText(""); }}
                className={`flex-1 py-2 text-sm font-extrabold cursor-pointer border-none ${
                  modalTab === "remove"
                    ? "bg-red-600 text-white"
                    : "bg-transparent text-[var(--fg)] opacity-60"
                }`}
              >
                Remover
              </button>
            </div>

            <textarea
              autoFocus
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Cole sua lista aqui: 1, 2, 5, 8, 8, 12, F1, F3..."
              className="w-full h-32 p-3 rounded-xl border border-border-default bg-[var(--bg)] text-[var(--fg)] resize-y text-sm"
            />

            {importPreview && (
              <div className="text-sm flex flex-col gap-1">
                <span>
                  <b>{importPreview.totalCount}</b> figurinhas reconhecidas ({importPreview.recognized} diferentes)
                </span>
                {importPreview.ignored.length > 0 && (
                  <span className="text-red-500">
                    {importPreview.ignored.length} não reconhecida{importPreview.ignored.length > 1 ? "s" : ""}: {importPreview.ignored.slice(0, 10).join(", ")}{importPreview.ignored.length > 10 ? "…" : ""}
                  </span>
                )}
                {modalTab === "remove" && removePreview && removePreview.problematic.length > 0 && (
                  <span className="text-red-500 bg-red-500/10 rounded-lg px-2.5 py-2 mt-1 block">
                    {removePreview.problematic.length} figurinha{removePreview.problematic.length > 1 ? "s" : ""} não pode{removePreview.problematic.length > 1 ? "m" : ""} ser removida{removePreview.problematic.length > 1 ? "s" : ""} pois não {removePreview.problematic.length > 1 ? "são repetidas" : "é repetida"}:{" "}
                    {removePreview.problematic.slice(0, 15).join(", ")}{removePreview.problematic.length > 15 ? "…" : ""}
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              {modalTab === "add" ? (
                <button
                  disabled={!importPreview || importPreview.recognized === 0}
                  onClick={handleImport}
                  className="w-full py-2.5 rounded-xl border border-border-default font-extrabold cursor-pointer bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Adicionar
                </button>
              ) : (
                <button
                  disabled={!importPreview || importPreview.recognized === 0 || (removePreview?.problematic.length ?? 0) > 0}
                  onClick={handleRemove}
                  className="w-full py-2.5 rounded-xl border border-border-default font-extrabold cursor-pointer bg-red-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Remover
                </button>
              )}
              <button
                onClick={() => { setShowImportModal(false); setImportText(""); setModalTab("add"); }}
                className="w-full py-2.5 rounded-xl border border-border-default font-extrabold cursor-pointer bg-transparent text-[var(--fg)]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de importação */}
      {importToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl bg-foreground/90 text-background text-sm font-bold shadow-lg backdrop-blur-sm animate-fade-in z-50">
          {importToast}
        </div>
      )}

      {/* Onboarding */}
      {showOnboarding && !importToast && (
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
