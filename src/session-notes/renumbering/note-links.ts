import { noteInCampaignFor, type CampaignNoteFiles } from "../../views/opening/note-in-campaign";
import type { SessionRename } from "./renumbering-plan";
import type { NewTarget } from "./wiki-links";

const NOTE_ENDING = ".md";

function lastSlashIn(path: string): number {
  return path.lastIndexOf("/");
}

function noteNameOf(path: string): string {
  const name = path.slice(lastSlashIn(path) + 1);
  if (name.endsWith(NOTE_ENDING)) return name.slice(0, -NOTE_ENDING.length);
  return name;
}

function endingOf(target: string): string {
  if (target.endsWith(NOTE_ENDING)) return NOTE_ENDING;
  return "";
}

function retargeted(target: string, rename: SessionRename): string {
  const folders = target.slice(0, lastSlashIn(target) + 1);
  return `${folders}${noteNameOf(rename.to)}${endingOf(target)}`;
}

export class NoteLinks {
  readonly newTarget: NewTarget = (target) => this.newTargetOf(target);
  private readonly left = new Set<string>();

  constructor(
    private readonly notePath: string,
    private readonly campaigns: string[],
    private readonly files: CampaignNoteFiles,
    private readonly renames: SessionRename[],
  ) {}

  leftAsWritten(): string[] {
    return [...this.left];
  }

  private newTargetOf(target: string): string | null {
    const linkpath = target.trim();
    const meant = this.sessionsMeantBy(linkpath);
    const moved = this.renames.find((rename) => meant.includes(rename.from));
    if (moved === undefined) return null;
    if (meant.length > 1) {
      this.left.add(linkpath);
      return null;
    }
    return retargeted(linkpath, moved);
  }

  private sessionsMeantBy(linkpath: string): string[] {
    const meant: string[] = [];
    for (const campaign of this.campaigns) {
      const found = noteInCampaignFor(this.files, campaign, linkpath, this.notePath);
      if (found !== null) meant.push(found.path);
    }
    return meant;
  }
}
