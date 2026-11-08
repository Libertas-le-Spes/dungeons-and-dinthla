import { describe, expect, it, vi } from "vitest";
import type { BasesQueryResult, QueryController, TFile } from "obsidian";
import type { SessionNote } from "../../src/campaign/campaign";
import type { CampaignStore } from "../../src/campaign/campaign-store";
import type { CharacterNotes } from "../../src/characters/character-notes";
import { CharactersView } from "../../src/characters/characters-view";
import { obsidianDocument } from "../views/obsidian-dom";

const FOLDER = "Pale Moon/Characters";

function fileOf(name: string, folder = FOLDER): TFile {
  return { path: `${folder}/${name}.md`, basename: name } as TFile;
}

function asFile(shown: string | TFile): TFile {
  if (typeof shown === "string") return fileOf(shown);
  return shown;
}

function sessionOf(number: number, lines: string[], campaign = "Pale Moon"): SessionNote {
  return { path: `${campaign}/Sessions/Session ${number}.md`, number, firstLine: 0, text: lines.join("\n") };
}

interface Setup {
  sessions?: SessionNote[];
  storeFolder?: string;
  otherSessions?: SessionNote[];
  linkPaths?: Record<string, string>;
  ownNotes?: Record<string, string>;
  own?: string | null;
  textOf?: CharacterNotes["textOf"];
}

function ownNoteReader(ownNotes: Record<string, string>): CharacterNotes["textOf"] {
  return async (file) => {
    const text = ownNotes[file.basename];
    if (text === undefined) return "";
    return text;
  };
}

function openGallery({
  sessions = [],
  storeFolder = "Pale Moon",
  otherSessions = [],
  linkPaths = {},
  ownNotes = {},
  own = null,
  textOf = ownNoteReader(ownNotes),
}: Setup = {}) {
  let listener = () => {};
  let noteChanged: (path: string) => void = () => {};
  const unsubscribe = vi.fn();
  const stopWatchingNotes = vi.fn();
  const store = {
    campaignFolder: storeFolder,
    sessionNotes: sessions,
    subscribe: (next: () => void) => {
      listener = next;
      return unsubscribe;
    },
  };
  const sessionsAskedFor: string[] = [];
  const reads = { count: 0 };
  const owner = { name: own };
  const notes: CharacterNotes = {
    textOf: (file) => {
      reads.count += 1;
      return textOf(file);
    },
    pathOfLink: (linktext) => {
      const path = linkPaths[linktext];
      if (path !== undefined) return path;
      return `${FOLDER}/${linktext}.md`;
    },
    isOwnCharacter: (file) => file.basename === owner.name,
    campaignFolders: () => ["Ashen Road", "Pale Moon"],
    sessionsOf: async (folder) => {
      sessionsAskedFor.push(folder);
      return otherSessions;
    },
    onNoteChanged: (changed) => {
      noteChanged = changed;
      return stopWatchingNotes;
    },
  };
  const actions = { openRow: vi.fn(), openLink: vi.fn() };
  const container = obsidianDocument().createElement("div");
  const view = new CharactersView({} as QueryController, container, store as unknown as CampaignStore, notes, actions);
  const registered: (() => void)[] = [];
  view.register = (callback) => {
    registered.push(callback);
  };
  const update = (shown: (string | TFile)[]) => {
    view.data = { data: shown.map((shownFile) => ({ file: asFile(shownFile) })) } as unknown as BasesQueryResult;
    view.onDataUpdated();
  };
  const show = async (shown: (string | TFile)[]) => {
    update(shown);
    await vi.waitFor(() => expect(container.querySelector(".dd-title")).not.toBeNull());
  };
  view.onload();
  const unload = () => {
    for (const callback of registered) callback();
  };
  return {
    container,
    store,
    actions,
    owner,
    reads,
    sessionsAskedFor,
    listener: () => listener(),
    noteChanged: (path: string) => noteChanged(path),
    update,
    show,
    unload,
    unsubscribe,
    stopWatchingNotes,
  };
}

function textsOf(root: HTMLElement, selector: string): string[] {
  return Array.from(root.querySelectorAll(selector)).map((element) => String(element.textContent));
}

describe("CharactersView", () => {
  it("draws a card for each character Bases shows, in its order, with the count", async () => {
    const gallery = openGallery();
    await gallery.show(["Mira", "Brother Aldric"]);
    expect(textsOf(gallery.container, ".dd-card-name")).toEqual(["Mira", "Brother Aldric"]);
    expect(textsOf(gallery.container, ".dd-title .dd-count")).toEqual(["2"]);
  });

  it("shows the type line, subtitle and key values learned in the sessions, with ? for what isn't known", async () => {
    const sessions = [
      sessionOf(1, ["[[Mira]] class: rogue, AC: 15, DEX: 17, CON: 9", "[[Mira]] type: Medium humanoid (half-elf), chaotic good"]),
      sessionOf(2, ["[[Mira]] subtitle: Half-elf Ranger 5, HP: 44"]),
    ];
    const gallery = openGallery({ sessions });
    await gallery.show(["Mira"]);
    const card = gallery.container.querySelector<HTMLElement>(".dd-card")!;
    expect(textsOf(card, ".dd-card-type")).toEqual(["Medium humanoid (half-elf), chaotic good"]);
    expect(textsOf(card, ".dd-card-subtitle")).toEqual(["Half-elf Ranger 5"]);
    expect(textsOf(card, ".dd-card-line")).toEqual(["Class rogue", "Armor Class 15", "Hit Points 44", "Speed ?"]);
    expect(textsOf(card, ".dd-card-abilities > div")).toEqual(["STR?", "DEX17 (+3)", "CON9 (−1)", "INT?", "WIS?", "CHA?"]);
    expect(textsOf(card, ".dd-unknown")).toEqual(["?", "?", "?", "?", "?"]);
  });

  it("leaves out the type line and subtitle when neither is known", async () => {
    const gallery = openGallery();
    await gallery.show(["Mira"]);
    expect(gallery.container.querySelectorAll(".dd-card-type, .dd-card-subtitle")).toHaveLength(0);
  });

  it("shows a score with no modifier when it isn't a whole number", async () => {
    const gallery = openGallery({ sessions: [sessionOf(1, ["[[Mira]] STR: strong"])] });
    await gallery.show(["Mira"]);
    expect(textsOf(gallery.container, ".dd-card-abilities > div")[0]).toBe("STRstrong");
  });

  it("lets the character's own note override what the sessions say", async () => {
    const gallery = openGallery({ sessions: [sessionOf(1, ["[[Mira]] AC: 15"])], ownNotes: { Mira: "AC: 16" } });
    await gallery.show(["Mira"]);
    expect(textsOf(gallery.container, ".dd-card-line")[1]).toBe("Armor Class 16");
  });

  it("gives each card only its own character's facts", async () => {
    const gallery = openGallery({ sessions: [sessionOf(1, ["[[Lady Vess]] AC: 12", "[[Mira]] AC: 15"])] });
    await gallery.show(["Mira", "Lady Vess"]);
    expect(textsOf(gallery.container, ".dd-card-line:nth-child(4)")).toEqual(["Armor Class 15", "Armor Class 12"]);
  });

  it("sets the player's own character subtly apart", async () => {
    const gallery = openGallery({ own: "Thessaly" });
    await gallery.show(["Mira", "Thessaly"]);
    const cards = Array.from(gallery.container.querySelectorAll(".dd-card"));
    expect(cards.map((card) => card.classList.contains("dd-card-own"))).toEqual([false, true]);
    expect(textsOf(gallery.container, ".dd-card-own-label")).toEqual(["Your character"]);
  });

  it("opens the character's note when a card is tapped or chosen with the keyboard", async () => {
    const gallery = openGallery();
    await gallery.show(["Mira"]);
    const card = gallery.container.querySelector<HTMLElement>(".dd-card")!;
    card.click();
    card.dispatchEvent(new card.ownerDocument.defaultView!.KeyboardEvent("keydown", { key: "Enter" }));
    expect(gallery.actions.openRow.mock.calls).toEqual([[{ path: `${FOLDER}/Mira.md`, line: 0 }], [{ path: `${FOLDER}/Mira.md`, line: 0 }]]);
  });

  it("says how to add a character when there are none, with no count", async () => {
    const gallery = openGallery();
    await gallery.show([]);
    expect(textsOf(gallery.container, ".dd-empty")).toEqual(["No characters yet. A note in the campaign’s Characters folder adds one."]);
    expect(gallery.container.querySelectorAll(".dd-count, .dd-gallery")).toHaveLength(0);
  });

  it("draws the cards again when a session changes", async () => {
    const gallery = openGallery();
    await gallery.show(["Mira"]);
    gallery.store.sessionNotes = [sessionOf(1, ["[[Mira]] HP: 12"])];
    gallery.listener();
    await vi.waitFor(() => expect(textsOf(gallery.container, ".dd-card-line")[2]).toBe("Hit Points 12"));
    expect(gallery.container.querySelectorAll(".dd-card")).toHaveLength(1);
  });

  it("stops listening to the campaign and the notes when unloaded", () => {
    const gallery = openGallery();
    gallery.unload();
    expect(gallery.unsubscribe).toHaveBeenCalledOnce();
    expect(gallery.stopWatchingNotes).toHaveBeenCalledOnce();
  });

  it("reads a character's own campaign when the plugin follows another one", async () => {
    const gallery = openGallery({
      storeFolder: "Ashen Road",
      sessions: [sessionOf(1, ["[[Mira]] AC: 99"], "Ashen Road")],
      otherSessions: [sessionOf(1, ["[[Mira]] AC: 15"])],
    });
    await gallery.show(["Mira"]);
    expect(textsOf(gallery.container, ".dd-card-line")[1]).toBe("Armor Class 15");
    expect(gallery.sessionsAskedFor).toEqual(["Pale Moon"]);
  });

  it("reads each campaign's sessions once a drawing, however many cards it has", async () => {
    const gallery = openGallery({ storeFolder: "Ashen Road", otherSessions: [sessionOf(1, ["[[Mira]] AC: 15", "[[Lady Vess]] AC: 12"])] });
    await gallery.show(["Mira", "Lady Vess"]);
    expect(textsOf(gallery.container, ".dd-card-line:nth-child(4)")).toEqual(["Armor Class 15", "Armor Class 12"]);
    expect(gallery.sessionsAskedFor).toEqual(["Pale Moon"]);
  });

  it("learns nothing for a note outside any campaign", async () => {
    const outside = fileOf("Mira", "Recipes");
    const gallery = openGallery({ otherSessions: [sessionOf(1, ["[[Mira]] AC: 15"])], linkPaths: { Mira: outside.path } });
    await gallery.show([outside]);
    expect(textsOf(gallery.container, ".dd-card-line")[1]).toBe("Armor Class ?");
    expect(gallery.sessionsAskedFor).toEqual([]);
  });

  it("draws again when the campaign note of a shown character changes, so a new own character shows", async () => {
    const gallery = openGallery();
    await gallery.show(["Mira", "Thessaly"]);
    gallery.owner.name = "Thessaly";
    gallery.noteChanged("Pale Moon/Pale Moon.md");
    await vi.waitFor(() => expect(textsOf(gallery.container, ".dd-card-own .dd-card-name")).toEqual(["Thessaly"]));
  });

  it("doesn't draw again when some other note changes", async () => {
    const gallery = openGallery();
    await gallery.show(["Mira"]);
    const reads = gallery.reads.count;
    gallery.noteChanged("Ashen Road/Ashen Road.md");
    gallery.noteChanged("Pale Moon/Sessions/Session 1.md");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(gallery.reads.count).toBe(reads);
  });

  it("keeps the newest drawing when an earlier one finishes reading last", async () => {
    let finishFirst: (text: string) => void = () => {};
    const reads = [new Promise<string>((resolve) => (finishFirst = resolve))];
    const textOf = async () => {
      const slow = reads.shift();
      if (slow !== undefined) return slow;
      return "";
    };
    const gallery = openGallery({ textOf });
    gallery.update(["Mira"]);
    await gallery.show(["Lady Vess"]);
    finishFirst("");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(textsOf(gallery.container, ".dd-card-name")).toEqual(["Lady Vess"]);
  });
});
