export type Quantities = Record<string, number>;

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

export function buildWhatsappMessage(params: {
  albumName: string;
  missing: string[];
  dups: Array<{ id: string; total: number }>;
  withQty: boolean;
}): string {
  const { albumName, missing, dups, withQty } = params;
  const rep = formatDuplicates(dups, withQty);
  const falt = formatCommaList(missing);

  return [
    `${albumName}`,
    rep ? `Repetidas: ${rep}` : `Repetidas: (nenhuma)`,
    missing.length ? `Faltam: ${falt}` : `Faltam: (nenhuma)`,
  ].join("\n");
}
