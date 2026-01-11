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
} from "@/utils/lists";

const ALBUM = {
  id: "topps-ucl-2025-2026",
  name: "TOPPS UCL 2025/26",
  start: 1,
  end: 574,
};

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
  const albumId = params?.id || ALBUM.id;

  const { quantities } = useAlbumState(albumId);

  const [tab, setTab] = React.useState<Tab>("faltam");
  const [wrap, setWrap] = React.useState(false);
  const [withQty, setWithQty] = React.useState(true);
  const [toast, setToast] = React.useState<string | null>(null);

  const missing = React.useMemo(
    () => getMissing(ALBUM.start, ALBUM.end, quantities),
    [quantities]
  );

  const dups = React.useMemo(() => getDuplicates(quantities), [quantities]);

  const faltamText = React.useMemo(
    () => (wrap ? formatCommaListWrapped(missing, 25) : formatCommaList(missing)),
    [missing, wrap]
  );

  const repetidasRaw = React.useMemo(
    () => formatDuplicates(dups, withQty),
    [dups, withQty]
  );

  const repetidasText = React.useMemo(() => {
    if (!wrap) return repetidasRaw;
    const items = repetidasRaw ? repetidasRaw.split(", ") : [];
    return formatCommaListWrapped(items, 25);
  }, [repetidasRaw, wrap]);

  const whatsappText = React.useMemo(
    () =>
      buildWhatsappMessage({
        albumName: ALBUM.name,
        missing,
        dups,
        withQty,
      }),
    [missing, dups, withQty]
  );

  const doCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    setToast(ok ? "Copiado!" : "Não consegui copiar automaticamente. Copie manualmente.");
    window.setTimeout(() => setToast(null), 2200);
  };

  return (
    <main style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <Link
          href={`/album/${albumId}`}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.15)",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          ← Voltar
        </Link>

        <div style={{ fontSize: 18, fontWeight: 900 }}>Listas</div>

        <div style={{ marginLeft: "auto", opacity: 0.8 }}>{toast ? <b>{toast}</b> : null}</div>
      </div>

      <p style={{ marginTop: 0, marginBottom: 12, opacity: 0.85 }}>
        {ALBUM.name} • Faltam: <b>{missing.length}</b> • Repetidas (tipos): <b>{dups.length}</b>
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button onClick={() => setTab("faltam")} style={{ padding: "8px 12px", borderRadius: 10, fontWeight: tab === "faltam" ? 900 : 700 }}>
          Faltam
        </button>
        <button onClick={() => setTab("repetidas")} style={{ padding: "8px 12px", borderRadius: 10, fontWeight: tab === "repetidas" ? 900 : 700 }}>
          Repetidas
        </button>
        <button onClick={() => setTab("mensagem")} style={{ padding: "8px 12px", borderRadius: 10, fontWeight: tab === "mensagem" ? 900 : 700 }}>
          Mensagem WhatsApp
        </button>
      </div>

      {/* Options */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={wrap} onChange={(e) => setWrap(e.target.checked)} />
          Quebrar em linhas
        </label>

        {tab !== "faltam" && (
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={withQty} onChange={(e) => setWithQty(e.target.checked)} />
            Mostrar quantidades (xN)
          </label>
        )}
      </div>

      {/* Content */}
      {tab === "faltam" && (
        <section>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <button onClick={() => doCopy(`Faltam: ${formatCommaList(missing)}`)} style={{ padding: "8px 12px", borderRadius: 10 }}>
              Copiar (WhatsApp)
            </button>
            <button onClick={() => doCopy(faltamText)} style={{ padding: "8px 12px", borderRadius: 10 }}>
              Copiar (só números)
            </button>
          </div>

          <textarea
            readOnly
            value={faltamText}
            rows={10}
            style={{ width: "100%", padding: 12, borderRadius: 12, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
          />
        </section>
      )}

      {tab === "repetidas" && (
        <section>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <button onClick={() => doCopy(`Repetidas: ${formatDuplicates(dups, withQty)}`)} style={{ padding: "8px 12px", borderRadius: 10 }}>
              Copiar (WhatsApp)
            </button>
            <button onClick={() => doCopy(repetidasText)} style={{ padding: "8px 12px", borderRadius: 10 }}>
              Copiar (só lista)
            </button>
          </div>

          <textarea
            readOnly
            value={repetidasText || ""}
            rows={10}
            style={{ width: "100%", padding: 12, borderRadius: 12, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
          />
        </section>
      )}

      {tab === "mensagem" && (
        <section>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <button onClick={() => doCopy(whatsappText)} style={{ padding: "8px 12px", borderRadius: 10 }}>
              Copiar mensagem
            </button>
          </div>

          <textarea
            readOnly
            value={whatsappText}
            rows={8}
            style={{ width: "100%", padding: 12, borderRadius: 12, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
          />
        </section>
      )}
    </main>
  );
}
