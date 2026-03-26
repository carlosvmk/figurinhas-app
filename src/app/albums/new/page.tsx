"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import React, { Suspense } from "react";
import type { AlbumDefinition, AlbumSection } from "@/types/album";
import { addAlbum, loadAlbums, updateAlbum } from "@/utils/storage";

export default function NewAlbumPage() {
  return (
    <Suspense>
      <NewAlbumForm />
    </Suspense>
  );
}

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

function NewAlbumForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("edit");

  const editAlbum = React.useMemo(() => {
    if (!editId) return null;
    return loadAlbums().find((a) => a.id === editId) ?? null;
  }, [editId]);

  const isEditing = !!editAlbum;

  const [name, setName] = React.useState(editAlbum?.name ?? "");

  const [sections, setSections] = React.useState<AlbumSection[]>(
    editAlbum?.sections ?? [
      { id: "base", label: "Normais", type: "numericRange", start: 1, end: 574 },
    ]
  );

  const [msg, setMsg] = React.useState<string | null>(null);

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

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    setSections((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const validate = (): string | null => {
    if (!name.trim()) return "Informe o nome do álbum.";
    if (sections.length === 0) return "Adicione ao menos uma seção.";

    // valida ranges
    for (const s of sections) {
      if (!s.label.trim()) return "Toda seção precisa de um nome.";
      if (!isPositiveInt((s as any).start) || !isPositiveInt((s as any).end)) return "Início/Fim precisam ser inteiros positivos.";
      const start = Number((s as any).start);
      const end = Number((s as any).end);
      if (start > end) return `Na seção "${s.label}", início não pode ser maior que fim.`;

      if (s.type === "prefixedRange") {
        if (!s.prefix.trim()) return `Na seção "${s.label}", informe o prefixo (ex.: E, CB, F).`;
        if (!/^[A-Za-z0-9]+$/.test(s.prefix)) return `Na seção "${s.label}", prefixo só pode ter letras/números.`;
      }
    }

    // valida conflito de IDs gerados
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

    const albumId = isEditing ? editAlbum!.id : slugify(name);

    const album: AlbumDefinition = {
      id: albumId,
      name: name.trim(),
      sections: sections.map((s) => {
        if (s.type === "prefixedRange") {
          return { ...s, prefix: s.prefix.toUpperCase() };
        }
        return s;
      }),
    };

    if (isEditing) {
      updateAlbum(album);
      router.push("/");
    } else {
      addAlbum(album);
      setMsg("✅ Álbum salvo! Ele já aparece na tela inicial.");
    }
  };

  return (
    <main className="p-4 max-w-[980px] mx-auto">
      <div className="flex items-center gap-2.5 mb-3 flex-wrap">
        <Link
          href="/"
          className="px-3.5 py-2.5 rounded-xl border border-border-default bg-black/[0.04] no-underline font-black"
        >
          ← Voltar
        </Link>

        <div className="text-lg font-[950]">{isEditing ? "Editar álbum" : "Criar álbum"}</div>

        <div className="ml-auto">
          <button
            onClick={onSave}
            className="px-3.5 py-2.5 rounded-xl border border-border-default bg-black/85 text-white font-[950] cursor-pointer"
          >
            Salvar
          </button>
        </div>
      </div>

      {msg && (
        <div className="mb-3 px-3 py-2.5 rounded-xl border border-border-default bg-black/[0.04] font-extrabold">
          {msg}
        </div>
      )}

      <div className="grid gap-3 mb-3.5 border border-black/12 rounded-2xl p-3.5 bg-card shadow-card">
        <label className="font-black">Nome do álbum</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex.: Brasileirão 2025"
          className="px-3 py-2.5 rounded-xl border border-border-default"
        />
      </div>

      <div className="flex gap-2 flex-wrap mb-2.5">
        <button
          onClick={() => addSection("numericRange")}
          className="px-3.5 py-2.5 rounded-xl border border-border-default font-black cursor-pointer"
        >
          + Seção numérica (1–N)
        </button>
        <button
          onClick={() => addSection("prefixedRange")}
          className="px-3.5 py-2.5 rounded-xl border border-border-default font-black cursor-pointer"
        >
          + Seção prefixada (E1–EN)
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {sections.map((s, i) => (
          <div
            key={s.id}
            className="border border-black/12 rounded-2xl p-3.5 bg-card shadow-card"
          >
            <div className="flex gap-2.5 items-center mb-2.5 flex-wrap">
              <div className="font-[950]">
                {s.type === "numericRange" ? "Seção numérica" : "Seção prefixada"}
              </div>

              <div className="ml-auto flex gap-1.5">
                <button
                  onClick={() => moveSection(i, -1)}
                  disabled={i === 0}
                  className="px-2 py-1.5 rounded-lg border border-border-default font-black cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-transparent text-inherit"
                  title="Mover para cima"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveSection(i, 1)}
                  disabled={i === sections.length - 1}
                  className="px-2 py-1.5 rounded-lg border border-border-default font-black cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-transparent text-inherit"
                  title="Mover para baixo"
                >
                  ↓
                </button>
                <button
                  onClick={() => removeSection(s.id)}
                  className="px-2.5 py-2 rounded-xl border border-border-default bg-red-600/10 font-black cursor-pointer"
                  disabled={sections.length <= 1}
                  title={sections.length <= 1 ? "Mantenha ao menos uma seção" : "Remover seção"}
                >
                  Remover
                </button>
              </div>
            </div>

            <div className="grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
              <div className="grid gap-1.5">
                <label className="font-extrabold">Nome</label>
                <input
                  value={s.label}
                  onChange={(e) => updateSection(s.id, { label: e.target.value } as any)}
                  className="px-3 py-2.5 rounded-xl border border-border-default"
                />
              </div>

              {s.type === "prefixedRange" && (
                <div className="grid gap-1.5">
                  <label className="font-extrabold">Prefixo</label>
                  <input
                    value={s.prefix}
                    onChange={(e) => updateSection(s.id, { prefix: e.target.value.toUpperCase() } as any)}
                    placeholder="ex.: E, CB, F"
                    className="px-3 py-2.5 rounded-xl border border-border-default"
                  />
                </div>
              )}

              <div className="grid gap-1.5">
                <label className="font-extrabold">Início</label>
                <input
                  value={(s as any).start}
                  onChange={(e) => updateSection(s.id, { start: Number(e.target.value) } as any)}
                  inputMode="numeric"
                  className="px-3 py-2.5 rounded-xl border border-border-default"
                />
              </div>

              <div className="grid gap-1.5">
                <label className="font-extrabold">Fim</label>
                <input
                  value={(s as any).end}
                  onChange={(e) => updateSection(s.id, { end: Number(e.target.value) } as any)}
                  inputMode="numeric"
                  className="px-3 py-2.5 rounded-xl border border-border-default"
                />
              </div>
            </div>

            <div className="mt-2.5 opacity-75 font-bold">
              Exemplo de IDs:{" "}
              <span className="font-mono">
                {s.type === "numericRange" ? `${(s as any).start}, ${(s as any).start + 1}, ...` : `${s.prefix.toUpperCase()}${(s as any).start}, ${s.prefix.toUpperCase()}${(s as any).start + 1}, ...`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
