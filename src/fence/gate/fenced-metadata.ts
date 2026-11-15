import type { CachedMetadata, EventRef, Events, MetadataCache, TFile } from "obsidian";
import type { HeldFiles } from "./held-files";

export type RawMetadata = Pick<MetadataCache, "getCache" | "getFileCache" | "getFirstLinkpathDest" | "fileToLinktext" | "resolvedLinks" | "unresolvedLinks"> &
  Pick<Events, "on" | "offref">;

export type MetadataEvent = "changed" | "resolve";

type ChangedCallback = (file: TFile, text: string, cache: CachedMetadata) => unknown;

export type LinkCounts = Record<string, Record<string, number>>;

export class FencedMetadata {
  constructor(
    private readonly metadata: RawMetadata,
    private readonly held: HeldFiles,
  ) {}

  get resolvedLinks(): LinkCounts {
    const held = Object.entries(this.metadata.resolvedLinks).filter(([source]) => this.held.holdsPath(source));
    return Object.fromEntries(held.map(([source, targets]) => [source, this.heldTargets(targets)]));
  }

  unresolvedLinksOf(path: string): string[] {
    if (!this.held.holdsPath(path)) return [];
    const links = this.metadata.unresolvedLinks[path];
    if (links === undefined) return [];
    return Object.keys(links);
  }

  getCache(path: string): CachedMetadata | null {
    if (!this.held.holdsPath(path)) return null;
    return this.metadata.getCache(path);
  }

  getFileCache(file: TFile): CachedMetadata | null {
    if (!this.held.holdsFile(file)) return null;
    return this.metadata.getFileCache(file);
  }

  getFirstLinkpathDest(linkpath: string, sourcePath: string): TFile | null {
    if (!this.held.holdsPath(sourcePath)) return null;
    const found = this.metadata.getFirstLinkpathDest(linkpath, sourcePath);
    if (!this.held.holdsFile(found)) return null;
    return found;
  }

  fileToLinktext(file: TFile, sourcePath: string, omitMdExtension?: boolean): string {
    const held = this.held.file(file);
    return this.metadata.fileToLinktext(held, this.held.path(sourcePath), omitMdExtension);
  }

  on(name: "resolve", callback: (file: TFile) => unknown): EventRef;
  on(name: "changed", callback: ChangedCallback): EventRef;
  on(name: MetadataEvent, callback: ChangedCallback): EventRef {
    return this.metadata.on(name, (...data: unknown[]) => this.pass(data, callback));
  }

  offref(ref: EventRef): void {
    this.metadata.offref(ref);
  }

  private heldTargets(targets: Record<string, number>): Record<string, number> {
    return Object.fromEntries(Object.entries(targets).filter(([target]) => this.held.holdsPath(target)));
  }

  private pass(data: unknown[], callback: ChangedCallback): void {
    const [file, text, cache] = data;
    if (!this.held.holdsFile(file)) return;
    callback(file as TFile, text as string, cache as CachedMetadata);
  }
}
