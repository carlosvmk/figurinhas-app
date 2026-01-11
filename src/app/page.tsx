import Link from "next/link";

const ALBUM_ID = "topps-ucl-2025-2026";

export default function Home() {
  return (
    <main style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 14 }}>Álbuns</h1>

      <div
        style={{
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 14,
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>TOPPS UEFA Champions League 2025/2026</div>
          <div style={{ opacity: 0.8 }}>Figurinhas: 1–574</div>
        </div>

        <Link
          href={`/album/${ALBUM_ID}`}
          style={{
            display: "inline-block",
            width: "fit-content",
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.15)",
            textDecoration: "none",
            fontWeight: 800,
          }}
        >
          Abrir
        </Link>

        <div style={{ opacity: 0.65, fontSize: 12 }}>Salvo neste dispositivo (localStorage)</div>
      </div>
    </main>
  );
}
