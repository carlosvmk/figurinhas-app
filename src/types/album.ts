export type AlbumSection =
  | {
      id: string;
      label: string;
      type: "numericRange";
      start: number;
      end: number;
    }
  | {
      id: string;
      label: string;
      type: "prefixedRange";
      prefix: string; // ex: "F", "E", "CB"
      start: number;
      end: number;
    };

export type AlbumDefinition = {
  id: string;
  name: string;
  sections: AlbumSection[];
};
