"use client";

import React from "react";
import type { AlbumDefinition } from "@/types/album";
import { ALBUMS } from "@/data/albums";
import { loadCustomAlbums } from "@/utils/storage";

export default function useAlbumsCatalog() {
  const [custom, setCustom] = React.useState<AlbumDefinition[]>([]);

  React.useEffect(() => {
    setCustom(loadCustomAlbums());
  }, []);

  const all = React.useMemo(() => {
    // custom primeiro para facilitar achar os seus
    const map = new Map<string, AlbumDefinition>();
    for (const a of custom) map.set(a.id, a);
    for (const a of ALBUMS) if (!map.has(a.id)) map.set(a.id, a);
    return Array.from(map.values());
  }, [custom]);

  return { albums: all, customAlbums: custom, refresh: () => setCustom(loadCustomAlbums()) };
}
