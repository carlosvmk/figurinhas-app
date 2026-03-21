"use client";

import Link from "next/link";
import React from "react";
import useAlbumsCatalog from "@/hooks/useAlbumsCatalog";

export default function HomePage() {
  const { albums } = useAlbumsCatalog();

  return (
    <main className="p-4 max-w-[980px] mx-auto">
      <div className="flex items-center gap-2.5 mb-3.5 flex-wrap">
        <div className="text-xl font-[950]">Álbuns</div>

        <div className="ml-auto">
          <Link
            href="/albums/new"
            className="px-3.5 py-2.5 rounded-xl border border-border-default bg-black/85 text-white no-underline font-[950] inline-block"
          >
            + Criar álbum
          </Link>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        {albums.map((a) => (
          <Link
            key={a.id}
            href={`/albums/${a.id}`}
            className="no-underline text-inherit border border-black/12 rounded-2xl p-3.5 bg-card shadow-card block"
          >
            <div className="font-[950] mb-1.5">{a.name}</div>
            <div className="opacity-75 font-mono text-xs">
              {a.id}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
