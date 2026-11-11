import type { TFile } from "obsidian";
import type { Source } from "../campaign/campaign";
import type { CampaignStore } from "../campaign/campaign-store";
import { CastPage, type WatchFiles } from "../characters/cast-page";
import { castPageFor, type CastPages } from "../characters/cast-page-for";
import { CharacterPage } from "../characters/character-page";
import { CharacterSheetPage, type SheetActions } from "../characters/character-sheet-page";
import type { CharacterNotes } from "../characters/character-notes";
import type { MentionNotes } from "../characters/mention-notes";
import type { SheetNotes } from "../characters/sheet-notes";
import type { LinkActions } from "../views/lists/linked-text";
import type { MakePage, ShowPage } from "./campaign-pages";

export interface CastNeeds {
  store: CampaignStore;
  characterNotes: CharacterNotes;
  sheetNotes: SheetNotes;
  mentionNotes: MentionNotes;
  actions: LinkActions;
  sheetActions: SheetActions;
  newCharacter(returnFocus: () => void): void;
  watchFiles: WatchFiles;
}

function galleryOf(contentEl: HTMLElement, needs: CastNeeds, show: ShowPage): CastPage {
  const showSheet = (source: Source) => show({ page: "cast", path: source.path });
  const actions = { ...needs.actions, openRow: showSheet };
  return new CastPage(contentEl, needs.store, needs.characterNotes, actions, needs.newCharacter, needs.watchFiles);
}

function characterPageOf(contentEl: HTMLElement, file: TFile, needs: CastNeeds, show: ShowPage): CharacterPage {
  const sheet = (sheetEl: HTMLElement, sheetFile: TFile) =>
    new CharacterSheetPage(sheetEl, sheetFile, needs.store, needs.sheetNotes, needs.sheetActions, needs.mentionNotes);
  return new CharacterPage(contentEl, file, sheet, () => show({ page: "cast", path: null }));
}

function castPagesOf(needs: CastNeeds, show: ShowPage): CastPages {
  return {
    notes: needs.sheetNotes,
    gallery: (contentEl) => galleryOf(contentEl, needs, show),
    character: (contentEl, file) => characterPageOf(contentEl, file, needs, show),
  };
}

export function castSection(needs: CastNeeds): MakePage {
  return (contentEl, show, path) => castPageFor(contentEl, path, castPagesOf(needs, show));
}
