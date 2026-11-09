import type { FencedFiles } from "../fence/fenced-files";

export interface LinkFrom {
  path: string;
  line: number | null;
}

export type LinkLineFiles = Pick<FencedFiles, "getFileByPath" | "cachedRead">;

export async function linkLineOf(files: LinkLineFiles, from: LinkFrom): Promise<string> {
  if (from.line === null) return "";
  const file = files.getFileByPath(from.path);
  if (file === null) return "";
  const line = (await files.cachedRead(file)).split("\n")[from.line];
  if (line === undefined) return "";
  return line;
}
