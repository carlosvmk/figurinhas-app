import type { AlbumDefinition } from "@/types/album";

export const ALBUMS: AlbumDefinition[] = [
  {
    id: "topps-ucl-2025-2026",
    name: "TOPPS UCL 2025/26",
    sections: [
      { id: "base", label: "Normais", type: "numericRange", start: 1, end: 574 },
    ],
  },
  {
    id: "one-piece-1",
    name: "One Piece (1–177 + F1–F27)",
    sections: [
      { id: "base", label: "Normais", type: "numericRange", start: 1, end: 177 },
      { id: "foil", label: "Foils", type: "prefixedRange", prefix: "F", start: 1, end: 27 },
    ],
  },
];

export function getAlbumById(id: string): AlbumDefinition | undefined {
  return ALBUMS.find((a) => a.id === id);
}
