import type { AlbumDefinition, Quantities } from "@/types/album";
import { expandAlbum } from "@/utils/album";
import { ALBUM_TEMPLATES } from "@/data/albums";

const KEY = "figurinhas:albums:custom:v1";
const INIT_KEY = "figurinhas:initialized:v1";
const QUANTITIES_PREFIX = "album:";
const QUANTITIES_SUFFIX = ":quantities";

// ── Inicialização / Migração ──────────────────────────────────────

/**
 * Na primeira abertura do app, copia os álbuns-modelo para o localStorage.
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

// ── Export / Import ─────────────────────────────────────────────

export interface BackupData {
  version: 1;
  exportedAt: string;
  albums: Record<string, { quantities: Quantities }>;
  customAlbums: AlbumDefinition[];
}

function getAllAlbumIds(): string[] {
  const ids = new Set<string>();
  for (const a of loadAlbums()) ids.add(a.id);
  // also scan localStorage for any quantity keys
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (k.startsWith(QUANTITIES_PREFIX) && k.endsWith(QUANTITIES_SUFFIX)) {
      ids.add(k.slice(QUANTITIES_PREFIX.length, -QUANTITIES_SUFFIX.length));
    }
  }
  return Array.from(ids);
}

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

export function exportData(): BackupData {
  const albums: BackupData["albums"] = {};
  for (const id of getAllAlbumIds()) {
    const quantities = loadQuantities(id);
    if (Object.keys(quantities).length > 0) {
      albums[id] = { quantities };
    }
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    albums,
    customAlbums: loadAlbums(),
  };
}

export function downloadBackup() {
  const data = exportData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `figurinhas-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function isValidBackup(data: unknown): data is BackupData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (d.version !== 1) return false;
  if (typeof d.exportedAt !== "string") return false;
  if (!d.albums || typeof d.albums !== "object" || Array.isArray(d.albums)) return false;
  if (!Array.isArray(d.customAlbums)) return false;
  return true;
}

export type ImportMode = "merge" | "replace";

export function importData(raw: string, mode: ImportMode) {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Arquivo inválido: não é um JSON válido.");
  }

  if (!isValidBackup(data)) {
    throw new Error("Arquivo inválido: formato de backup não reconhecido.");
  }

  if (mode === "replace") {
    // remove all existing quantities
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k.startsWith(QUANTITIES_PREFIX) && k.endsWith(QUANTITIES_SUFFIX)) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) localStorage.removeItem(k);
    // replace albums
    saveAlbums(data.customAlbums);
  } else {
    // merge albums: file albums take priority
    const existing = loadAlbums();
    const map = new Map<string, AlbumDefinition>();
    for (const a of existing) map.set(a.id, a);
    for (const a of data.customAlbums) map.set(a.id, a);
    saveAlbums(Array.from(map.values()));
  }

  // write quantities
  for (const [albumId, albumData] of Object.entries(data.albums)) {
    if (albumData && typeof albumData === "object" && "quantities" in albumData) {
      const key = `${QUANTITIES_PREFIX}${albumId}${QUANTITIES_SUFFIX}`;
      if (mode === "merge") {
        const existing = loadQuantities(albumId);
        const merged = { ...existing, ...albumData.quantities };
        localStorage.setItem(key, JSON.stringify(merged));
      } else {
        localStorage.setItem(key, JSON.stringify(albumData.quantities));
      }
    }
  }
}

// ── CRUD de álbuns (fonte única: localStorage) ────────────────────

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

// ── Aliases de compatibilidade (usados pelo backup) ───────────────
export const loadCustomAlbums = loadAlbums;
export const saveCustomAlbums = saveAlbums;
export const addCustomAlbum = addAlbum;
export const updateCustomAlbum = updateAlbum;
export const deleteCustomAlbum = deleteAlbum;
