"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
import useAlbumsCatalog from "@/hooks/useAlbumsCatalog";
import useAlbumState from "@/hooks/useAlbumState";
import { expandAlbum } from "@/utils/album";
import { decodeShareData } from "@/utils/share";
import { getMissing, getDuplicates } from "@/utils/lists";
import type { AlbumDefinition, Quantities } from "@/types/album";

type Tab = "link" | "text";

type CompareResult = {
  iCanGive: Array<{ id: string; qty: number }>;
  theyCanGive: Array<{ id: string; qty: number }>;
  noMatch: { myExtras: string[]; myMissingNoHelp: string[] };
};

function parseTextList(raw: string): string[] {
  // Split by comma, space, newline, semicolon
  const tokens = raw.split(/[,;\s]+/).filter(Boolean);
  // Normalize: trim each, uppercase
  return tokens.map((t) => t.trim().toUpperCase());
}

function normalizeId(id: string, allIds: string[]): string | null {
  // Try exact match first
  if (allIds.includes(id)) return id;
  // Try case-insensitive
  const lower = id.toLowerCase();
  const found = allIds.find((a) => a.toLowerCase() === lower);
  if (found) return found;
  // Try just the number (for albums with single numeric section)
  const numMatch = id.match(/\d+$/);
  if (numMatch) {
    const num = numMatch[0];
    if (allIds.includes(num)) return num;
  }
  return null;
}

function compareLink(
  myQuantities: Quantities,
  friendQuantities: Quantities,
  allIds: string[]
): CompareResult {
  const myMissing = new Set(getMissing(allIds, myQuantities));
  const friendMissing = new Set(getMissing(allIds, friendQuantities));

  const myDups = getDuplicates(myQuantities);
  const friendDups = getDuplicates(friendQuantities);

  // I can give: my duplicates that friend is missing
  const iCanGive = myDups
    .filter((d) => friendMissing.has(d.id))
    .map((d) => ({ id: d.id, qty: d.total - 1 }));

  // They can give: friend duplicates that I'm missing
  const theyCanGive = friendDups
    .filter((d) => myMissing.has(d.id))
    .map((d) => ({ id: d.id, qty: d.total - 1 }));

  // No match
  const iCanGiveSet = new Set(iCanGive.map((x) => x.id));
  const theyCanGiveSet = new Set(theyCanGive.map((x) => x.id));

  const myExtras = myDups.filter((d) => !iCanGiveSet.has(d.id)).map((d) => d.id);
  const myMissingNoHelp = [...myMissing].filter((id) => !theyCanGiveSet.has(id));

  return { iCanGive, theyCanGive, noMatch: { myExtras, myMissingNoHelp } };
}

function compareText(
  myQuantities: Quantities,
  friendRepeatedIds: string[],
  allIds: string[]
): CompareResult {
  const myMissing = new Set(getMissing(allIds, myQuantities));
  const myDups = getDuplicates(myQuantities);

  // Normalize friend's repeated list
  const friendRepeated = new Set(
    friendRepeatedIds
      .map((id) => normalizeId(id, allIds))
      .filter((id): id is string => id !== null)
  );

  // They can give me: friend repeated that I'm missing
  const theyCanGive = [...friendRepeated]
    .filter((id) => myMissing.has(id))
    .map((id) => ({ id, qty: 1 }));

  // I can give them: my duplicates that are also in friend's repeated
  // (in text mode, if they listed it as repeated, they DON'T need it -
  //  so my duplicates that are NOT in friend's repeated list are potential gives,
  //  but we don't know their missing list. We show all my duplicates as "possible")
  // Actually per spec: "minhas repetidas que estão na lista de repetidas dele que eu preciso"
  // Re-reading: in text mode we only know friend's duplicates.
  // "Eu posso dar para ele" = can't determine without knowing their missing
  // "Ele pode me dar" = friend's repeated that I'm missing
  // So for "I can give": show all my duplicates (we don't know what they need)
  const iCanGive: Array<{ id: string; qty: number }> = [];

  const theyCanGiveSet = new Set(theyCanGive.map((x) => x.id));
  const myExtras = myDups.map((d) => d.id);
  const myMissingNoHelp = [...myMissing].filter((id) => !theyCanGiveSet.has(id));

  return { iCanGive, theyCanGive, noMatch: { myExtras, myMissingNoHelp } };
}

function buildWhatsappCompare(
  albumName: string,
  iCanGive: Array<{ id: string }>,
  theyCanGive: Array<{ id: string }>
): string {
  const lines: string[] = [`🔄 Troca - ${albumName}`, ""];

  if (iCanGive.length > 0) {
    lines.push(
      `✅ Eu tenho para você (${iCanGive.length}):`,
      iCanGive.map((x) => x.id).join(", ")
    );
  } else {
    lines.push("✅ Eu tenho para você: (nenhuma)");
  }

  lines.push("");

  if (theyCanGive.length > 0) {
    lines.push(
      `🎁 Você tem para mim (${theyCanGive.length}):`,
      theyCanGive.map((x) => x.id).join(", ")
    );
  } else {
    lines.push("🎁 Você tem para mim: (nenhuma)");
  }

  return lines.join("\n");
}

export default function ComparePageWrapper() {
  return (
    <React.Suspense
      fallback={
        <main className="p-4 max-w-[980px] mx-auto">
          <p className="opacity-60">Carregando...</p>
        </main>
      }
    >
      <ComparePage />
    </React.Suspense>
  );
}

function ComparePage() {
  const searchParams = useSearchParams();
  const albumIdParam = searchParams?.get("albumId") ?? null;

  const { albums } = useAlbumsCatalog();
  const [selectedAlbumId, setSelectedAlbumId] = React.useState<string | null>(albumIdParam);
  const albumId = selectedAlbumId ?? "";
  const album = React.useMemo(
    () => albums.find((a) => a.id === albumId) ?? null,
    [albums, albumId]
  );

  const { quantities: myQuantities } = useAlbumState(albumId);

  const [tab, setTab] = React.useState<Tab>("link");
  const [linkInput, setLinkInput] = React.useState("");
  const [textInput, setTextInput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = React.useState<string | null>(null);

  // Update selected album if URL param changes
  React.useEffect(() => {
    if (albumIdParam) setSelectedAlbumId(albumIdParam);
  }, [albumIdParam]);

  const allIds = React.useMemo(
    () => (album ? expandAlbum(album) : []),
    [album]
  );

  // Parse link input
  const linkData = React.useMemo(() => {
    if (!linkInput.trim()) return null;
    try {
      const url = new URL(linkInput.trim(), window.location.origin);
      const d = url.searchParams.get("d");
      if (!d) return null;
      return decodeShareData(d);
    } catch {
      return null;
    }
  }, [linkInput]);

  // Compute comparison result
  const result = React.useMemo<CompareResult | null>(() => {
    if (!album || allIds.length === 0) return null;

    if (tab === "link") {
      if (!linkData) return null;
      if (linkData.albumId !== album.id) return null;
      return compareLink(myQuantities, linkData.quantities, allIds);
    }

    // Text mode
    const parsed = parseTextList(textInput);
    if (parsed.length === 0) return null;
    return compareText(myQuantities, parsed, allIds);
  }, [tab, linkData, textInput, myQuantities, allIds, album]);

  // Validation errors
  const validationError = React.useMemo(() => {
    if (tab === "link" && linkInput.trim()) {
      if (!linkData) return "Link inválido. Cole o link gerado pelo botão Compartilhar.";
      if (album && linkData.albumId !== album.id) {
        return `Este link é do álbum "${linkData.albumName}", mas você selecionou "${album.name}".`;
      }
    }
    return null;
  }, [tab, linkInput, linkData, album]);

  const handleCopy = () => {
    if (!result || !album) return;
    const msg = buildWhatsappCompare(album.name, result.iCanGive, result.theyCanGive);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(msg).then(
        () => {
          setCopyFeedback("Copiado!");
          setTimeout(() => setCopyFeedback(null), 2000);
        },
        () => setCopyFeedback("Erro ao copiar")
      );
    }
  };

  // Album selector if no albumId
  const showAlbumSelector = !selectedAlbumId || !album;

  return (
    <main className="p-4 max-w-[980px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4 flex-wrap">
        <Link
          href={album ? `/albums/${album.id}` : "/"}
          className="px-3 py-2 rounded-[10px] border border-border-default no-underline font-bold"
        >
          ← {album ? album.name : "Álbuns"}
        </Link>
        <div className="text-lg font-black">Comparar</div>
      </div>

      {/* Album selector */}
      {showAlbumSelector && albums.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2 opacity-85">
            Selecione o álbum:
          </label>
          <div className="grid gap-2">
            {albums.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAlbumId(a.id)}
                className={[
                  "p-3 rounded-xl border text-left font-bold text-sm transition-colors",
                  selectedAlbumId === a.id
                    ? "bg-foreground text-background border-foreground"
                    : "border-border-default",
                ].join(" ")}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {album && (
        <>
          {/* Tabs */}
          <div className="flex gap-0 mb-4 rounded-xl border border-border-default overflow-hidden">
            <button
              onClick={() => { setTab("link"); setError(null); }}
              className={[
                "flex-1 py-2.5 text-sm font-bold transition-colors",
                tab === "link"
                  ? "bg-foreground text-background"
                  : "opacity-60",
              ].join(" ")}
            >
              Colar link
            </button>
            <button
              onClick={() => { setTab("text"); setError(null); }}
              className={[
                "flex-1 py-2.5 text-sm font-bold transition-colors",
                tab === "text"
                  ? "bg-foreground text-background"
                  : "opacity-60",
              ].join(" ")}
            >
              Colar lista
            </button>
          </div>

          {/* Input area */}
          {tab === "link" ? (
            <div className="mb-4">
              <label className="block text-sm font-bold mb-1.5 opacity-85">
                Link do amigo:
              </label>
              <textarea
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Cole aqui o link compartilhado..."
                rows={3}
                className="w-full p-3 rounded-xl border border-border-default bg-foreground/5 text-sm font-mono resize-none outline-none focus:border-foreground/40"
              />
              {validationError && (
                <p className="mt-1.5 text-sm text-red-500 font-medium">
                  {validationError}
                </p>
              )}
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-bold mb-1.5 opacity-85">
                Repetidas do amigo:
              </label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={"Cole as repetidas do amigo...\nEx: 1, 2, F3, 45, X2"}
                rows={4}
                className="w-full p-3 rounded-xl border border-border-default bg-foreground/5 text-sm font-mono resize-none outline-none focus:border-foreground/40"
              />
              <p className="mt-1 text-xs opacity-50">
                Números separados por vírgula, espaço ou quebra de linha. Suporta prefixos (F1, X3...).
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="flex flex-col gap-4">
              {/* I can give */}
              {tab === "link" && (
                <section className="rounded-xl border border-border-default p-4">
                  <h3 className="font-black text-sm mb-2">
                    ✅ Eu posso dar para ele ({result.iCanGive.length})
                  </h3>
                  {result.iCanGive.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {result.iCanGive.map((s) => (
                        <span
                          key={s.id}
                          className="px-2 py-1 rounded-lg bg-green-500/15 text-green-700 dark:text-green-400 text-xs font-bold"
                        >
                          {s.id}
                          {s.qty > 1 && (
                            <span className="opacity-60 ml-0.5">x{s.qty}</span>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm opacity-50">Nenhuma figurinha para dar.</p>
                  )}
                </section>
              )}

              {/* They can give */}
              <section className="rounded-xl border border-border-default p-4">
                <h3 className="font-black text-sm mb-2">
                  🎁 Ele pode me dar ({result.theyCanGive.length})
                </h3>
                {result.theyCanGive.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {result.theyCanGive.map((s) => (
                      <span
                        key={s.id}
                        className="px-2 py-1 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-400 text-xs font-bold"
                      >
                        {s.id}
                        {s.qty > 1 && (
                          <span className="opacity-60 ml-0.5">x{s.qty}</span>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm opacity-50">Nenhuma figurinha para receber.</p>
                )}
              </section>

              {/* No match */}
              <section className="rounded-xl border border-border-default p-4">
                <h3 className="font-black text-sm mb-2">
                  ❓ Sem correspondência
                </h3>
                {result.noMatch.myExtras.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-bold opacity-60 mb-1">
                      Minhas repetidas que {tab === "link" ? "ele não precisa" : "não sei se ele precisa"}:
                    </p>
                    <p className="text-xs opacity-50 leading-relaxed">
                      {result.noMatch.myExtras.join(", ")}
                    </p>
                  </div>
                )}
                {result.noMatch.myMissingNoHelp.length > 0 && (
                  <div>
                    <p className="text-xs font-bold opacity-60 mb-1">
                      Faltam para mim e {tab === "link" ? "ele não tem repetidas" : "não sei se ele tem"}:
                    </p>
                    <p className="text-xs opacity-50 leading-relaxed">
                      {result.noMatch.myMissingNoHelp.join(", ")}
                    </p>
                  </div>
                )}
                {result.noMatch.myExtras.length === 0 &&
                  result.noMatch.myMissingNoHelp.length === 0 && (
                    <p className="text-sm opacity-50">Tudo bateu!</p>
                  )}
              </section>

              {/* WhatsApp button */}
              {(result.iCanGive.length > 0 || result.theyCanGive.length > 0) && (
                <button
                  onClick={handleCopy}
                  className="w-full py-3 rounded-xl bg-foreground text-background font-bold text-sm transition-colors"
                >
                  {copyFeedback === "Copiado!"
                    ? "✅ Copiado!"
                    : "📋 Copiar para WhatsApp"}
                </button>
              )}
            </div>
          )}

          {/* Empty state */}
          {!result && !validationError && (
            <div className="text-center py-8 opacity-40">
              <p className="text-sm">
                {tab === "link"
                  ? "Cole o link de compartilhamento do amigo acima."
                  : "Cole a lista de repetidas do amigo acima."}
              </p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
