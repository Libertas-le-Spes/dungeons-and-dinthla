import type { TAbstractFile, Vault } from "obsidian";
import { OUTSIDE_FENCE, type Fence } from "./fence";
import { pathOf } from "./path-of";

export type FileLookup = Pick<Vault, "getAbstractFileByPath">;

export class HeldFiles {
  constructor(
    private readonly lookup: FileLookup,
    private readonly fence: Fence,
  ) {}

  holdsPath(path: unknown): path is string {
    return this.fence.holds(path);
  }

  holdsFile(file: unknown): boolean {
    return this.fence.holds(pathOf(file));
  }

  path(path: unknown): string {
    if (!this.fence.holds(path)) throw new Error(OUTSIDE_FENCE);
    return path;
  }

  newPath(path: unknown): string {
    if (!this.fence.holdsNew(path)) throw new Error(OUTSIDE_FENCE);
    return path;
  }

  file<T extends TAbstractFile>(file: T): T {
    const path = pathOf(file);
    if (!this.fence.holds(path)) throw new Error(OUTSIDE_FENCE);
    if (this.lookup.getAbstractFileByPath(path) !== file) throw new Error(OUTSIDE_FENCE);
    return file;
  }
}
