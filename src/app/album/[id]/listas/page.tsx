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
import { getAlbumById } from "@/data/albums";
import { expandAlbum } from "@/utils/album";


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

const styles = {
  page: { padding: 16, maxWidth: 980, margin: "0 auto" } as React.CSSProperties,
  topRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
    flexWrap: "wrap",
  } as React.CSSProperties,
  btn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.15)",
    background: "white",
    fontWeight: 800,
    cursor: "pointer",
  } as React.CSSProperties,
  btnSoft: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.15)",
    background: "rgba(0,0,0,0.04)",
    fontWeight: 800,
    cursor: "pointer",
  } as React.CSSProperties,
  pillRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 } as React.CSSProperties,
  pill: (active: boolean) =>
    ({
      padding: "10px 14px",
      borderRadius: 999,
      border: "1px solid rgba(0,0,0,0.15)",
      background: active ? "rgba(0,0,0,0.85)" : "white",
      color: active ? "white" : "#111827",
      fontWeight: 900,
      cursor: "pointer",
    }) as React.CSSProperties,
  card: {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 16,
    padding: 14,
    background: "white",
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  } as React.CSSProperties,
  label: { display: "flex", alignItems: "center", gap: 8, fontWeight: 700 } as React.CSSProperties,
  textarea: {
    width: "100%",
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.15)",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 13,
    lineHeight: 1.35,
    background: "rgba(0,0,0,0.03)",
  } as React.CSSProperties,
  toast: {
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.15)",
    background: "rgba(0,0,0,0.06)",
    fontWeight: 800,
  } as React.CSSProperties,
};

export default function ListasPage() {
  const params = useParams<{ id: string }>();
  const albumId = params?.id || ALBUM.id;

  const album = getAlbumById(albumId) ?? getAlbumById("topps-ucl-2025-2026")!;
  const ids = React.useMemo(() => expandAlbum(album), [album]);


  const { quantities } = useAlbumState(albumId);

  const [tab, setTab] = React.useState<Tab>("faltam");
  const [wrap, setWrap] = React.useState(false);
  const [withQty, setWithQty] = React.useState(true);
  const [toast, setToast] = React.useState<string | null>(null);

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
    () => buildWhatsappMessage({ albumName: ALBUM.name, missing, dups, withQty }),
    [missing, dups, withQty]
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

  return (
    <main style={styles.page}>
      <div style={styles.topRow}>
        <Link href={`/album/${albumId}`} style={{ ...styles.btnSoft, textDecoration: "none", display: "inline-block" }}>
          ← Voltar
        </Link>

        <div style={{ fontSize: 18, fontWeight: 950 }}>Listas</div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {toast ? <span style={styles.toast}>{toast}</span> : null}
        </div>
      </div>

      <div style={{ marginBottom: 12, opacity: 0.85 }}>
        <b>{ALBUM.name}</b> • {subtitle}
      </div>

      {/* Tabs */}
      <div style={styles.pillRow}>
        <button onClick={() => setTab("faltam")} style={styles.pill(tab === "faltam")}>
          Faltam
        </button>
        <button onClick={() => setTab("repetidas")} style={styles.pill(tab === "repetidas")}>
          Repetidas
        </button>
        <button onClick={() => setTab("mensagem")} style={styles.pill(tab === "mensagem")}>
          WhatsApp
        </button>
      </div>

      <div style={styles.card}>
        {/* Options */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
          <label style={styles.label}>
            <input type="checkbox" checked={wrap} onChange={(e) => setWrap(e.target.checked)} />
            Quebrar em linhas
          </label>

          {tab !== "faltam" && (
            <label style={styles.label}>
              <input type="checkbox" checked={withQty} onChange={(e) => setWithQty(e.target.checked)} />
              Mostrar quantidades (xN)
            </label>
          )}
        </div>

        {/* Actions + Text */}
        {tab === "faltam" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <button onClick={() => doCopy(`Faltam: ${formatCommaList(missing)}`)} style={styles.btn}>
                Copiar para WhatsApp
              </button>
              <button onClick={() => doCopy(faltamText)} style={styles.btnSoft}>
                Copiar só números
              </button>
            </div>

            <textarea readOnly value={faltamText} rows={10} style={styles.textarea} />
          </>
        )}

        {tab === "repetidas" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <button onClick={() => doCopy(`Repetidas: ${formatDuplicates(dups, withQty)}`)} style={styles.btn}>
                Copiar para WhatsApp
              </button>
              <button onClick={() => doCopy(repetidasText)} style={styles.btnSoft}>
                Copiar só lista
              </button>
            </div>

            <textarea readOnly value={repetidasText} rows={10} style={styles.textarea} />
          </>
        )}

        {tab === "mensagem" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <button onClick={() => doCopy(whatsappText)} style={styles.btn}>
                Copiar mensagem
              </button>
              <button onClick={() => doCopy(whatsappText.replaceAll("\n", " "))} style={styles.btnSoft}>
                Copiar em 1 linha
              </button>
            </div>

            <textarea readOnly value={whatsappText} rows={8} style={styles.textarea} />
          </>
        )}
      </div>
    </main>
  );
}
