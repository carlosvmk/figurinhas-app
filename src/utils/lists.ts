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

export function formatDuplicates(dups: Array<{ id: string; total: number }>): string {
  const expanded: string[] = [];
  for (const d of dups) {
    const repeats = d.total - 1;
    for (let i = 0; i < repeats; i++) expanded.push(d.id);
  }
  return expanded.join(", ");
}

export function getDuplicateStats(dups: Array<{ id: string; total: number }>): {
  repetidasTotal: number;
  repetidasDiferentes: number;
} {
  let repetidasTotal = 0;
  for (const d of dups) {
    repetidasTotal += d.total - 1;
  }
  return { repetidasTotal, repetidasDiferentes: dups.length };
}

export type WhatsappMode = "both" | "missing" | "duplicates";

export function buildWhatsappMessage(params: {
  albumName: string;
  missing: string[];
  dups: Array<{ id: string; total: number }>;
  mode?: WhatsappMode;
}): string {
  const { albumName, missing, dups, mode = "both" } = params;
  const rep = formatDuplicates(dups);
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
