"use client";

import Link from "next/link";
import React from "react";
import type { AlbumDefinition, AlbumSection } from "@/types/album";
import { addCustomAlbum } from "@/utils/storage";

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isPositiveInt(n: unknown) {
  const x = Number(n);
  return Number.isInteger(x) && x > 0;
}

export default function NewAlbumPage() {
  const [name, setName] = React.useState("");
  const [id, setId] = React.useState("");

  const [sections, setSections] = React.useState<AlbumSection[]>([
    { id: "base", label: "Normais", type: "numericRange", start: 1, end: 574 },
  ]);

  const [msg, setMsg] = React.useState<string | null>(null);

  // id sugerido a partir do nome
  React.useEffect(() => {
    if (!id) setId(slugify(name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const addSection = (type: "numericRange" | "prefixedRange") => {
    const nextIndex = sections.length + 1;
    const baseId = `sec${nextIndex}`;

    const newSec: AlbumSection =
      type === "numericRange"
        ? { id: baseId, label: `Seção ${nextIndex}`, type: "numericRange", start: 1, end: 10 }
        : { id: baseId, label: `Seção ${nextIndex}`, type: "prefixedRange", prefix: "E", start: 1, end: 10 };

    setSections((prev) => [...prev, newSec]);
  };

  const removeSection = (secId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== secId));
  };

  const updateSection = (secId: string, patch: Partial<AlbumSection>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === secId ? ({ ...s, ...patch } as AlbumSection) : s))
    );
  };

  const validate = (): string | null => {
    if (!name.trim()) return "Informe o nome do álbum.";
    if (!id.trim()) return "Informe o ID (slug) do álbum.";
    if (sections.length === 0) return "Adicione ao menos uma seção.";

    // valida ranges
    for (const s of sections) {
      if (!s.label.trim()) return "Toda seção precisa de um nome (label).";
      if (!isPositiveInt((s as any).start) || !isPositiveInt((s as any).end)) return "Start/End precisam ser inteiros positivos.";
      const start = Number((s as any).start);
      const end = Number((s as any).end);
      if (start > end) return `Na seção "${s.label}", start não pode ser maior que end.`;

      if (s.type === "prefixedRange") {
        if (!s.prefix.trim()) return `Na seção "${s.label}", informe o prefixo (ex.: E, CB, F).`;
        // normalize prefix
        if (!/^[A-Za-z0-9]+$/.test(s.prefix)) return `Na seção "${s.label}", prefixo só pode ter letras/números.`;
      }
    }

    // valida conflito de IDs gerados (ex.: 1 e 01, ou E1 repetido)
    const seen = new Set<string>();
    for (const s of sections) {
      const start = Number((s as any).start);
      const end = Number((s as any).end);
      for (let i = start; i <= end; i++) {
        const stickerId = s.type === "numericRange" ? String(i) : `${s.prefix.toUpperCase()}${i}`;
        if (seen.has(stickerId)) return `ID duplicado gerado: "${stickerId}". Ajuste as seções.`;
        seen.add(stickerId);
      }
    }

    return null;
  };

  const onSave = () => {
    setMsg(null);
    const err = validate();
    if (err) {
      setMsg(`⚠️ ${err}`);
      return;
    }

    const album: AlbumDefinition = {
      id: id.trim(),
      name: name.trim(),
      sections: sections.map((s) => {
        if (s.type === "prefixedRange") {
          return { ...s, prefix: s.prefix.toUpperCase() };
        }
        return s;
      }),
    };

    addCustomAlbum(album);
    setMsg("✅ Álbum salvo! Ele já aparece na tela inicial.");
  };

  return (
    <main style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <Link
          href="/"
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.15)",
            background: "rgba(0,0,0,0.04)",
            textDecoration: "none",
            fontWeight: 900,
          }}
        >
          ← Voltar
        </Link>

        <div style={{ fontSize: 18, fontWeight: 950 }}>Criar álbum</div>

        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={onSave}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.15)",
              background: "rgba(0,0,0,0.85)",
              color: "white",
              fontWeight: 950,
              cursor: "pointer",
            }}
          >
            Salvar
          </button>
        </div>
      </div>

      {msg && (
        <div
          style={{
            marginBottom: 12,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.15)",
            background: "rgba(0,0,0,0.04)",
            fontWeight: 800,
          }}
        >
          {msg}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "1fr",
          marginBottom: 14,
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 16,
          padding: 14,
          background: "white",
          boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
        }}
      >
        <label style={{ fontWeight: 900 }}>Nome do álbum</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex.: Brasileirão 2025"
          style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.15)" }}
        />

        <label style={{ fontWeight: 900 }}>ID (slug)</label>
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="ex.: brasileirao-2025"
          style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.15)" }}
        />

        <div style={{ opacity: 0.75, fontWeight: 700 }}>
          Dica: o ID vira a URL: <span style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>/album/{id || "..."}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <button
          onClick={() => addSection("numericRange")}
          style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.15)", fontWeight: 900, cursor: "pointer" }}
        >
          + Seção numérica (1–N)
        </button>
        <button
          onClick={() => addSection("prefixedRange")}
          style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.15)", fontWeight: 900, cursor: "pointer" }}
        >
          + Seção prefixada (E1–EN)
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {sections.map((s) => (
          <div
            key={s.id}
            style={{
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 16,
              padding: 14,
              background: "white",
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 950 }}>
                {s.type === "numericRange" ? "Seção numérica" : "Seção prefixada"}
              </div>

              <button
                onClick={() => removeSection(s.id)}
                style={{
                  marginLeft: "auto",
                  padding: "8px 10px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.15)",
                  background: "rgba(220,38,38,0.10)",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
                disabled={sections.length <= 1}
                title={sections.length <= 1 ? "Mantenha ao menos uma seção" : "Remover seção"}
              >
                Remover
              </button>
            </div>

            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontWeight: 800 }}>Label</label>
                <input
                  value={s.label}
                  onChange={(e) => updateSection(s.id, { label: e.target.value } as any)}
                  style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.15)" }}
                />
              </div>

              {s.type === "prefixedRange" && (
                <div style={{ display: "grid", gap: 6 }}>
                  <label style={{ fontWeight: 800 }}>Prefixo</label>
                  <input
                    value={s.prefix}
                    onChange={(e) => updateSection(s.id, { prefix: e.target.value.toUpperCase() } as any)}
                    placeholder="ex.: E, CB, F"
                    style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.15)" }}
                  />
                </div>
              )}

              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontWeight: 800 }}>Start</label>
                <input
                  value={(s as any).start}
                  onChange={(e) => updateSection(s.id, { start: Number(e.target.value) } as any)}
                  inputMode="numeric"
                  style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.15)" }}
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontWeight: 800 }}>End</label>
                <input
                  value={(s as any).end}
                  onChange={(e) => updateSection(s.id, { end: Number(e.target.value) } as any)}
                  inputMode="numeric"
                  style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.15)" }}
                />
              </div>
            </div>

            <div style={{ marginTop: 10, opacity: 0.75, fontWeight: 700 }}>
              Exemplo de IDs:{" "}
              <span style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>
                {s.type === "numericRange" ? `${(s as any).start}, ${(s as any).start + 1}, ...` : `${s.prefix.toUpperCase()}${(s as any).start}, ${s.prefix.toUpperCase()}${(s as any).start + 1}, ...`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
