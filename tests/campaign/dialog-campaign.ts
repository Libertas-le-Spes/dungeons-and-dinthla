import type { TFile } from "obsidian";
import { buildCampaign } from "../../src/campaign/reading/build-campaign";
import type { Campaign, SessionNote } from "../../src/campaign/record/campaign";
import type { CampaignStore } from "../../src/campaign/reading/campaign-store";
import { sessionNoteOf } from "../../src/campaign/paths/session-file";
import type { Gate } from "../../src/fence/gate/gatekeeper";
import { openedModals } from "../stubs/obsidian";

function numberOf(path: string): number {
  const found = /(\d+)\.md$/.exec(path);
  if (found === null) return 0;
  return Number(found[1]);
}

export class DialogCampaign {
  readonly texts: Map<string, string>;
  writes = 0;
  read: Map<string, string>;
  private campaign: Campaign | null = null;

  constructor(notes: Record<string, string>) {
    this.texts = new Map(Object.entries(notes));
    this.read = new Map(this.texts);
  }

  get gate(): Gate {
    const fileOf = (path: string) => ({ path, basename: path.slice(path.lastIndexOf("/") + 1).replace(/\.md$/, "") }) as TFile;
    const files = {
      getFiles: () => [...this.texts.keys()].map(fileOf),
      getMarkdownFiles: () => [...this.texts.keys()].map(fileOf),
      getFileByPath: (path: string) => {
        if (!this.texts.has(path)) return null;
        return fileOf(path);
      },
      process: async (file: TFile, change: (text: string) => string) => {
        this.writes += 1;
        const next = change(this.textOf(file.path));
        this.texts.set(file.path, next);
        return next;
      },
      read: async (file: TFile) => this.textOf(file.path),
    };
    return { files, metadata: { fileToLinktext: (file: TFile) => file.basename } } as unknown as Gate;
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
    return [...this.read].map(([path, text]) => sessionNoteOf(path, numberOf(path), text));
  }

  get current(): Campaign {
    if (this.campaign === null) this.campaign = buildCampaign(this.sessionNotes);
    return this.campaign;
  }

  readAgain(): void {
    this.read = new Map(this.texts);
    this.campaign = null;
  }

  private textOf(path: string): string {
    const text = this.texts.get(path);
    if (text === undefined) throw new Error(`${path} is gone`);
    return text;
  }
}

export function lastDialog<T>(): T {
  return openedModals[openedModals.length - 1] as unknown as T;
}
