import type { TFile } from "obsidian";
import { buildCampaign } from "../../src/campaign/reading/build-campaign";
import type { Campaign, SessionNote } from "../../src/campaign/record/campaign";
import type { CampaignStore } from "../../src/campaign/reading/campaign-store";
import { noteNameOf } from "../../src/campaign/paths/note-name";
import { sessionNoteOf } from "../../src/campaign/paths/session-file";
import type { GateWithNotes } from "../host/gate-with-notes";
import { notesOverFakes } from "../host/notes-over-fakes";
import { openedModals } from "../stubs/obsidian";
import { STUB_SYNTAX } from "../host/stub-syntax";
import { ModalFrame } from "../../src/obsidian/views/frames/modal-frame";

function numberOf(path: string): number {
  const found = /(\d+)\.md$/.exec(path);
  if (found === null) return 0;
  return Number(found[1]);
}

export class DialogCampaign {
  readonly texts: Map<string, string>;
  writes = 0;
  readonly linksAsked: { linkpath: string; sourcePath: string }[] = [];
  private files = new Map<string, TFile>();
  private readonly characterPaths: string[] = [];
  read: Map<string, string>;
  private campaign: Campaign | null = null;

  constructor(notes: Record<string, string>) {
    this.texts = new Map(Object.entries(notes));
    this.read = new Map(this.texts);
  }

  get gate(): GateWithNotes {
    const fileOf = (path: string) => this.fileAt(path);
    const files = {
      getFiles: () => [...this.texts.keys()].map(fileOf),
      getMarkdownFiles: () => [...this.texts.keys()].map(fileOf),
      getFileByPath: (path: string) => {
        if (!this.texts.has(path) && !this.characterPaths.includes(path)) return null;
        return this.fileAt(path);
      },
      process: async (file: TFile, change: (text: string) => string) => {
        this.writes += 1;
        const next = change(this.textOf(file.path));
        this.texts.set(file.path, next);
        return next;
      },
      read: async (file: TFile) => this.textOf(file.path),
    };
    const metadata = {
      fileToLinktext: (file: TFile) => file.basename,
      getFirstLinkpathDest: (linkpath: string, sourcePath: string) => {
        this.linksAsked.push({ linkpath, sourcePath });
        return this.linkDestination(linkpath);
      },
    };
    return { files, metadata, notes: notesOverFakes({ files, metadata }) } as unknown as GateWithNotes;
  }

  get store(): CampaignStore {
    const campaign = this;
    return {
      campaignFolder: "Pale Moon",
      get sessionNotes(): SessionNote[] {
        return campaign.sessionNotes;
      },
      get current(): Campaign {
        return campaign.current;
      },
    } as unknown as CampaignStore;
  }

  get sessionNotes(): SessionNote[] {
    return [...this.read].map(([path, text]) => sessionNoteOf(path, numberOf(path), text, STUB_SYNTAX));
  }

  get current(): Campaign {
    if (this.campaign === null) this.campaign = buildCampaign(this.sessionNotes);
    return this.campaign;
  }

  addNote(path: string, text: string): void {
    this.files.delete(path);
    this.texts.set(path, text);
  }

  deleteNote(path: string): void {
    this.files.delete(path);
    this.texts.delete(path);
  }

  moveNote(from: string, to: string): void {
    const file = this.fileAt(from);
    const text = this.textOf(from);
    this.files.delete(from);
    this.texts.delete(from);
    file.path = to;
    this.files.set(to, file);
    this.texts.set(to, text);
  }

  holdCharacterNote(file: TFile): void {
    this.characterPaths.push(file.path);
    this.files.set(file.path, file);
  }

  addCharacterNote(path: string): TFile {
    this.characterPaths.push(path);
    return this.fileAt(path);
  }

  readAgain(): void {
    this.read = new Map(this.texts);
    this.campaign = null;
  }

  private linkDestination(linkpath: string): TFile | null {
    const wanted = `${linkpath.toLowerCase()}.md`;
    for (const path of this.characterPaths) {
      const lower = path.toLowerCase();
      if (lower === wanted || lower.endsWith(`/${wanted}`)) return this.fileAt(path);
    }
    return null;
  }

  private fileAt(path: string): TFile {
    const known = this.files.get(path);
    if (known !== undefined) return known;
    const made = { path, basename: noteNameOf(path) } as TFile;
    this.files.set(path, made);
    return made;
  }

  private textOf(path: string): string {
    const text = this.texts.get(path);
    if (text === undefined) throw new Error(`${path} is gone`);
    return text;
  }
}

export function lastFrame(): ModalFrame {
  const modal = openedModals[openedModals.length - 1];
  if (!(modal instanceof ModalFrame)) throw new Error("The last dialog isn't in a modal frame.");
  return modal;
}

export function lastDialog<T>(): T {
  const modal = openedModals[openedModals.length - 1];
  if (modal instanceof ModalFrame) return modal.dialog as unknown as T;
  return modal as unknown as T;
}

const SESSION_TWO = "Pale Moon/Sessions/Session 2.md";
const SESSION_THREE = "Pale Moon/Sessions/Session 3.md";

export const SESSION_TWO_LOST: [string, (campaign: DialogCampaign) => void][] = [
  ["deleted", (campaign) => campaign.deleteNote(SESSION_TWO)],
  [
    "deleted and the next session renumbered into its path",
    (campaign) => {
      campaign.addNote(SESSION_THREE, "Later\n");
      campaign.deleteNote(SESSION_TWO);
      campaign.moveNote(SESSION_THREE, SESSION_TWO);
    },
  ],
  [
    "deleted and made again",
    (campaign) => {
      campaign.deleteNote(SESSION_TWO);
      campaign.addNote(SESSION_TWO, "");
    },
  ],
];
