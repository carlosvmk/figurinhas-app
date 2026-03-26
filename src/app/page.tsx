"use client";

import Link from "next/link";
import React from "react";
import useAlbumsCatalog from "@/hooks/useAlbumsCatalog";
import { deleteAlbum } from "@/utils/storage";

export default function HomePage() {
  const { albums, refresh } = useAlbumsCatalog();
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);

  return (
    <main className="p-4 max-w-[980px] mx-auto">
      <div className="flex items-center gap-2.5 mb-3.5 flex-wrap">
        <div className="text-xl font-[950]">Álbuns</div>

        <div className="ml-auto flex gap-2 flex-wrap">
          <Link
            href="/albums/new"
            className="px-3.5 py-2.5 rounded-xl border border-border-default bg-black/85 text-white no-underline font-[950] inline-block"
          >
            + Criar álbum
          </Link>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border-default rounded-2xl p-6 max-w-sm w-[calc(100%-2rem)] shadow-lg">
            <div className="font-[950] text-lg mb-3">Deletar álbum</div>
            <p className="mb-4 text-sm opacity-80">
              Tem certeza que deseja deletar <strong>{deleteTarget.name}</strong>? Todos os dados deste álbum serão perdidos.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 rounded-xl font-bold cursor-pointer bg-transparent text-inherit border border-border-default"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteAlbum(deleteTarget.id);
                  setDeleteTarget(null);
                  refresh();
                }}
                className="px-4 py-2.5 rounded-xl font-bold cursor-pointer bg-red-500 text-white border-none"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        {albums.map((a) => (
          <div
            key={a.id}
            className="relative border border-black/12 rounded-2xl bg-card shadow-card"
          >
            <div className="absolute top-2 right-2 flex gap-1">
              <Link
                href={`/albums/new?edit=${a.id}`}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-sm opacity-40 hover:opacity-100 hover:bg-blue-500/10 hover:text-blue-500 no-underline text-inherit transition-all"
                title="Editar álbum"
              >
                ✎
              </Link>
              <button
                onClick={() => setDeleteTarget({ id: a.id, name: a.name })}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-sm opacity-40 hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 cursor-pointer bg-transparent border-none text-inherit transition-all"
                title="Deletar álbum"
              >
                ✕
              </button>
            </div>
            <Link
              href={`/albums/${a.id}`}
              className="no-underline text-inherit p-3.5 block"
            >
              <div className="font-[950] mb-1.5">{a.name}</div>
              <div className="opacity-75 font-mono text-xs">
                {a.id}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
