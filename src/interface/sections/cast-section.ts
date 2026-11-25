import type { NoteRef } from "../../host/notes/note-ref";
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
import type { LinkActions } from "./link-actions";
import type { Pauses } from "../../host/keeping/pauses";
import type { MakePage, ShowPage } from "../view/campaign-pages";
import type { PropertiesSyntax } from "../../campaign/paths/session-file";
import { PageFrame } from "../../obsidian/views/frames/page-frame";
import { PLAIN_KIT } from "../../obsidian/views/mount/mount-kit";

export interface CastNeeds {
  store: CampaignStore;
  characterNotes: CastNotes;
  sheetNotes: SheetNotes;
  mentionNotes: MentionNotes;
  actions: LinkActions;
  sheetActions: SheetActions;
  creators: CharacterCreators;
  watchFiles: WatchFiles;
  pauses: Pauses;
}

function galleryOf(contentEl: HTMLElement, needs: CastNeeds, show: ShowPage, syntax: PropertiesSyntax): PageFrame {
  const showSheet = (path: string) => show({ page: "cast", path });
  return new PageFrame(contentEl, new CastPage(needs.store, needs.characterNotes, showSheet, needs.creators, needs.watchFiles, syntax), PLAIN_KIT);
}

function characterPageOf(contentEl: HTMLElement, file: NoteRef, needs: CastNeeds, show: ShowPage, syntax: PropertiesSyntax): PageFrame {
  const sheet = new CharacterSheetPage({ file, store: needs.store, notes: needs.sheetNotes, actions: needs.sheetActions, mentionNotes: needs.mentionNotes, pauses: needs.pauses }, syntax);
  return new PageFrame(contentEl, new CharacterPage(sheet, () => show({ page: "cast", path: null })), PLAIN_KIT);
}

function fallenPageOf(contentEl: HTMLElement, file: NoteRef, needs: CastNeeds, show: ShowPage, syntax: PropertiesSyntax): PageFrame {
  const leave = () => show({ page: "cast", path: file.path });
  const sheet = new FallenSheetPage(file, { store: needs.store, notes: needs.sheetNotes, links: needs.sheetActions, makeMain: needs.creators, leave }, syntax);
  return new PageFrame(contentEl, new CharacterPage(sheet, () => show({ page: "cast", path: null })), PLAIN_KIT);
}

function castPagesOf(needs: CastNeeds, show: ShowPage, syntax: PropertiesSyntax): CastPages {
  return {
    notes: needs.sheetNotes,
    gallery: (contentEl) => galleryOf(contentEl, needs, show, syntax),
    character: (contentEl, file) => characterPageOf(contentEl, file, needs, show, syntax),
    fallen: (contentEl, file) => fallenPageOf(contentEl, file, needs, show, syntax),
  };
}

export function castSection(needs: CastNeeds, syntax: PropertiesSyntax): MakePage {
  return (contentEl, show, path) => castPageFor(contentEl, path, castPagesOf(needs, show, syntax));
}
