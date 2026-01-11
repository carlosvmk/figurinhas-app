"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";
import StickerGrid from "@/components/StickerGrid";
import useAlbumState from "@/hooks/useAlbumState";

const ALBUM = {
  id: "topps-ucl-2025-2026",
  name: "TOPPS UCL 2025/26",
  start: 1,
  end: 574,
};

type Mode = "add" | "remove";
type FilterMode = "all" | "missing" | "dups";

export default function AlbumPage() {
  const params = useParams<{ id: string }>();
  const albumId = params?.id || ALBUM.id;

  const { quantities, inc, dec, reset } = useAlbumState(albumId);

  const [mode, setMode] = React.useState<Mode>("add");
  const [filter, setFilter] = React.useState<FilterMode>("all");

  const [query, setQuery] = React.useState("");
  const [highlightId, setHighlightId] = React.useState<string | null>(null);

  const completas = Object.values(quantities).filter((q) => q >= 1).length;
  const faltam = ALBUM.end - ALBUM.start + 1 - completas;

  const total = ALBUM.end - ALBUM.start + 1;
  const percent = total === 0 ? 0 : Math.round((completas / total) * 1000) / 10; // 1 casa decimal
  const repetidasTipos = Object.values(quantities).filter((q) => q >= 2).length;


  const onReset = () => {
    if (confirm("Tem certeza que deseja zerar o álbum neste dispositivo?")) reset();
  };

  const toggleMode = () => {
    setMode((m) => (m === "add" ? "remove" : "add"));
  };

  const setFilterWithAutoMode = (next: FilterMode) => {
  setFilter(next);

  if (next === "missing") setMode("add");
  if (next === "dups") setMode("remove");
  // "all" não muda o modo
};


  const act = (id: string) => {
    if (mode === "add") inc(id);
    else dec(id);
  };

  const goTo = (raw: string) => {
    const n = Number(String(raw).trim());
    if (!Number.isFinite(n)) return;
    if (n < ALBUM.start || n > ALBUM.end) return;

    const id = String(Math.floor(n));
    const el = document.getElementById(`sticker-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      setHighlightId(id);
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

        <div style={{ fontSize: 18, fontWeight: 900 }}>{ALBUM.name}</div>

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
            href={`/album/${albumId}/listas`}
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

  {/* Barra de progresso */}
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
          inputMode="numeric"
          placeholder="ex: 143"
          style={{
            width: 120,
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.2)",
          }}
        />
        <button
          onClick={() => goTo(query)}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.15)",
            fontWeight: 800,
          }}
        >
          Ir
        </button>
      </div>

      {/* Filtro visual (AGORA DENTRO DO RETURN) */}
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
          Só faltantes
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
          Só repetidas
        </button>
      </div>

      <StickerGrid
        start={ALBUM.start}
        end={ALBUM.end}
        quantities={quantities}
        onAct={act}
        highlightId={highlightId ?? undefined}
        filter={filter}
      />
    </main>
  );
}
