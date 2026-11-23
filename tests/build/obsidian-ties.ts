import { readdirSync } from "node:fs";

const TIES_FOLDER = new URL("./obsidian-ties/", import.meta.url);

export interface AreaTies {
  readonly area: string;
  readonly paths: readonly string[];
}

async function tiesOf(fileName: string): Promise<AreaTies> {
  const loaded: { TIES: readonly string[] } = await import(new URL(fileName, TIES_FOLDER).href);
  return { area: fileName.replace(/\.ts$/, ""), paths: loaded.TIES };
}

export async function allTies(): Promise<AreaTies[]> {
  const found: AreaTies[] = [];
  for (const fileName of readdirSync(TIES_FOLDER)) found.push(await tiesOf(fileName));
  return found;
}

export function tiedPaths(ties: readonly AreaTies[]): string[] {
  const paths: string[] = [];
  for (const area of ties) paths.push(...area.paths);
  return paths;
}
