"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";
import StickerGrid from "@/components/StickerGrid";
import useAlbumState from "@/hooks/useAlbumState";
import { getAlbumById } from "@/data/albums";
import { expandSection } from "@/utils/album";
import type { AlbumDefinition } from "@/types/album";

type Mode = "add" | "remove";
type FilterMode = "all" | "missing" | "dups";

export default function AlbumPage() {
  const params = useParams<{ id: string }>();
  const albumId = params?.id ?? "topps-ucl-2025-2026";

  const album: AlbumDefinition =
    getAlbumById(albumId) ??
    getAlbumById("topps-ucl-2025-2026")!;

  const { quantities, inc, dec, reset } = useAlbumState(album.id);

  const [mode, setMode] = React.useState<Mode>("add");
  const [filter, setFilter] = React.useState<FilterMode>("all");

  const [query, setQuery] = React.useState("");
  const [highlightId, setHighlightId] = React.useState<string | null>(null);

  // Contadores considerando todas as seções
  const allIds = React.useMemo(() => album.sections.flatMap(expandSection), [album]);
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

  return (
    <main style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <Link
          href="/"
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.15)",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          ← Álbuns
        </Link>

        <div style={{ fontSize: 18, fontWeight: 900 }}>{album.name}</div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            onClick={toggleMode}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.15)",
              fontWeight: 900,
              background: mode === "add" ? "#16a34a" : "#dc2626",
              color: "white",
            }}
          >
            Modo: {mode === "add" ? "Adicionar" : "Remover"}
          </button>

          <Link
            href={`/album/${album.id}/listas`}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.15)",
              textDecoration: "none",
              fontWeight: 800,
            }}
          >
            Listas (troca)
          </Link>

          <button onClick={onReset} style={{ padding: "8px 12px", borderRadius: 10 }}>
            Zerar
          </button>
        </div>
      </div>

      {/* Progresso */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ opacity: 0.85 }}>
            Completas: <b>{completas}</b> / {total} ({percent}%)
          </span>
          <span style={{ opacity: 0.85 }}>
            Faltam: <b>{faltam}</b>
          </span>
          <span style={{ opacity: 0.85 }}>
            Repetidas (tipos): <b>{repetidasTipos}</b>
          </span>
          <span style={{ opacity: 0.85 }}>
            Clique para <b>{mode === "add" ? "+1" : "−1"}</b>
          </span>
        </div>

        <div
          style={{
            width: "100%",
            height: 12,
            borderRadius: 999,
            background: "rgba(0,0,0,0.10)",
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,0.12)",
          }}
          aria-label={`Progresso: ${percent}%`}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min(100, Math.max(0, percent))}%`,
              background: "rgba(0,0,0,0.55)",
            }}
          />
        </div>
      </div>

      {/* Busca */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <label style={{ fontWeight: 700, opacity: 0.85 }}>Ir para:</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") goTo(query);
          }}
          placeholder="ex: 143 ou F12"
          style={{
            width: 160,
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.2)",
          }}
        />
        <button
          onClick={() => goTo(query)}
          style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)", fontWeight: 800 }}
        >
          Ir
        </button>
      </div>

      {/* Filtro + auto-modo */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button
          onClick={() => setFilterWithAutoMode("all")}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.15)",
            fontWeight: filter === "all" ? 900 : 700,
            opacity: filter === "all" ? 1 : 0.75,
          }}
        >
          Todas
        </button>

        <button
          onClick={() => setFilterWithAutoMode("missing")}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.15)",
            fontWeight: filter === "missing" ? 900 : 700,
            opacity: filter === "missing" ? 1 : 0.75,
          }}
        >
          Só faltantes (auto +)
        </button>

        <button
          onClick={() => setFilterWithAutoMode("dups")}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.15)",
            fontWeight: filter === "dups" ? 900 : 700,
            opacity: filter === "dups" ? 1 : 0.75,
          }}
        >
          Só repetidas (auto −)
        </button>
      </div>

      {/* Render por seção */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {album.sections.map((section) => {
          const ids = expandSection(section);
          return (
            <section key={section.id}>
              <div style={{ fontWeight: 900, marginBottom: 8, fontSize: 14, opacity: 0.85 }}>
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
