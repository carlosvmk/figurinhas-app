import LZString from "lz-string";
import type { Quantities } from "@/types/album";

export type SharedData = {
  albumId: string;
  albumName: string;
  quantities: Quantities;
  sharedAt: string;
};

export function encodeShareData(data: SharedData): string {
  const json = JSON.stringify(data);
  return LZString.compressToEncodedURIComponent(json);
}

export function decodeShareData(encoded: string): SharedData | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const data = JSON.parse(json);
    if (!data.albumId || !data.albumName || !data.quantities) return null;
    return data as SharedData;
  } catch {
    return null;
  }
}
