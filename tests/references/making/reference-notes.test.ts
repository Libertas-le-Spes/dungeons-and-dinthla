import { describe, expect, it, vi } from "vitest";
import type { TFile } from "obsidian";
import { ReferenceNotes } from "../../../src/references/making/reference-notes";
import { FakeCampaign } from "../../kind-notes/fake-campaign";
import { FakeNotes, fileAt } from "../../kind-notes/fake-notes";
import type { ReferenceKindName } from "../../../src/kinds/reference-kind";
import type { NewNames } from "../../../src/references/new-names/new-names";
import type { AskNewNames, NewNamesChoice } from "../../../src/references/new-names/new-names-choice";
import { firstOf } from "../../stubs/lists";
import { CAMPAIGN, SESSION, settled } from "../../kind-notes/keeper-setup";

const SESSION_ONE = `${CAMPAIGN}/Sessions/Session 1.md`;
const NOTE_PATH = `${CAMPAIGN}/Characters/Lady Vess.md`;
const FROM = "! Find the caravan, from: [[Lady Vess]]";

interface Asked {
  names: NewNames;
  to: NewNamesChoice;
}

interface World {
  notes: FakeNotes;
  campaign: FakeCampaign;
  unresolved: Record<string, string[]>;
  existing: TFile[];
}

function worldWith(unresolved: string[]): World {
  const notes = new FakeNotes();
  notes.addSession(SESSION_ONE);
  notes.addSession(SESSION);
  const campaign = new FakeCampaign();
  campaign.hold(SESSION_ONE, FROM);
  campaign.hold(SESSION, [FROM, FROM].join("\n"));
  return { notes, campaign, unresolved: { [SESSION_ONE]: unresolved, [SESSION]: unresolved }, existing: [] };
}

function startWith(world: World) {
  const listeners = new Set<(file: TFile) => unknown>();
  const offref = vi.fn();
  const metadata = {
    ...world.notes.metadata,
    on: vi.fn((_name: string, callback: (file: TFile) => unknown) => {
      listeners.add(callback);
      return { callback };
    }),
    offref,
    unresolvedLinksOf: vi.fn((path: string) => {
      const found = world.unresolved[path];
      if (found === undefined) return [];
      return found;
    }),
  };
  const files = { ...world.notes.files, markdownFilesUnder: vi.fn(() => world.existing) };
  const asked: Asked[] = [];
  const askNewNames: AskNewNames = (names, to) => {
    asked.push({ names, to });
  };
  const referenceNotes = new ReferenceNotes({ store: world.campaign, files, metadata, actions: world.notes.actions, say: (message) => world.notes.said.push(message), askNewNames });
  const stop = referenceNotes.start();
  const resolve = (path: string) => {
    for (const listener of listeners) listener(fileAt(path));
  };
  return { referenceNotes, stop, resolve, metadata, offref, listeners, asked, files };
}

describe("ReferenceNotes", () => {
  it("makes the note of a person named on three lines once the saved session is resolved", async () => {
    const world = worldWith(["Lady Vess"]);
    const { referenceNotes, resolve } = startWith(world);
    referenceNotes.sessionSaved(SESSION);
    expect(world.notes.created).toEqual([]);
    resolve(SESSION);
    await settled();
    expect(world.notes.created).toEqual([NOTE_PATH]);
    expect(world.notes.noteAt(NOTE_PATH)?.properties).toEqual({ "first named": "[[Session 1]]" });
  });

  it("makes nothing while the saved session is not yet resolved, or when another session is resolved", async () => {
    const world = worldWith(["Lady Vess"]);
    const { referenceNotes, resolve } = startWith(world);
    referenceNotes.sessionSaved(SESSION);
    resolve(SESSION_ONE);
    await settled();
    expect(world.notes.created).toEqual([]);
  });

  it("makes nothing when the session saved here was deleted or renamed before it resolved, and a later sync arrival resolves it", async () => {
    const world = worldWith(["Lady Vess"]);
    const { referenceNotes, resolve } = startWith(world);
    referenceNotes.sessionSaved(SESSION);
    referenceNotes.sessionGone(SESSION);
    resolve(SESSION);
    await settled();
    expect(world.notes.created).toEqual([]);
  });

  it("makes nothing for a session that was not saved here", async () => {
    const world = worldWith(["Lady Vess"]);
    const { resolve } = startWith(world);
    resolve(SESSION);
    await settled();
    expect(world.notes.created).toEqual([]);
  });

  it("acts once for one save, though the session resolves again", async () => {
    const world = worldWith(["Lady Vess"]);
    const { referenceNotes, resolve, metadata } = startWith(world);
    referenceNotes.sessionSaved(SESSION);
    resolve(SESSION);
    await settled();
    resolve(SESSION);
    await settled();
    expect(world.notes.created).toEqual([NOTE_PATH]);
    expect(metadata.unresolvedLinksOf).toHaveBeenCalledTimes(2);
  });

  it("makes nothing for a name Obsidian can resolve", async () => {
    const world = worldWith([]);
    const { referenceNotes, resolve } = startWith(world);
    referenceNotes.sessionSaved(SESSION);
    resolve(SESSION);
    await settled();
    expect(world.notes.created).toEqual([]);
  });

  it("makes nothing when a note for the name is already anywhere in the campaign, in any case", async () => {
    const world = worldWith(["Lady Vess"]);
    world.existing = [fileAt(`${CAMPAIGN}/Fallen/lady vess.md`)];
    const { referenceNotes, resolve } = startWith(world);
    referenceNotes.sessionSaved(SESSION);
    resolve(SESSION);
    await settled();
    expect(world.notes.created).toEqual([]);
    expect(world.notes.said).toEqual([]);
  });

  it("makes nothing while the campaign is opening, or when no campaign is open", async () => {
    const world = worldWith(["Lady Vess"]);
    const { referenceNotes, resolve } = startWith(world);
    world.campaign.opening = true;
    referenceNotes.sessionSaved(SESSION);
    resolve(SESSION);
    await settled();
    world.campaign.opening = false;
    world.campaign.campaignFolder = null;
    referenceNotes.sessionSaved(SESSION);
    resolve(SESSION);
    await settled();
    expect(world.notes.created).toEqual([]);
  });

  it("says once, across saves, that a name can't be a note", async () => {
    const world = worldWith(["Lady: Vess"]);
    const line = "! Find the caravan, from: [[Lady: Vess]]";
    world.campaign.hold(SESSION_ONE, [line, line, line].join("\n"));
    const { referenceNotes, resolve } = startWith(world);
    for (let save = 0; save < 2; save += 1) {
      referenceNotes.sessionSaved(SESSION);
      resolve(SESSION);
      await settled();
    }
    expect(world.notes.created).toEqual([]);
    expect(world.notes.said).toHaveLength(1);
  });

  it("says once that a note couldn't be written, and writes nothing else", async () => {
    const world = worldWith(["Lady Vess"]);
    world.notes.failProperties = new Error("disk full");
    const { referenceNotes, resolve } = startWith(world);
    for (let save = 0; save < 2; save += 1) {
      referenceNotes.sessionSaved(SESSION);
      resolve(SESSION);
      await settled();
    }
    expect(world.notes.said).toEqual(["Couldn't write the note for Lady Vess: disk full"]);
    expect(world.notes.noteAt(NOTE_PATH)).toBeNull();
  });

  it("says so, once, when the plan itself can't be worked out", async () => {
    const world = worldWith(["Lady Vess"]);
    const { referenceNotes, resolve, metadata } = startWith(world);
    metadata.unresolvedLinksOf.mockImplementation(() => {
      throw new Error("cache gone");
    });
    for (let save = 0; save < 2; save += 1) {
      referenceNotes.sessionSaved(SESSION);
      resolve(SESSION);
      await settled();
    }
    expect(world.notes.said).toEqual(["Couldn't make notes for new names: cache gone"]);
    expect(world.notes.created).toEqual([]);
  });

  it("stops listening when stopped", () => {
    const { stop, offref, listeners } = startWith(worldWith([]));
    expect(listeners.size).toBe(1);
    stop();
    expect(offref).toHaveBeenCalledOnce();
  });

  describe("the new-names list", () => {
    const MIRA_LINE = "? Where is [[Mira]]";
    const MIRA_PATH = `${CAMPAIGN}/Characters/Mira.md`;

    function worldNamingMira(): World {
      const world = worldWith([]);
      world.campaign.hold(SESSION_ONE, [MIRA_LINE, MIRA_LINE].join("\n"));
      world.campaign.hold(SESSION, MIRA_LINE);
      world.unresolved = { [SESSION_ONE]: ["Mira"], [SESSION]: ["Mira"] };
      return world;
    }

    function choose({ names, to }: Asked, kind: ReferenceKindName) {
      return to.chosen({ undecided: firstOf(names.names), kind });
    }

    async function savedAndAsked(world: World) {
      const started = startWith(world);
      started.referenceNotes.sessionSaved(SESSION);
      started.resolve(SESSION);
      await settled();
      return started;
    }

    it("asks once after a save about a name three lines name that no line places, under the saved session's name", async () => {
      const world = worldNamingMira();
      const { asked } = await savedAndAsked(world);
      expect(asked).toHaveLength(1);
      expect(firstOf(asked).names.sessionName).toBe("Session 2");
      expect(firstOf(asked).names.names.map(({ name }) => name)).toEqual(["Mira"]);
      expect(world.notes.created).toEqual([]);
    });

    it("makes the note of the chosen kind, as first named in the earliest session, through the same maker", async () => {
      const world = worldNamingMira();
      const { asked } = await savedAndAsked(world);
      choose(firstOf(asked), "character");
      await settled();
      expect(world.notes.created).toEqual([MIRA_PATH]);
      expect(world.notes.noteAt(MIRA_PATH)?.properties).toEqual({ "first named": "[[Session 1]]" });
    });

    it("makes nothing for a closed list, and asks again after the next save that names the name", async () => {
      const world = worldNamingMira();
      const started = await savedAndAsked(world);
      firstOf(started.asked).to.closed();
      started.referenceNotes.sessionSaved(SESSION);
      started.resolve(SESSION);
      await settled();
      expect(started.asked).toHaveLength(2);
      expect(world.notes.created).toEqual([]);
    });

    it("does not open a second list while one is open", async () => {
      const world = worldNamingMira();
      const started = await savedAndAsked(world);
      started.referenceNotes.sessionSaved(SESSION);
      started.resolve(SESSION);
      await settled();
      expect(started.asked).toHaveLength(1);
    });

    it("does not ask after a save of a session that doesn't name it", async () => {
      const world = worldNamingMira();
      world.notes.addSession(`${CAMPAIGN}/Sessions/Session 3.md`);
      world.campaign.hold(`${CAMPAIGN}/Sessions/Session 3.md`, "Nothing happened.");
      const started = startWith(world);
      started.referenceNotes.sessionSaved(`${CAMPAIGN}/Sessions/Session 3.md`);
      started.resolve(`${CAMPAIGN}/Sessions/Session 3.md`);
      await settled();
      expect(started.asked).toEqual([]);
    });

    it("says once that a chosen note couldn't be written", async () => {
      const world = worldNamingMira();
      world.notes.failProperties = new Error("disk full");
      const { asked } = await savedAndAsked(world);
      choose(firstOf(asked), "place");
      await settled();
      expect(world.notes.said).toEqual(["Couldn't write the note for Mira: disk full"]);
    });

    it("says so, once, when making the answer's note can't be worked out", async () => {
      const world = worldNamingMira();
      const { asked, files } = await savedAndAsked(world);
      files.markdownFilesUnder.mockImplementation(() => {
        throw new Error("folder gone");
      });
      const results = await Promise.all([choose(firstOf(asked), "place"), choose(firstOf(asked), "place")]);
      expect(results).toEqual(["failed", "failed"]);
      expect(world.notes.said).toEqual(["Couldn't make the note for Mira: folder gone"]);
    });

    it("hands back made for a note it made, and left when a note of the name has appeared since", async () => {
      const world = worldNamingMira();
      const { asked } = await savedAndAsked(world);
      world.existing = [fileAt(`${CAMPAIGN}/Fallen/Mira.md`)];
      expect(await choose(firstOf(asked), "character")).toBe("left");
      expect(world.notes.created).toEqual([]);
      world.existing = [];
      expect(await choose(firstOf(asked), "character")).toBe("made");
    });

    it("hands back left when another campaign is open by the time of the answer", async () => {
      const world = worldNamingMira();
      const { asked } = await savedAndAsked(world);
      world.campaign.campaignFolder = "D&D/Other Moon";
      expect(await choose(firstOf(asked), "place")).toBe("left");
      expect(world.notes.created).toEqual([]);
    });

    it("hands back failed when the answer's note can't be made", async () => {
      const world = worldNamingMira();
      world.notes.failProperties = new Error("disk full");
      const { asked } = await savedAndAsked(world);
      expect(await choose(firstOf(asked), "place")).toBe("failed");
    });
  });
});
