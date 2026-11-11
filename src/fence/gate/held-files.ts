import type { TAbstractFile, Vault } from "obsidian";
import { NOT_WRITTEN_AS_OBSIDIAN_WRITES, OUTSIDE_FENCE, type Fence } from "../paths/fence";
import { pathOf } from "../paths/path-of";

export type FileLookup = Pick<Vault, "getAbstractFileByPath">;

export class HeldFiles {
  constructor(
    private readonly lookup: FileLookup,
    private readonly fence: Fence,
  ) {}

  holdsPath(path: unknown): path is string {
    return this.fence.holds(path);
  }

  isTheFolder(path: unknown): path is string {
    return this.fence.isTheFolder(path);
  }

  holdsFile(file: unknown): boolean {
    return this.fence.holds(pathOf(file));
  }

  path(path: unknown): string {
    if (!this.fence.holds(path)) throw new Error(OUTSIDE_FENCE);
    return path;
  }

  newPath(path: unknown): string {
    const held = this.path(path);
    if (!this.fence.holdsNew(held)) throw new Error(NOT_WRITTEN_AS_OBSIDIAN_WRITES);
    return held;
  }

  file<T extends TAbstractFile>(file: T): T {
    const path = pathOf(file);
    if (!this.fence.holds(path)) throw new Error(OUTSIDE_FENCE);
    if (this.lookup.getAbstractFileByPath(path) !== file) throw new Error(OUTSIDE_FENCE);
    return file;
  }
}
