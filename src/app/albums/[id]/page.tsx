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

type Mode = "add" | "remove";
type FilterMode = "all" | "missing" | "dups";

export default function AlbumPage() {
  const params = useParams<{ id: string }>();
  const albumId = params?.id ?? "topps-ucl-2025-2026";

  const album: AlbumDefinition | undefined = React.useMemo(() => {
    const found = getAlbumById(albumId);
    if (found) return found;
    return loadCustomAlbums().find((a) => a.id === albumId);
  }, [albumId]);

  const { quantities, inc, dec, reset } = useAlbumState(albumId);

  const [mode, setMode] = React.useState<Mode>("add");
  const [filter, setFilter] = React.useState<FilterMode>("all");

  const [query, setQuery] = React.useState("");
  const [highlightId, setHighlightId] = React.useState<string | null>(null);

  // Contadores considerando todas as seções
  const allIds = React.useMemo(() => album?.sections.flatMap(expandSection) ?? [], [album]);
  const completas = React.useMemo(
    () => allIds.filter((id) => (quantities[id] ?? 0) >= 1).length,
    [allIds, quantities]
  );
  const total = allIds.length;
  const faltam = total - completas;
  const percent = total === 0 ? 0 : Math.round((completas / total) * 1000) / 10;
  const repetidasTipos = React.useMemo(
    () => allIds.filter((id) => (quantities[id] ?? 0) >= 2).length,
    [allIds, quantities]
  );

  const onReset = () => {
    if (confirm("Tem certeza que deseja zerar o álbum neste dispositivo?")) reset();
  };

  const toggleMode = () => {
    setMode((m) => (m === "add" ? "remove" : "add"));
  };

  const act = (id: string) => {
    if (mode === "add") inc(id);
    else dec(id);
  };

  const setFilterWithAutoMode = (next: FilterMode) => {
    setFilter(next);
    if (next === "missing") setMode("add");
    if (next === "dups") setMode("remove");
  };

  const goTo = (raw: string) => {
    const v = String(raw).trim().toUpperCase();
    if (!v) return;

    // aceita "143" e também "F12" etc.
    const normalized = v;

    const el = document.getElementById(`sticker-${normalized}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      setHighlightId(normalized);
      window.setTimeout(() => setHighlightId(null), 1500);
    }
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
            onClick={toggleMode}
            className={[
              "px-3 py-2 rounded-[10px] border border-border-default font-black text-white",
              mode === "add" ? "bg-mode-add" : "bg-mode-remove",
            ].join(" ")}
          >
            Modo: {mode === "add" ? "Adicionar" : "Remover"}
          </button>

          <Link
            href={`/albums/${album.id}/listas`}
            className="px-3 py-2 rounded-[10px] border border-border-default no-underline font-extrabold"
          >
            Listas (troca)
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
            Repetidas (tipos): <b>{repetidasTipos}</b>
          </span>
          <span className="opacity-85">
            Clique para <b>{mode === "add" ? "+1" : "−1"}</b>
          </span>
        </div>

        <div
          className="w-full h-3 rounded-full bg-black/10 overflow-hidden border border-black/12"
          aria-label={`Progresso: ${percent}%`}
        >
          <div
            className="h-full bg-black/55"
            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          />
        </div>
      </div>

      {/* Busca */}
      <div className="flex gap-2 items-center mb-3 flex-wrap">
        <label className="font-bold opacity-85">Ir para:</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") goTo(query);
          }}
          placeholder="ex: 143 ou F12"
          className="w-40 px-2.5 py-2 rounded-[10px] border border-black/20"
        />
        <button
          onClick={() => goTo(query)}
          className="px-3 py-2 rounded-[10px] border border-border-default font-extrabold"
        >
          Ir
        </button>
      </div>

      {/* Filtro + auto-modo */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {(["all", "missing", "dups"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterWithAutoMode(f)}
            className={[
              "px-3 py-2 rounded-[10px] border border-border-default",
              filter === f ? "font-black opacity-100" : "font-bold opacity-75",
            ].join(" ")}
          >
            {f === "all" ? "Todas" : f === "missing" ? "Só faltantes (auto +)" : "Só repetidas (auto −)"}
          </button>
        ))}
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
                onAct={act}
                highlightId={highlightId ?? undefined}
                filter={filter}
              />
            </section>
          );
        })}
      </div>
    </main>
  );
}
