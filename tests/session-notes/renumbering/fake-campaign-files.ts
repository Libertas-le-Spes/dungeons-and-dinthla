import { vi } from "vitest";
import type { TFile } from "obsidian";

export class FakeCampaignFiles {
  readonly texts = new Map<string, string>();
  readonly renames: [string, string][] = [];
  readonly written: string[] = [];
  private readonly filesByPath = new Map<string, TFile>();
  private readonly renameFailures = new Map<string, string>();
  private readonly changeFailures = new Map<string, string>();
  private readonly readFailures = new Map<string, string>();

  constructor(notes: Record<string, string>) {
    for (const [path, text] of Object.entries(notes)) this.add(path, text);
  }

  readonly getFiles = vi.fn((): TFile[] => [...this.filesByPath.values()]);

  readonly getMarkdownFiles = vi.fn((): TFile[] => this.getFiles().filter((file) => file.path.endsWith(".md")));

  readonly getFileByPath = vi.fn((path: string): TFile | null => {
    const file = this.filesByPath.get(path);
    if (file === undefined) return null;
    return file;
  });

  readonly read = vi.fn(async (file: TFile): Promise<string> => {
    const failure = this.readFailures.get(file.path);
    if (failure !== undefined) throw new Error(failure);
    return this.textOf(file.path);
  });

  readonly process = vi.fn(async (file: TFile, change: (text: string) => string): Promise<string> => {
    const failure = this.changeFailures.get(file.path);
    if (failure !== undefined) throw new Error(failure);
    const next = change(this.textOf(file.path));
    if (next !== this.textOf(file.path)) this.written.push(file.path);
    this.texts.set(file.path, next);
    return next;
  });

  readonly rename = vi.fn(async (file: TFile, newPath: string): Promise<void> => {
    const failure = this.renameFailures.get(file.path);
    if (failure !== undefined) throw new Error(failure);
    const text = this.textOf(file.path);
    this.filesByPath.delete(file.path);
    this.texts.delete(file.path);
    this.renames.push([file.path, newPath]);
    file.path = newPath;
    this.filesByPath.set(newPath, file);
    this.texts.set(newPath, text);
  });

  addNote(path: string, text: string): void {
    this.add(path, text);
  }

  removeNote(path: string): void {
    this.filesByPath.delete(path);
    this.texts.delete(path);
  }

  failRenameOf(path: string, message: string): void {
    this.renameFailures.set(path, message);
  }

  failReadOf(path: string, message: string): void {
    this.readFailures.set(path, message);
  }

  failChangeOf(path: string, message: string): void {
    this.changeFailures.set(path, message);
  }

  textAt(path: string): string | undefined {
    return this.texts.get(path);
  }

  private add(path: string, text: string): void {
    this.filesByPath.set(path, { path } as TFile);
    this.texts.set(path, text);
  }

  private textOf(path: string): string {
    const text = this.texts.get(path);
    if (text === undefined) throw new Error(`${path} is gone`);
    return text;
  }
}
