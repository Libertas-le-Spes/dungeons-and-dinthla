import type { LinkLookup } from "../../host/notes/link-lookup";
import type { NoteChanges, Stop } from "../../host/notes/note-changes";
import type { NoteFacts } from "../../host/notes/note-facts";
import type { NoteSyntax } from "../../host/rules/note-syntax";
import { HeardPath } from "./heard-path";
import { HostSheetNotes, type SheetHost, type SheetNotes, type SheetNotesParts } from "./sheet-notes";

export interface MentionNotes extends Pick<SheetNotes, "fileAt" | "textOf" | "campaignFolders" | "onNoteMoved"> {
  linkingPaths(target: string): string[];
  linkedLines(sourcePath: string, target: string): number[];
  onLinksResolved(resolved: (path: string) => void): Stop;
}

export interface MentionHost extends SheetHost {
  readonly facts: Pick<NoteFacts, "propertyLinksIn" | "propertiesOf" | "linksIn" | "embedsIn">;
  readonly links: Pick<LinkLookup, "target" | "linkCounts">;
  readonly changes: Pick<NoteChanges, "onRead" | "onGone" | "onMoved" | "onLinksSettled">;
}

export interface MentionNotesParts extends SheetNotesParts {
  readonly notes: MentionHost;
  readonly syntax: Pick<NoteSyntax, "linkPathOf">;
}

export class HostMentionNotes extends HostSheetNotes implements MentionNotes {
  constructor(private readonly mentionParts: MentionNotesParts) {
    super(mentionParts);
  }

  linkingPaths(target: string): string[] {
    const paths: string[] = [];
    for (const [source, targets] of Object.entries(this.mentionParts.notes.links.linkCounts())) {
      if (Object.hasOwn(targets, target)) paths.push(source);
    }
    return paths;
  }

  linkedLines(sourcePath: string, target: string): number[] {
    const { store, facts } = this.mentionParts.notes;
    const source = store.note(sourcePath);
    if (source === null) return [];
    const lines = new Set<number>();
    for (const link of [...facts.linksIn(source), ...facts.embedsIn(source)]) {
      if (this.pointsTo(link.linkText, sourcePath, target)) lines.add(link.line);
    }
    return [...lines];
  }

  onLinksResolved(resolved: (path: string) => void): Stop {
    const heard = new HeardPath(resolved);
    return this.mentionParts.notes.changes.onLinksSettled(heard.note.bind(heard));
  }

  private pointsTo(linkText: string, sourcePath: string, target: string): boolean {
    const note = this.mentionParts.notes.links.target(this.mentionParts.syntax.linkPathOf(linkText), sourcePath);
    return note !== null && note.path === target;
  }
}
