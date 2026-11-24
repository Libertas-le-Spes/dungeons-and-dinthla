import type { NoteRef } from "../../host/notes/note-ref";
import type { Source } from "../../campaign/record/campaign";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { CastPage, type WatchFiles } from "../../characters/pages/cast-page";
import { castPageFor, type CastPages } from "../../characters/pages/cast-page-for";
import { CharacterPage } from "../../characters/pages/character-page";
import { CharacterSheetPage, type SheetActions } from "../../characters/pages/character-sheet-page";
import { FallenSheetPage } from "../../characters/pages/fallen-sheet-page";
import type { CastNotes } from "../../characters/reading/character-notes";
import type { MentionNotes } from "../../characters/reading/mention-notes";
import type { SheetNotes } from "../../characters/reading/sheet-notes";
import type { CharacterCreators } from "../../characters/pages/character-creators";
import type { LinkActions } from "../../views/lists/linked-text";
import type { MakePage, ShowPage } from "../view/campaign-pages";

export interface CastNeeds {
  store: CampaignStore;
  characterNotes: CastNotes;
  sheetNotes: SheetNotes;
  mentionNotes: MentionNotes;
  actions: LinkActions;
  sheetActions: SheetActions;
  creators: CharacterCreators;
  watchFiles: WatchFiles;
}

function galleryOf(contentEl: HTMLElement, needs: CastNeeds, show: ShowPage): CastPage {
  const showSheet = (source: Source) => show({ page: "cast", path: source.path });
  const actions = { ...needs.actions, openRow: showSheet };
  return new CastPage(contentEl, needs.store, needs.characterNotes, actions, needs.creators, needs.watchFiles);
}

function characterPageOf(contentEl: HTMLElement, file: NoteRef, needs: CastNeeds, show: ShowPage): CharacterPage {
  const sheet = (sheetEl: HTMLElement, sheetFile: NoteRef) =>
    new CharacterSheetPage(sheetEl, sheetFile, needs.store, needs.sheetNotes, needs.sheetActions, needs.mentionNotes);
  return new CharacterPage(contentEl, file, sheet, () => show({ page: "cast", path: null }));
}

function fallenPageOf(contentEl: HTMLElement, file: NoteRef, needs: CastNeeds, show: ShowPage): CharacterPage {
  const leave = () => show({ page: "cast", path: file.path });
  const sheet = (sheetEl: HTMLElement, sheetFile: NoteRef) =>
    new FallenSheetPage(sheetEl, sheetFile, { store: needs.store, notes: needs.sheetNotes, links: needs.sheetActions, makeMain: needs.creators, leave });
  return new CharacterPage(contentEl, file, sheet, () => show({ page: "cast", path: null }));
}

function castPagesOf(needs: CastNeeds, show: ShowPage): CastPages {
  return {
    notes: needs.sheetNotes,
    gallery: (contentEl) => galleryOf(contentEl, needs, show),
    character: (contentEl, file) => characterPageOf(contentEl, file, needs, show),
    fallen: (contentEl, file) => fallenPageOf(contentEl, file, needs, show),
  };
}

export function castSection(needs: CastNeeds): MakePage {
  return (contentEl, show, path) => castPageFor(contentEl, path, castPagesOf(needs, show));
}
