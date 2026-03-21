"use client";

import Link from "next/link";
import React from "react";
import useAlbumsCatalog from "@/hooks/useAlbumsCatalog";
import { downloadBackup, importData, deleteCustomAlbum, type ImportMode } from "@/utils/storage";

type ImportState =
  | { step: "idle" }
  | { step: "confirm"; raw: string }
  | { step: "success" }
  | { step: "error"; message: string };

export default function HomePage() {
  const { albums, customAlbums, refresh } = useAlbumsCatalog();
  const customIds = React.useMemo(() => new Set(customAlbums.map((a) => a.id)), [customAlbums]);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [importState, setImportState] = React.useState<ImportState>({ step: "idle" });
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImportState({ step: "confirm", raw: reader.result as string });
    };
    reader.onerror = () => {
      setImportState({ step: "error", message: "Erro ao ler o arquivo." });
    };
    reader.readAsText(file);
    // reset para poder selecionar o mesmo arquivo novamente
    e.target.value = "";
  }

  function handleImport(mode: ImportMode) {
    if (importState.step !== "confirm") return;
    try {
      importData(importState.raw, mode);
      setImportState({ step: "success" });
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setImportState({
        step: "error",
        message: err instanceof Error ? err.message : "Erro desconhecido.",
      });
    }
  }

  return (
    <main className="p-4 max-w-[980px] mx-auto">
      <div className="flex items-center gap-2.5 mb-3.5 flex-wrap">
        <div className="text-xl font-[950]">Álbuns</div>

        <div className="ml-auto flex gap-2 flex-wrap">
          <button
            onClick={downloadBackup}
            className="px-3.5 py-2.5 rounded-xl border border-border-default font-bold cursor-pointer bg-transparent text-inherit"
          >
            Exportar dados
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="px-3.5 py-2.5 rounded-xl border border-border-default font-bold cursor-pointer bg-transparent text-inherit"
          >
            Importar dados
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Link
            href="/albums/new"
            className="px-3.5 py-2.5 rounded-xl border border-border-default bg-black/85 text-white no-underline font-[950] inline-block"
          >
            + Criar álbum
          </Link>
        </div>
      </div>

      {/* Modal de confirmação de importação */}
      {importState.step === "confirm" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border-default rounded-2xl p-6 max-w-sm w-[calc(100%-2rem)] shadow-lg">
            <div className="font-[950] text-lg mb-3">Importar dados</div>
            <p className="mb-4 text-sm opacity-80">
              Como deseja importar os dados do backup?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleImport("merge")}
                className="px-4 py-2.5 rounded-xl border border-border-default font-bold cursor-pointer bg-transparent text-inherit"
              >
                Mesclar — manter existentes, sobrescrever do arquivo
              </button>
              <button
                onClick={() => handleImport("replace")}
                className="px-4 py-2.5 rounded-xl border border-red-400 font-bold cursor-pointer bg-transparent text-red-500"
              >
                Substituir tudo — apagar e importar do zero
              </button>
              <button
                onClick={() => setImportState({ step: "idle" })}
                className="px-4 py-2 rounded-xl font-bold cursor-pointer bg-transparent text-inherit opacity-60"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback de sucesso */}
      {importState.step === "success" && (
        <div className="mb-3.5 p-3 rounded-xl border border-green-400 bg-green-500/10 font-bold text-green-600">
          Dados importados com sucesso! Recarregando...
        </div>
      )}

      {/* Feedback de erro */}
      {importState.step === "error" && (
        <div className="mb-3.5 p-3 rounded-xl border border-red-400 bg-red-500/10 font-bold text-red-500">
          {importState.message}
          <button
            onClick={() => setImportState({ step: "idle" })}
            className="ml-3 underline cursor-pointer bg-transparent border-none text-inherit"
          >
            Fechar
          </button>
        </div>
      )}

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
                  deleteCustomAlbum(deleteTarget.id);
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
            {customIds.has(a.id) && (
              <button
                onClick={() => setDeleteTarget({ id: a.id, name: a.name })}
                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg text-sm opacity-40 hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 cursor-pointer bg-transparent border-none text-inherit transition-all"
                title="Deletar álbum"
              >
                ✕
              </button>
            )}
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
