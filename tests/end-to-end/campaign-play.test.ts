import { describe, expect, it, vi } from "vitest";
import { CampaignMaker } from "../../src/campaign/writing/campaign-maker";
import { FundsPage } from "../../src/funds/page/funds-page";
import { OwnCharacters } from "../../src/funds/purses/own-characters";
import { HostCharacterNotes } from "../../src/characters/reading/character-notes";
import { readSessions } from "../../src/campaign/reading/read-campaign";
import { AppendWriter } from "../../src/session-notes/drafts/append-writer";
import { startSession } from "../../src/sessions/start-session";
import { openQuestion } from "../../src/questions/dialogs/open-question";
import { HostNoteTexts } from "../../src/campaign/reading/note-texts";
import { SessionClearer } from "../../src/session-notes/removal/session-clearer";
import { SessionRemoval } from "../../src/session-notes/removal/session-removal";
import { SessionTrash } from "../../src/session-notes/removal/session-trash";
import { SessionRenumbering } from "../../src/session-notes/renumbering/session-renumbering";
import { ConfirmDialog, type ConfirmText } from "../../src/views/dialogs/confirm-dialog";
import { editCharacter } from "../../src/characters/editing/open-character";
import type { InMemoryNotes } from "../host/in-memory-notes";
import { STUB_SPELLING } from "../host/stub-spelling";
import { STUB_SYNTAX } from "../host/stub-syntax";
import { playing, RecordedView, settled, type Playing } from "./playing";

const CAMPAIGN = "D&D/Silver Road";
const MAIN_NOTE = `${CAMPAIGN}/Silver Road.md`;
const SESSION_ONE = `${CAMPAIGN}/Sessions/Session 1.md`;

const MIRA = `${CAMPAIGN}/Characters/Mira.md`;

function withCampaign(notes: InMemoryNotes): void {
  notes.put(MAIN_NOTE, "");
  notes.put(MIRA, "");
  notes.put(SESSION_ONE, "? Who rang the bell\n");
  notes.put("Recipes/Bread.md", "Flour, water.");
}

function nothingThere(): void {}

async function inCampaign(): Promise<Playing> {
  return playing({ campaignsFolder: "D&D", campaignFolder: CAMPAIGN }, withCampaign);
}

function fundsPageOf(game: Playing): RecordedView {
  const { plugin } = game;
  const characterNotes = new HostCharacterNotes({ notes: plugin.notes, campaignFolders: plugin.following.campaignFolders.bind(plugin.following), sessionsOf: (folder: string) => readSessions(plugin.notes.store, folder, STUB_SYNTAX) });
  const page = new FundsPage({
    store: plugin.store,
    opener: { openLink: vi.fn() },
    noteExists: () => false,
    addCoin: null,
    openLedgerEntry: vi.fn(),
    openItem: vi.fn(),
    shownItem: null,
    ownCharacters: new OwnCharacters({ store: plugin.store, notes: characterNotes }, STUB_SYNTAX),
  });
  const view = new RecordedView();
  page.opened(view);
  return view;
}

function pursesOf(funds: RecordedView): { mine: string; party: string } {
  const [mine, party] = funds.root.withClass("dd-purse");
  if (mine === undefined || party === undefined) throw new Error("The funds page shows no purse for each side.");
  return { mine: mine.textContent(), party: party.textContent() };
}

describe("playing a campaign on the in-memory host", () => {
  it("fences the plugin to the Campaigns folder it is given", async () => {
    const game = await playing({}, withCampaign);
    expect(game.plugin.notes.store.note(SESSION_ONE)).toBeNull();
    await game.plugin.saved.campaignsFolder.choose("D&D");
    expect(game.plugin.notes.store.note(SESSION_ONE)).not.toBeNull();
    expect(game.plugin.notes.store.note("Recipes/Bread.md")).toBeNull();
  });

  it("refuses to write a note outside the Campaigns folder", async () => {
    const game = await inCampaign();
    await expect(game.plugin.notes.store.make("Recipes/Cake.md", "Eggs.")).rejects.toThrow();
    expect(game.notes.note("Recipes/Cake.md")).toBeNull();
  });

  it("makes a campaign and moves into it", async () => {
    const game = await playing({ campaignsFolder: "D&D" }, nothingThere);
    const { plugin, telling } = game;
    const maker = new CampaignMaker(plugin.notes.store, () => plugin.saved.campaignsFolder.path, plugin.saved.chosen.choose.bind(plugin.saved.chosen), STUB_SPELLING, telling);
    expect(await maker.make("Pale Moon")).toBe(true);
    expect(game.notes.note("D&D/Pale Moon/Pale Moon.md")).not.toBeNull();
    expect(plugin.store.campaignFolder).toBe("D&D/Pale Moon");
  });

  it("starts the next session from its dialog and opens its notes", async () => {
    const game = await inCampaign();
    const openNotes = vi.fn(async () => {});
    startSession({ dialogs: game.dialogs, telling: game.telling }, game.plugin.notes, game.plugin.store.campaignFolder, openNotes);
    const dialog = game.dialogs.last();
    dialog.root.find("button", "Start session").press();
    await settled();
    expect(game.notes.note(`${CAMPAIGN}/Sessions/Session 2.md`)).not.toBeNull();
    expect(openNotes).toHaveBeenCalledExactlyOnceWith(`${CAMPAIGN}/Sessions/Session 2.md`);
  });

  it("shows coin typed into a session on the funds page", async () => {
    const game = await inCampaign();
    const funds = fundsPageOf(game);
    await settled();
    expect(pursesOf(funds)).toEqual({ mine: "0 gp", party: "0 gp" });
    await new AppendWriter(game.plugin.notes.store, STUB_SYNTAX).save(SESSION_ONE, "$ 20 gp");
    game.notes.readBack(game.notes.note(SESSION_ONE)!);
    expect(pursesOf(funds)).toEqual({ mine: "0 gp", party: "20 gp" });
  });

  it("answers a question from its dialog, writing the answer into the session", async () => {
    const game = await inCampaign();
    const { plugin } = game;
    const [question] = plugin.store.current.questions;
    const closed = vi.fn();
    openQuestion({ dialogs: game.dialogs, telling: game.telling }, plugin.notes.store, plugin.store, question!.source, vi.fn(), closed, SESSION_ONE, STUB_SYNTAX);
    const dialog = game.dialogs.last();
    dialog.root.first("textarea").type("[[Old Tom]]");
    dialog.root.find("button", "Save").press();
    await settled();
    expect(game.notes.texts.get(SESSION_ONE)).toBe("? Who rang the bell\n?= Who rang the bell: [[Old Tom]]\n");
    expect(closed).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("deletes a session once it is confirmed, sending its note to the trash", async () => {
    const game = await inCampaign();
    const { plugin, dialogs } = game;
    const store = plugin.notes.store;
    const deleted = vi.fn();
    const confirm = (text: ConfirmText, confirmed: () => void, closed: () => void) => dialogs.open(new ConfirmDialog(text, confirmed, closed));
    const removal = new SessionRemoval(
      SESSION_ONE,
      {
        clearer: new SessionClearer(store, STUB_SYNTAX),
        trash: new SessionTrash(store, plugin.notes.keeping, () => false),
        renumbering: new SessionRenumbering(store, plugin.following.campaignFolders.bind(plugin.following), STUB_SYNTAX),
        confirm,
        report: vi.fn(),
        texts: new HostNoteTexts(plugin.notes),
        keptDrafts: game.drafts.keeping.keptDrafts,
      },
      { heading: () => "Session 1", busy: () => false, say: vi.fn(), changed: vi.fn(), deleted },
      STUB_SYNTAX,
    );
    removal.deleteSession();
    await settled();
    dialogs.last().root.find("button", "Delete session").press();
    await removal.settled();
    expect(game.notes.trashed).toEqual([SESSION_ONE]);
    expect(deleted).toHaveBeenCalledExactlyOnceWith(null);
  });

  it("renames a character from its dialog, moving its note", async () => {
    const game = await inCampaign();
    const { plugin } = game;
    const characters = new HostCharacterNotes({ notes: plugin.notes, campaignFolders: plugin.following.campaignFolders.bind(plugin.following), sessionsOf: (folder: string) => readSessions(plugin.notes.store, folder, STUB_SYNTAX) });
    const editing = { showing: { dialogs: game.dialogs, telling: game.telling }, notes: plugin.notes, characters, spelling: STUB_SPELLING, syntax: STUB_SYNTAX };
    editCharacter(editing, plugin.notes.store.note(MIRA)!);
    await settled();
    const dialog = game.dialogs.last();
    dialog.root.labelled("Name").type("Mira Vale");
    dialog.root.find("button", "Save").press();
    await settled();
    expect(game.notes.note(MIRA)).toBeNull();
    expect(game.notes.note(`${CAMPAIGN}/Characters/Mira Vale.md`)).not.toBeNull();
  });
});
