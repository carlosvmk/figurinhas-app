"use client";

import React from "react";
import type { AlbumDefinition } from "@/types/album";
import { initializeAlbums, loadAlbums } from "@/utils/storage";

export default function useAlbumsCatalog() {
  const [albums, setAlbums] = React.useState<AlbumDefinition[]>([]);

  React.useEffect(() => {
    initializeAlbums();
    setAlbums(loadAlbums());
  }, []);

  const refresh = React.useCallback(() => {
    setAlbums(loadAlbums());
  }, []);

  return { albums, refresh };
}
