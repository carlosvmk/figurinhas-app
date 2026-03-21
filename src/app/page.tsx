"use client";

import Link from "next/link";
import React from "react";
import useAlbumsCatalog from "@/hooks/useAlbumsCatalog";

export default function HomePage() {
  const { albums } = useAlbumsCatalog();

  return (
    <main style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ fontSize: 20, fontWeight: 950 }}>Álbuns</div>

        <div style={{ marginLeft: "auto" }}>
          <Link
            href="/albums/new"
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.15)",
              background: "rgba(0,0,0,0.85)",
              color: "white",
              textDecoration: "none",
              fontWeight: 950,
              display: "inline-block",
            }}
          >
            + Criar álbum
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {albums.map((a) => (
          <Link
            key={a.id}
            href={`/album/${a.id}`}
            style={{
              textDecoration: "none",
              color: "inherit",
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 16,
              padding: 14,
              background: "white",
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
              display: "block",
            }}
          >
            <div style={{ fontWeight: 950, marginBottom: 6 }}>{a.name}</div>
            <div style={{ opacity: 0.75, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12 }}>
              {a.id}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
