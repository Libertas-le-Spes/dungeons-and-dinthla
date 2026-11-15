import { describe, expect, it, vi } from "vitest";
import type { CachedMetadata, TFile } from "obsidian";
import { DmNameQuestions } from "../../../src/references/asking/dm-name-questions";
import { FakeCampaign } from "../../kind-notes/fake-campaign";
import { FakeNotes, fileAt } from "../../kind-notes/fake-notes";
import type { ReferenceKindName } from "../../../src/kinds/reference-kind";
import type { NewNames } from "../../../src/references/new-names/new-names";
import type { AskNewNames, NewNamesChoice } from "../../../src/references/new-names/new-names-choice";
import { firstOf } from "../../stubs/lists";
import { CAMPAIGN, SESSION, settled } from "../../kind-notes/keeper-setup";

const SESSION_ONE = `${CAMPAIGN}/Sessions/Session 1.md`;
const OTHER_CAMPAIGN = "D&D/Other Moon";
const MILL = "We rode to [[Old Mill]].";
const MILL_PATH = `${CAMPAIGN}/Places/Old Mill.md`;

interface Asked {
  names: NewNames;
  to: NewNamesChoice;
}

interface World {
  notes: FakeNotes;
  campaign: FakeCampaign;
  existing: TFile[];
  aliases: Record<string, string[]>;
}

function worldNaming(lines: string[]): World {
  const notes = new FakeNotes();
  notes.addSession(SESSION_ONE);
  notes.addSession(SESSION);
  const campaign = new FakeCampaign();
  campaign.hold(SESSION_ONE, lines.slice(0, 2).join("\n"));
  campaign.hold(SESSION, lines.slice(2).join("\n"));
  return { notes, campaign, existing: [], aliases: {} };
}

function worldNamingMill(): World {
  return worldNaming([MILL, MILL, MILL]);
}

function madeNotes(world: World): TFile[] {
  return world.notes.created.map((path) => fileAt(path));
}

function startWith(world: World) {
  const listeners = new Set<(file: TFile) => unknown>();
  const offref = vi.fn();
  const metadata = {
    ...world.notes.metadata,
    getFileCache: vi.fn((file: TFile): CachedMetadata => {
      const aliases = world.aliases[file.path];
      if (aliases === undefined) return {};
      return { frontmatter: { aliases } } as CachedMetadata;
    }),
    on: vi.fn((_name: string, callback: (file: TFile) => unknown) => {
      listeners.add(callback);
      return { callback };
    }),
    offref,
  };
  const everything = () => [...world.existing, ...madeNotes(world)];
  const files = {
    ...world.notes.files,
    markdownFilesUnder: vi.fn((folder: string) => everything().filter((file) => file.path.startsWith(`${folder}/`))),
    getMarkdownFiles: vi.fn(everything),
  };
  const asked: Asked[] = [];
  const askNewNames: AskNewNames = (names, to) => {
    asked.push({ names, to });
  };
  const questions = new DmNameQuestions({
    store: world.campaign,
    files,
    metadata,
    actions: world.notes.actions,
    campaignFolders: () => [CAMPAIGN, OTHER_CAMPAIGN],
    say: (message) => world.notes.said.push(message),
    askNewNames,
  });
  const stop = questions.start();
  const resolve = (path: string) => {
    for (const listener of listeners) listener(fileAt(path));
  };
  return { questions, stop, resolve, offref, listeners, asked, files, metadata };
}

async function savedAndAsked(world: World) {
  const started = startWith(world);
  started.questions.sessionSaved(SESSION);
  started.resolve(SESSION);
  await settled();
  return started;
}

function choose({ names, to }: Asked, kind: ReferenceKindName) {
  return to.chosen({ undecided: firstOf(names.names), kind });
}

describe("DmNameQuestions", () => {
  it("asks about a name on three lines of any kind once the saved session is resolved, and makes nothing until it is answered", async () => {
    const world = worldNamingMill();
    const { questions, resolve, asked } = startWith(world);
    questions.sessionSaved(SESSION);
    expect(asked).toEqual([]);
    resolve(SESSION);
    await settled();
    expect(asked).toHaveLength(1);
    expect(firstOf(asked).names.sessionName).toBe("Session 2");
    expect(firstOf(asked).names.names.map(({ name }) => name)).toEqual(["Old Mill"]);
    expect(world.notes.created).toEqual([]);
  });

  it("makes the note of the kind the DM chooses, as first named in the earliest session", async () => {
    const world = worldNamingMill();
    const { asked } = await savedAndAsked(world);
    expect(await choose(firstOf(asked), "place")).toBe("made");
    expect(world.notes.created).toEqual([MILL_PATH]);
    expect(world.notes.noteAt(MILL_PATH)?.properties).toEqual({ "first named": "[[Session 1]]" });
  });

  it("asks once for a name written with a folder and with other capitals", async () => {
    const world = worldNaming(["[[Places/Old Mill]]", "[[old mill]]", "[[Old Mill]]"]);
    const { asked } = await savedAndAsked(world);
    expect(firstOf(asked).names.names.map(({ name }) => name)).toEqual(["Old Mill"]);
  });

  it("never asks again about a name that was answered", async () => {
    const world = worldNamingMill();
    const started = await savedAndAsked(world);
    await choose(firstOf(started.asked), "place");
    firstOf(started.asked).to.closed();
    started.questions.sessionSaved(SESSION);
    started.resolve(SESSION);
    await settled();
    expect(started.asked).toHaveLength(1);
  });

  it("does not ask about a name a note of the campaign already has as an alias", async () => {
    const world = worldNamingMill();
    world.existing = [fileAt(`${CAMPAIGN}/Places/The Mill.md`)];
    world.aliases[`${CAMPAIGN}/Places/The Mill.md`] = ["old mill"];
    const { asked } = await savedAndAsked(world);
    expect(asked).toEqual([]);
  });

  it("does not ask about a character answered in another campaign", async () => {
    const world = worldNaming(["[[Mira]]", "[[Mira]]", "[[Mira]]"]);
    world.existing = [fileAt(`${OTHER_CAMPAIGN}/Characters/Mira.md`)];
    const { asked } = await savedAndAsked(world);
    expect(asked).toEqual([]);
  });

  it("asks about a place of another campaign with the same name", async () => {
    const world = worldNamingMill();
    world.existing = [fileAt(`${OTHER_CAMPAIGN}/Places/Old Mill.md`)];
    const { asked } = await savedAndAsked(world);
    expect(asked).toHaveLength(1);
  });

  it("asks about nothing for a session that wasn't saved here, or one resolved before it is", async () => {
    const world = worldNamingMill();
    const { questions, resolve, asked } = startWith(world);
    resolve(SESSION);
    questions.sessionSaved(SESSION);
    resolve(SESSION_ONE);
    await settled();
    expect(asked).toEqual([]);
  });

  it("asks about nothing when the session saved here was deleted before it resolved", async () => {
    const world = worldNamingMill();
    const { questions, resolve, asked } = startWith(world);
    questions.sessionSaved(SESSION);
    questions.sessionGone(SESSION);
    resolve(SESSION);
    await settled();
    expect(asked).toEqual([]);
  });

  it("acts once for one save, though the session resolves again", async () => {
    const world = worldNamingMill();
    const { questions, resolve, asked, files } = startWith(world);
    questions.sessionSaved(SESSION);
    resolve(SESSION);
    await settled();
    firstOf(asked).to.closed();
    resolve(SESSION);
    await settled();
    expect(asked).toHaveLength(1);
    expect(files.markdownFilesUnder).toHaveBeenCalledTimes(1);
  });

  it("asks about nothing while the campaign is opening, or when no campaign is open", async () => {
    const world = worldNamingMill();
    const { questions, resolve, asked } = startWith(world);
    world.campaign.opening = true;
    questions.sessionSaved(SESSION);
    resolve(SESSION);
    await settled();
    world.campaign.opening = false;
    world.campaign.campaignFolder = null;
    questions.sessionSaved(SESSION);
    resolve(SESSION);
    await settled();
    expect(asked).toEqual([]);
  });

  it("does not ask after a save of a session that doesn't name it", async () => {
    const world = worldNamingMill();
    const other = `${CAMPAIGN}/Sessions/Session 3.md`;
    world.notes.addSession(other);
    world.campaign.hold(other, "Nothing happened.");
    const { questions, resolve, asked } = startWith(world);
    questions.sessionSaved(other);
    resolve(other);
    await settled();
    expect(asked).toEqual([]);
  });

  it("does not open a second list while one is open, and asks again once it is closed", async () => {
    const world = worldNamingMill();
    const started = await savedAndAsked(world);
    started.questions.sessionSaved(SESSION);
    started.resolve(SESSION);
    await settled();
    expect(started.asked).toHaveLength(1);
    firstOf(started.asked).to.closed();
    started.questions.sessionSaved(SESSION);
    started.resolve(SESSION);
    await settled();
    expect(started.asked).toHaveLength(2);
    expect(world.notes.created).toEqual([]);
  });

  it("says once, across saves, that a name can't be a note, and does not ask about it", async () => {
    const line = "[[Lady: Vess]]";
    const world = worldNaming([line, line, line]);
    const started = startWith(world);
    for (let save = 0; save < 2; save += 1) {
      started.questions.sessionSaved(SESSION);
      started.resolve(SESSION);
      await settled();
    }
    expect(started.asked).toEqual([]);
    expect(world.notes.said).toHaveLength(1);
  });

  it("says once that a chosen note couldn't be written", async () => {
    const world = worldNamingMill();
    world.notes.failProperties = new Error("disk full");
    const { asked } = await savedAndAsked(world);
    expect(await choose(firstOf(asked), "place")).toBe("failed");
    expect(world.notes.said).toEqual(["Couldn't write the note for Old Mill: disk full"]);
  });

  it("says so, once, when the answer's note can't be worked out", async () => {
    const world = worldNamingMill();
    const { asked, files } = await savedAndAsked(world);
    files.markdownFilesUnder.mockImplementation(() => {
      throw new Error("folder gone");
    });
    const results = await Promise.all([choose(firstOf(asked), "place"), choose(firstOf(asked), "place")]);
    expect(results).toEqual(["failed", "failed"]);
    expect(world.notes.said).toEqual(["Couldn't make the note for Old Mill: folder gone"]);
  });

  it("says so, once, when the question can't be worked out", async () => {
    const world = worldNamingMill();
    const { questions, resolve, metadata } = startWith(world);
    metadata.getFileCache.mockImplementation(() => {
      throw new Error("cache gone");
    });
    world.existing = [fileAt(`${CAMPAIGN}/Places/Else.md`)];
    for (let save = 0; save < 2; save += 1) {
      questions.sessionSaved(SESSION);
      resolve(SESSION);
      await settled();
    }
    expect(world.notes.said).toEqual(["Couldn't ask about new names: cache gone"]);
  });

  it("hands back left when a note of the name has appeared since the question", async () => {
    const world = worldNamingMill();
    const { asked } = await savedAndAsked(world);
    world.existing = [fileAt(`${CAMPAIGN}/Fallen/old mill.md`)];
    expect(await choose(firstOf(asked), "place")).toBe("left");
    expect(world.notes.created).toEqual([]);
  });

  it("hands back left when another campaign is open by the time of the answer", async () => {
    const world = worldNamingMill();
    const { asked } = await savedAndAsked(world);
    world.campaign.campaignFolder = OTHER_CAMPAIGN;
    expect(await choose(firstOf(asked), "place")).toBe("left");
    expect(world.notes.created).toEqual([]);
  });

  it("stops listening when stopped", () => {
    const { stop, offref, listeners } = startWith(worldNamingMill());
    expect(listeners.size).toBe(1);
    stop();
    expect(offref).toHaveBeenCalledOnce();
  });
});
