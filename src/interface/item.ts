export interface Item {
  src: string;
  path: string;
  name: string;
  mime: string | "directory";
  size: number;
  created: number;
  modified: number;
  thumbnail?: string;
}
