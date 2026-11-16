import { describe, expect, it, vi } from "vitest";
import { EditorSaves } from "../../../src/kind-notes/watching/editor-saves";
import { SavesHere } from "../../../src/kind-notes/watching/saves-here";
import { SessionWants } from "../../../src/kind-notes/wanting/session-wants";
import { FakeCampaign } from "../fake-campaign";
import { FakeFileEvents } from "../fake-file-events";
import { fileAt } from "../fake-notes";
import { QUESTIONS, SESSION } from "../keeper-setup";

const READ = "? Who sent Mira";
const TYPED = "? Who sent Mira\n? Why is the ferry gone";

const FILES = { getFileByPath: fileAt };

function editorSavesWith(campaign: FakeCampaign, shown: string[]) {
  const events = new FakeFileEvents();
  const saves = new SavesHere();
  const editorTexts = vi.fn();
  editorTexts.mockReturnValue(shown);
  const editorSaves = new EditorSaves({ files: events, store: campaign, wants: new SessionWants(campaign, FILES), saves, editorTexts });
  const stop = editorSaves.start();
  return { events, saves, editorTexts, stop };
}

function campaignHolding(text: string): FakeCampaign {
  const campaign = new FakeCampaign();
  campaign.hold(SESSION, text);
  return campaign;
}

describe("EditorSaves", () => {
  it("takes what Obsidian's editor shows of a session it just saved for a save made here", () => {
    const { events, saves, editorTexts } = editorSavesWith(campaignHolding(READ), [TYPED]);
    events.modify(SESSION);
    expect(editorTexts).toHaveBeenCalledExactlyOnceWith(SESSION);
    expect(saves.takeIfSavedHere(SESSION, TYPED)).toBe(true);
  });

  it("takes a session saved in the editor for the first time, before the campaign has read it", () => {
    const { events, saves } = editorSavesWith(new FakeCampaign(), [TYPED]);
    events.modify(SESSION);
    expect(saves.takeIfSavedHere(SESSION, TYPED)).toBe(true);
  });

  it("takes nothing from an editor that still shows what the campaign last read, as when a change arrives by sync", () => {
    const { events, saves } = editorSavesWith(campaignHolding(READ), [READ]);
    events.modify(SESSION);
    expect(saves.takeIfSavedHere(SESSION, READ)).toBe(false);
  });

  it("takes nothing when no editor shows the session that changed", () => {
    const { events, saves } = editorSavesWith(campaignHolding(READ), []);
    events.modify(SESSION);
    expect(saves.takeIfSavedHere(SESSION, TYPED)).toBe(false);
  });

  it("doesn't look at the editors for a note that isn't a session of the open campaign", () => {
    const { events, saves, editorTexts } = editorSavesWith(campaignHolding(READ), [TYPED]);
    events.modify(QUESTIONS);
    events.modify("D&D/Silver Road/Sessions/Session 2.md");
    expect(editorTexts).not.toHaveBeenCalled();
    expect(saves.takeIfSavedHere(QUESTIONS, TYPED)).toBe(false);
  });

  it("doesn't look at the editors while no campaign is open", () => {
    const campaign = campaignHolding(READ);
    campaign.campaignFolder = null;
    const { events, editorTexts } = editorSavesWith(campaign, [TYPED]);
    events.modify(SESSION);
    expect(editorTexts).not.toHaveBeenCalled();
  });

  it("stops listening when stopped", () => {
    const { events, saves, editorTexts, stop } = editorSavesWith(campaignHolding(READ), [TYPED]);
    stop();
    events.modify(SESSION);
    expect(editorTexts).not.toHaveBeenCalled();
    expect(saves.takeIfSavedHere(SESSION, TYPED)).toBe(false);
  });
});
