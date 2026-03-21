"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";
import useAlbumState from "@/hooks/useAlbumState";
import {
  getMissing,
  getDuplicates,
  formatCommaList,
  formatCommaListWrapped,
  formatDuplicates,
  buildWhatsappMessage,
  type WhatsappMode,
} from "@/utils/lists";
import { getAlbumById } from "@/data/albums";
import { expandAlbum } from "@/utils/album";
import { loadCustomAlbums } from "@/utils/storage";
import type { AlbumDefinition } from "@/types/album";

type Tab = "faltam" | "repetidas" | "mensagem";

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
    const found = getAlbumById(albumId);
    if (found) return found;
    return loadCustomAlbums().find((a) => a.id === albumId);
  }, [albumId]);

  const ids = React.useMemo(() => (album ? expandAlbum(album) : []), [album]);

  const { quantities } = useAlbumState(albumId);

  const [tab, setTab] = React.useState<Tab>("faltam");
  const [wrap, setWrap] = React.useState(false);
  const [withQty, setWithQty] = React.useState(true);
  const [toast, setToast] = React.useState<string | null>(null);
  const [whatsappMode, setWhatsappMode] = React.useState<WhatsappMode>("both");

  const missing = React.useMemo(() => getMissing(ids, quantities), [ids, quantities]);

  const dups = React.useMemo(() => getDuplicates(quantities), [quantities]);

  const faltamText = React.useMemo(
    () => (wrap ? formatCommaListWrapped(missing, 25) : formatCommaList(missing)),
    [missing, wrap]
  );

  const repetidasRaw = React.useMemo(() => formatDuplicates(dups, withQty), [dups, withQty]);

  const repetidasText = React.useMemo(() => {
    if (!repetidasRaw) return "";
    if (!wrap) return repetidasRaw;
    const items = repetidasRaw.split(", ");
    return formatCommaListWrapped(items, 25);
  }, [repetidasRaw, wrap]);

  const whatsappText = React.useMemo(
    () => buildWhatsappMessage({ albumName: album?.name ?? "Álbum", missing, dups, withQty, mode: whatsappMode }),
    [album?.name, missing, dups, withQty, whatsappMode]
  );

  const doCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    setToast(ok ? "✅ Copiado!" : "⚠️ Não consegui copiar automaticamente (copie manualmente).");
    window.setTimeout(() => setToast(null), 2200);
  };

  const subtitle =
    tab === "faltam"
      ? `Faltam: ${missing.length}`
      : tab === "repetidas"
      ? `Repetidas (tipos): ${dups.length}`
      : "Mensagem pronta para grupo";

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
          href={`/albums/${albumId}`}
          className="px-3.5 py-2.5 rounded-xl border border-border-default bg-bg-soft no-underline font-extrabold inline-block"
        >
          ← Voltar
        </Link>

        <div className="text-lg font-[950]">Listas</div>

        <div className="ml-auto flex items-center gap-2.5">
          {toast ? (
            <span className="px-2.5 py-2 rounded-full border border-border-default bg-bg-soft font-extrabold">
              {toast}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mb-3 opacity-85">
        <b>{album.name}</b> • {subtitle}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-3">
        {(["faltam", "repetidas", "mensagem"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              "px-3.5 py-2.5 rounded-full border border-border-default font-black cursor-pointer",
              tab === t ? "bg-foreground text-background" : "bg-card text-foreground",
            ].join(" ")}
          >
            {t === "faltam" ? "Faltam" : t === "repetidas" ? "Repetidas" : "WhatsApp"}
          </button>
        ))}
      </div>

      <div className="border border-border-default rounded-2xl p-3.5 bg-card shadow-card">
        {/* Options */}
        <div className="flex gap-4 flex-wrap mb-3">
          <label className="flex items-center gap-2 font-bold">
            <input type="checkbox" checked={wrap} onChange={(e) => setWrap(e.target.checked)} />
            Quebrar em linhas
          </label>

          {tab !== "faltam" && (
            <label className="flex items-center gap-2 font-bold">
              <input type="checkbox" checked={withQty} onChange={(e) => setWithQty(e.target.checked)} />
              Mostrar quantidades (xN)
            </label>
          )}
        </div>

        {/* Actions + Text */}
        {tab === "faltam" && (
          <>
            <div className="flex gap-2 mb-2.5 flex-wrap">
              <button
                onClick={() => doCopy(`Faltam: ${formatCommaList(missing)}`)}
                className="px-3.5 py-2.5 rounded-xl border border-border-default bg-card font-extrabold cursor-pointer"
              >
                Copiar para WhatsApp
              </button>
              <button
                onClick={() => doCopy(faltamText)}
                className="px-3.5 py-2.5 rounded-xl border border-border-default bg-bg-soft font-extrabold cursor-pointer"
              >
                Copiar só números
              </button>
            </div>

            <textarea
              readOnly
              value={faltamText}
              rows={10}
              className="w-full p-3 rounded-[14px] border border-border-default font-mono text-[13px] leading-[1.35] bg-bg-soft text-foreground"
            />
          </>
        )}

        {tab === "repetidas" && (
          <>
            <div className="flex gap-2 mb-2.5 flex-wrap">
              <button
                onClick={() => doCopy(`Repetidas: ${formatDuplicates(dups, withQty)}`)}
                className="px-3.5 py-2.5 rounded-xl border border-border-default bg-card font-extrabold cursor-pointer"
              >
                Copiar para WhatsApp
              </button>
              <button
                onClick={() => doCopy(repetidasText)}
                className="px-3.5 py-2.5 rounded-xl border border-border-default bg-bg-soft font-extrabold cursor-pointer"
              >
                Copiar só lista
              </button>
            </div>

            <textarea
              readOnly
              value={repetidasText}
              rows={10}
              className="w-full p-3 rounded-[14px] border border-border-default font-mono text-[13px] leading-[1.35] bg-bg-soft text-foreground"
            />
          </>
        )}

        {tab === "mensagem" && (
          <>
            <div className="flex gap-2 mb-2.5 flex-wrap">
              {(["both", "missing", "duplicates"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setWhatsappMode(m)}
                  className={[
                    "px-3 py-1.5 rounded-full border border-border-default text-sm font-bold cursor-pointer",
                    whatsappMode === m ? "bg-foreground text-background" : "bg-card text-foreground",
                  ].join(" ")}
                >
                  {m === "both" ? "Faltam + Repetidas" : m === "missing" ? "Só faltam" : "Só repetidas"}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mb-2.5 flex-wrap">
              <button
                onClick={() => doCopy(whatsappText)}
                className="px-3.5 py-2.5 rounded-xl border border-border-default bg-card font-extrabold cursor-pointer text-foreground"
              >
                Copiar mensagem
              </button>
              <button
                onClick={() => doCopy(whatsappText.replaceAll("\n", " "))}
                className="px-3.5 py-2.5 rounded-xl border border-border-default bg-bg-soft font-extrabold cursor-pointer text-foreground"
              >
                Copiar em 1 linha
              </button>
            </div>

            <textarea
              readOnly
              value={whatsappText}
              rows={10}
              className="w-full p-3 rounded-[14px] border border-border-default font-mono text-[13px] leading-[1.35] bg-bg-soft text-foreground"
            />
          </>
        )}
      </div>
    </main>
  );
}
