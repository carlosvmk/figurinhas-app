import type { AlbumDefinition, AlbumSection } from "@/types/album";

export function expandSection(section: AlbumSection): string[] {
  const ids: string[] = [];
  if (section.type === "numericRange") {
    for (let i = section.start; i <= section.end; i++) ids.push(String(i));
    return ids;
  }

  // prefixedRange
  for (let i = section.start; i <= section.end; i++) ids.push(`${section.prefix}${i}`);
  return ids;
}

export function expandAlbum(album: AlbumDefinition): string[] {
  return album.sections.flatMap(expandSection);
}
