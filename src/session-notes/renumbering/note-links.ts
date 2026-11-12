import { foldersPartOf, markdownEndingOf, noteNameOf } from "../../campaign/paths/note-name";
import { noteInCampaignFor, type CampaignNoteFiles } from "../../views/opening/note-in-campaign";
import type { SessionRename } from "./renumbering-plan";
import type { NewTarget } from "./wiki-links";

function retargeted(target: string, rename: SessionRename): string {
  return `${foldersPartOf(target)}${noteNameOf(rename.to)}${markdownEndingOf(target)}`;
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
