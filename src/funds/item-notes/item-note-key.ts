export interface WantedLines {
  lines: string[];
  alias: string | null;
}

export function keyOf(holder: string, wanted: WantedLines | undefined): string {
  return JSON.stringify([holder, wanted]);
}
