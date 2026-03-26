import type { AlbumDefinition, Quantities } from "@/types/album";
import { expandAlbum } from "@/utils/album";
import { ALBUM_TEMPLATES } from "@/data/albums";

const KEY = "figurinhas:albums:custom:v1";
const INIT_KEY = "figurinhas:initialized:v1";
const QUANTITIES_PREFIX = "album:";
const QUANTITIES_SUFFIX = ":quantities";

// ── Inicialização / Migração ──────────────────────────────────────

/**
 * Na primeira abertura do app, copia os álbuns pré-prontos para o localStorage.
 * Preserva quantities já existentes (cenário de migração).
 * Deve ser chamado antes de qualquer leitura de álbuns.
 */
export function initializeAlbums() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(INIT_KEY)) return; // já inicializado

  const existing = loadAlbums();
  const existingIds = new Set(existing.map((a) => a.id));

  // Adiciona templates que ainda não existem no localStorage
  const toAdd: AlbumDefinition[] = [];
  for (const tpl of ALBUM_TEMPLATES) {
    if (!existingIds.has(tpl.id)) {
      toAdd.push(tpl);
    }
  }

  if (toAdd.length > 0) {
    saveAlbums([...existing, ...toAdd]);
  }

  // Quantities já salvas são preservadas (nada a fazer — as chaves album:*:quantities permanecem)

  localStorage.setItem(INIT_KEY, "true");
}

// ── CRUD de álbuns (fonte única: localStorage) ────────────────────

function loadQuantities(albumId: string): Quantities {
  const raw = localStorage.getItem(`${QUANTITIES_PREFIX}${albumId}${QUANTITIES_SUFFIX}`);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Quantities;
    }
    return {};
  } catch {
    return {};
  }
}

export function loadAlbums(): AlbumDefinition[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AlbumDefinition[]) : [];
  } catch {
    return [];
  }
}

export function saveAlbums(albums: AlbumDefinition[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(albums));
}

export function addAlbum(album: AlbumDefinition) {
  const existing = loadAlbums();
  // evita id duplicado
  const filtered = existing.filter((a) => a.id !== album.id);
  saveAlbums([album, ...filtered]);
}

export function updateAlbum(album: AlbumDefinition) {
  const existing = loadAlbums();
  const updated = existing.map((a) => (a.id === album.id ? album : a));
  saveAlbums(updated);

  // remove quantities for sticker IDs that no longer exist
  const validIds = new Set(expandAlbum(album));
  const key = `${QUANTITIES_PREFIX}${album.id}${QUANTITIES_SUFFIX}`;
  const quantities = loadQuantities(album.id);
  const cleaned: Quantities = {};
  for (const [stickerId, qty] of Object.entries(quantities)) {
    if (validIds.has(stickerId)) cleaned[stickerId] = qty;
  }
  localStorage.setItem(key, JSON.stringify(cleaned));
}

export function deleteAlbum(id: string) {
  const existing = loadAlbums();
  saveAlbums(existing.filter((a) => a.id !== id));
  // remove quantidades para não deixar lixo
  localStorage.removeItem(`${QUANTITIES_PREFIX}${id}${QUANTITIES_SUFFIX}`);
}
