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
import type { ShownPage } from "../../views/pages/page-view";

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

function galleryOf(needs: CastNeeds, show: ShowPage, syntax: PropertiesSyntax): ShownPage {
  const showSheet = (path: string) => show({ page: "cast", path });
  return new CastPage(needs.store, needs.characterNotes, showSheet, needs.creators, needs.watchFiles, syntax);
}

function characterPageOf(file: NoteRef, needs: CastNeeds, show: ShowPage, syntax: PropertiesSyntax): ShownPage {
  const sheet = new CharacterSheetPage({ file, store: needs.store, notes: needs.sheetNotes, actions: needs.sheetActions, mentionNotes: needs.mentionNotes, pauses: needs.pauses }, syntax);
  return new CharacterPage(sheet, () => show({ page: "cast", path: null }));
}

function fallenPageOf(file: NoteRef, needs: CastNeeds, show: ShowPage, syntax: PropertiesSyntax): ShownPage {
  const leave = () => show({ page: "cast", path: file.path });
  const sheet = new FallenSheetPage(file, { store: needs.store, notes: needs.sheetNotes, links: needs.sheetActions, makeMain: needs.creators, leave }, syntax);
  return new CharacterPage(sheet, () => show({ page: "cast", path: null }));
}

function castPagesOf(needs: CastNeeds, show: ShowPage, syntax: PropertiesSyntax): CastPages<ShownPage> {
  return {
    notes: needs.sheetNotes,
    gallery: () => galleryOf(needs, show, syntax),
    character: (file) => characterPageOf(file, needs, show, syntax),
    fallen: (file) => fallenPageOf(file, needs, show, syntax),
  };
}

export function castSection(needs: CastNeeds, syntax: PropertiesSyntax): MakePage {
  return (contentEl, show, path) => new PageFrame(contentEl, castPageFor(path, castPagesOf(needs, show, syntax)), PLAIN_KIT);
}
