import { vi } from "vitest";
import type { EventRef, TAbstractFile, TFile, TFolder } from "obsidian";
import type { RawVault } from "../../../src/fence/gate/fenced-files";

function nameOf(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

export function fileAt(path: string): TFile {
  return { path, name: nameOf(path) } as TFile;
}

export function folderAt(path: string, children: TAbstractFile[]): TFolder {
  return { path, name: nameOf(path), children } as unknown as TFolder;
}

function found<T extends TAbstractFile>(all: T[], path: string): T | null {
  const match = all.find((file) => file.path === path);
  if (match === undefined) return null;
  return match;
}

export class FakeEvents {
  private readonly callbacks = new Map<string, ((...data: unknown[]) => unknown)[]>();
  readonly stopped: EventRef[] = [];

  on(name: string, callback: (...data: unknown[]) => unknown): EventRef {
    this.callbacks.set(name, [...this.callbacksOf(name), callback]);
    return { name } as unknown as EventRef;
  }

  offref(ref: EventRef): void {
    this.stopped.push(ref);
  }

  trigger(name: string, ...data: unknown[]): void {
    for (const callback of this.callbacksOf(name)) callback(...data);
  }

  private callbacksOf(name: string): ((...data: unknown[]) => unknown)[] {
    const all = this.callbacks.get(name);
    if (all === undefined) return [];
    return all;
  }
}

export function rawVaultWith(files: TFile[], folders: TFolder[] = []) {
  const events = new FakeEvents();
  const lookup = (path: string) => found([...files, ...folders], path);
  const vault = {
    configDir: ".obsidian",
    getFileByPath: vi.fn((path: string) => found(files, path)),
    getFolderByPath: vi.fn((path: string) => found(folders, path)),
    getAbstractFileByPath: vi.fn(lookup),
    getFiles: vi.fn(() => files),
    getMarkdownFiles: vi.fn(() => files),
    read: vi.fn(async (file: TFile) => `read ${file.path}`),
    cachedRead: vi.fn(async (file: TFile) => `cached ${file.path}`),
    process: vi.fn(async (file: TFile, change: (text: string) => string) => change(`text of ${file.path}`)),
    create: vi.fn(async (path: string) => {
      const made = fileAt(path);
      files.push(made);
      return made;
    }),
    createFolder: vi.fn(async (path: string) => folderAt(path, [])),
    rename: vi.fn(async () => {}),
    getResourcePath: vi.fn((file: TFile) => `app://${file.path}`),
    on: (name: string, callback: (...data: unknown[]) => unknown) => events.on(name, callback),
    offref: (ref: EventRef) => events.offref(ref),
  };
  return { vault: vault as unknown as RawVault, calls: vault, events };
}
