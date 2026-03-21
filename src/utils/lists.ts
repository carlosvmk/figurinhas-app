import type { Quantities } from "@/types/album";

export function getMissing(ids: string[], quantities: Quantities): string[] {
  const missing: string[] = [];
  for (const id of ids) {
    if ((quantities[id] ?? 0) === 0) missing.push(id);
  }
  return missing;
}


export function getDuplicates(quantities: Quantities): Array<{ id: string; total: number }> {
  const dups: Array<{ id: string; total: number }> = [];
  for (const [id, q] of Object.entries(quantities)) {
    if ((q ?? 0) >= 2) dups.push({ id, total: q });
  }
  dups.sort((a, b) => Number(a.id) - Number(b.id));
  return dups;
}

export function formatCommaList(ids: string[]): string {
  return ids.join(", ");
}

export function formatCommaListWrapped(ids: string[], perLine = 25): string {
  const lines: string[] = [];
  for (let i = 0; i < ids.length; i += perLine) {
    lines.push(ids.slice(i, i + perLine).join(", "));
  }
  return lines.join("\n");
}

export function formatDuplicates(dups: Array<{ id: string; total: number }>, withQty: boolean): string {
  if (!withQty) return dups.map((d) => d.id).join(", ");
  return dups.map((d) => `${d.id}(x${d.total})`).join(", ");
}

export type WhatsappMode = "both" | "missing" | "duplicates";

export function buildWhatsappMessage(params: {
  albumName: string;
  missing: string[];
  dups: Array<{ id: string; total: number }>;
  withQty: boolean;
  mode?: WhatsappMode;
}): string {
  const { albumName, missing, dups, withQty, mode = "both" } = params;
  const rep = formatDuplicates(dups, withQty);
  const falt = formatCommaList(missing);

  const lines: string[] = [`📚 ${albumName}`, ""];

  if (mode !== "duplicates") {
    lines.push(
      missing.length
        ? `❌ Faltam (${missing.length}):\n${falt}`
        : "❌ Faltam: (nenhuma)"
    );
  }

  if (mode === "both" && missing.length && dups.length) {
    lines.push("");
  }

  if (mode !== "missing") {
    lines.push(
      dups.length
        ? `✅ Repetidas (${dups.length}):\n${rep}`
        : "✅ Repetidas: (nenhuma)"
    );
  }

  return lines.join("\n");
}
