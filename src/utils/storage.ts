import type { AlbumDefinition } from "@/types/album";

const KEY = "figurinhas:albums:custom:v1";

export function loadCustomAlbums(): AlbumDefinition[] {
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

export function saveCustomAlbums(albums: AlbumDefinition[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(albums));
}

export function addCustomAlbum(album: AlbumDefinition) {
  const existing = loadCustomAlbums();
  // evita id duplicado
  const filtered = existing.filter((a) => a.id !== album.id);
  saveCustomAlbums([album, ...filtered]);
}

export function deleteCustomAlbum(id: string) {
  const existing = loadCustomAlbums();
  saveCustomAlbums(existing.filter((a) => a.id !== id));
}
