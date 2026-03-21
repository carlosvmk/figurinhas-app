import type { AlbumDefinition } from "@/types/album";

/** Modelos pré-prontos — usados apenas para inicialização e como templates na tela de criação. */
export const ALBUM_TEMPLATES: AlbumDefinition[] = [
  {
    id: "topps-ucl-2025-2026",
    name: "TOPPS UCL 2025/26",
    sections: [
      { id: "base", label: "Normais", type: "numericRange", start: 1, end: 574 },
    ],
  },
  {
    id: "one-piece-1",
    name: "Panini One Piece",
    sections: [
      { id: "base", label: "Normais", type: "numericRange", start: 1, end: 177 },
      { id: "foil", label: "Foils", type: "prefixedRange", prefix: "F", start: 1, end: 27 },
    ],
  },
  {
    id: "topps-premier-league-2026",
    name: "Topps Premier League 2026",
    sections: [
      { id: "base", label: "Principal", type: "numericRange", start: 1, end: 561 },
    ],
  },
  {
    id: "panini-naruto",
    name: "Panini Naruto",
    sections: [
      { id: "base", label: "Principal", type: "numericRange", start: 1, end: 169 },
      { id: "especiais", label: "Especiais", type: "prefixedRange", prefix: "X", start: 1, end: 6 },
    ],
  },
];
