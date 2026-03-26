"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";
import useAlbumState from "@/hooks/useAlbumState";
import { getMissing, getDuplicates, getDuplicateStats, formatCommaList, formatDuplicates } from "@/utils/lists";
import { expandAlbum } from "@/utils/album";
import { loadAlbums } from "@/utils/storage";
import type { AlbumDefinition } from "@/types/album";

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function ListasPage() {
  const params = useParams<{ id: string }>();
  const albumId = params?.id ?? "topps-ucl-2025-2026";

  const album: AlbumDefinition | undefined = React.useMemo(() => {
    return loadAlbums().find((a) => a.id === albumId);
  }, [albumId]);

  const ids = React.useMemo(() => (album ? expandAlbum(album) : []), [album]);

  const { quantities } = useAlbumState(albumId);

  const [toast, setToast] = React.useState<string | null>(null);

  const missing = React.useMemo(() => getMissing(ids, quantities), [ids, quantities]);
  const dups = React.useMemo(() => getDuplicates(quantities), [quantities]);
  const { repetidasTotal, repetidasDiferentes } = React.useMemo(() => getDuplicateStats(dups), [dups]);

  const fullText = React.useMemo(() => {
    const lines: string[] = [album?.name ?? "Álbum"];
    lines.push("");

    if (missing.length > 0) {
      lines.push(`Faltam (${missing.length}):`);
      lines.push(formatCommaList(missing));
    }

    if (missing.length > 0 && dups.length > 0) {
      lines.push("");
    }

    if (dups.length > 0) {
      lines.push(`Repetidas: ${repetidasTotal} (${repetidasDiferentes} diferentes)`);
      lines.push(formatDuplicates(dups));
    }

    return lines.join("\n");
  }, [album?.name, missing, dups]);

  const doCopy = async () => {
    const ok = await copyToClipboard(fullText);
    setToast(ok ? "Copiado!" : "Não consegui copiar");
    window.setTimeout(() => setToast(null), 2200);
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
      <div className="flex items-center gap-2.5 mb-4 flex-wrap">
        <Link
          href={`/albums/${albumId}`}
          className="px-3.5 py-2.5 rounded-xl border border-border-default bg-bg-soft no-underline font-extrabold inline-block"
        >
          ← Voltar
        </Link>

        <div className="text-lg font-[950]">{album.name}</div>
      </div>

      <div className="border border-border-default rounded-2xl p-3.5 bg-card shadow-card">
        {missing.length > 0 && (
          <div className="mb-4">
            <div className="font-black mb-1">Faltam ({missing.length}):</div>
            <div className="font-mono text-[13px] leading-[1.35] opacity-85">
              {formatCommaList(missing)}
            </div>
          </div>
        )}

        {dups.length > 0 && (
          <div className="mb-4">
            <div className="font-black mb-1">Repetidas: {repetidasTotal} ({repetidasDiferentes} diferentes)</div>
            <div className="font-mono text-[13px] leading-[1.35] opacity-85">
              {formatDuplicates(dups)}
            </div>
          </div>
        )}

        {missing.length === 0 && dups.length === 0 && (
          <div className="opacity-70 mb-4">Nenhuma figurinha faltando ou repetida.</div>
        )}

        <button
          onClick={doCopy}
          className="w-full py-3 rounded-xl border border-border-default bg-foreground text-background font-extrabold cursor-pointer text-sm"
        >
          {toast === "Copiado!" ? "Copiado!" : "Copiar texto"}
        </button>
        {toast && toast !== "Copiado!" && (
          <p className="mt-2 text-xs opacity-60 text-center">{toast}</p>
        )}
      </div>
    </main>
  );
}
