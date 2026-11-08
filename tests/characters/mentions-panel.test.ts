import { describe, expect, it, vi } from "vitest";
import type { TFile } from "obsidian";
import type { MentionNotes } from "../../src/characters/mention-notes";
import { couldNotReadMentions, IN_THE_NOTES, MentionsPanel, noMentions } from "../../src/characters/mentions-panel";
import type { LinkActions } from "../../src/views/linked-text";
import { obsidianDocument } from "../views/obsidian-dom";

function fileAt(path: string): TFile {
  return { path, basename: path.slice(path.lastIndexOf("/") + 1, -3) } as TFile;
}

const MIRA = fileAt("Pale Moon/Characters/Mira.md");
const MIRABEL = fileAt("Pale Moon/Characters/Mirabel.md");
const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";
const ELSEWHERE = "Pale Moon/Places/Old Mill.md";

interface Setup {
  links?: Record<string, Record<string, number[]>>;
  texts?: Record<string, string>;
  textOf?: MentionNotes["textOf"];
}

function openPanel({ links = {}, texts = {}, textOf }: Setup = {}) {
  let linksResolved: (path: string) => void = () => {};
  let noteMoved: (path: string) => void = () => {};
  const stopped: string[] = [];
  const reads = { count: 0 };
  let readText: MentionNotes["textOf"] = async (file) => {
    const text = texts[file.path];
    if (text === undefined) return "";
    return text;
  };
  if (textOf !== undefined) readText = textOf;
  const linesTo = (target: string) => {
    const lines = links[target];
    if (lines === undefined) return {};
    return lines;
  };
  const notes: MentionNotes = {
    fileAt: (path) => fileAt(path),
    textOf: (file) => readText(file),
    campaignFolders: () => ["Pale Moon"],
    onNoteMoved: (moved) => {
      noteMoved = moved;
      return () => stopped.push("moved");
    },
    linkingPaths: (target) => {
      reads.count += 1;
      return Object.keys(linesTo(target));
    },
    linkedLines: (path, target) => {
      const lines = linesTo(target)[path];
      if (lines === undefined) return [];
      return lines;
    },
    onLinksResolved: (resolved) => {
      linksResolved = resolved;
      return () => stopped.push("resolved");
    },
  };
  const actions: LinkActions = { openRow: vi.fn(), openLink: vi.fn() };
  const panel = new MentionsPanel(notes, actions);
  const stop = panel.watch();
  const parent = obsidianDocument().createElement("section");
  return {
    panel,
    parent,
    actions,
    reads,
    stopped,
    stop,
    links,
    texts,
    linksResolved: (path: string) => linksResolved(path),
    noteMoved: (path: string) => noteMoved(path),
  };
}

function textsOf(root: Element, selector: string): string[] {
  return Array.from(root.querySelectorAll(selector)).map((element) => String(element.textContent));
}

describe("MentionsPanel", () => {
  it("lists each line that links to the character, newest first, with its note and how many there are", async () => {
    const shown = openPanel({
      links: { [MIRA.path]: { [ONE]: [0], [TWO]: [1] } },
      texts: { [ONE]: "Met [[Mira]] at the ford", [TWO]: "Rain.\n- [[Mira]] AC: 15" },
    });
    await shown.panel.draw(shown.parent, MIRA);
    expect(textsOf(shown.parent, ".dd-title")).toEqual([`${IN_THE_NOTES}2 lines`]);
    expect(textsOf(shown.parent, ".dd-count")).toEqual(["2 lines"]);
    expect(textsOf(shown.parent, ".dd-row .dd-text")).toEqual(["[[Mira]] AC: 15", "Met [[Mira]] at the ford"]);
    expect(textsOf(shown.parent, ".dd-row .dd-meta")).toEqual(["Session 2", "Session 1"]);
  });

  it("says one line for a single line", async () => {
    const shown = openPanel({ links: { [MIRA.path]: { [ONE]: [0] } }, texts: { [ONE]: "[[Mira]]" } });
    await shown.panel.draw(shown.parent, MIRA);
    expect(textsOf(shown.parent, ".dd-count")).toEqual(["1 line"]);
  });

  it("opens a line's note at that line, and a link in it at its note", async () => {
    const shown = openPanel({ links: { [MIRA.path]: { [TWO]: [1] } }, texts: { [TWO]: "Rain.\n[[Mira]] meets [[Vess]]" } });
    await shown.panel.draw(shown.parent, MIRA);
    shown.parent.querySelector<HTMLElement>(".dd-row")!.click();
    expect(shown.actions.openRow).toHaveBeenCalledWith({ path: TWO, line: 1 });
    shown.parent.querySelectorAll<HTMLElement>(".dd-row a")[1]!.click();
    expect(shown.actions.openLink).toHaveBeenCalledWith("Vess", TWO);
    expect(shown.actions.openRow).toHaveBeenCalledTimes(1);
  });

  it("says so when no note mentions the character, without a count", async () => {
    const shown = openPanel();
    await shown.panel.draw(shown.parent, MIRA);
    expect(textsOf(shown.parent, ".dd-empty")).toEqual([noMentions(MIRA)]);
    expect(textsOf(shown.parent, ".dd-empty")).toEqual(["No note mentions [[Mira]] yet."]);
    expect(shown.parent.querySelector(".dd-count")).toBeNull();
    expect(shown.parent.querySelector(".dd-list")).toBeNull();
  });

  it("says so when the notes can't be read", async () => {
    const shown = openPanel({ links: { [MIRA.path]: { [ONE]: [0] } }, textOf: async () => {
      throw new Error("the disk is gone");
    } });
    await shown.panel.draw(shown.parent, MIRA);
    expect(textsOf(shown.parent, ".dd-title")).toEqual([IN_THE_NOTES]);
    expect(textsOf(shown.parent, ".dd-empty")).toEqual([couldNotReadMentions(MIRA, new Error("the disk is gone"))]);
    expect(textsOf(shown.parent, ".dd-empty")).toEqual(["Couldn't read the notes that mention Mira: the disk is gone"]);
  });

  it("draws only the latest reading when readings finish out of order", async () => {
    const pending: ((text: string) => void)[] = [];
    const shown = openPanel({
      links: { [MIRA.path]: { [ONE]: [0] } },
      textOf: () => new Promise((resolve) => pending.push(resolve)),
    });
    const first = shown.panel.draw(shown.parent, MIRA);
    const second = shown.panel.draw(shown.parent, MIRA);
    await vi.waitFor(() => expect(pending).toHaveLength(2));
    pending[1]!("[[Mira]] newer");
    await second;
    pending[0]!("[[Mira]] older");
    await first;
    expect(textsOf(shown.parent, ".dd-text")).toEqual(["[[Mira]] newer"]);
  });

  it("keeps the latest list when an earlier reading fails late", async () => {
    const pending: ((text: string) => void)[] = [];
    const failures: ((error: Error) => void)[] = [];
    const shown = openPanel({
      links: { [MIRA.path]: { [ONE]: [0] } },
      textOf: () => new Promise((resolve, reject) => {
        if (failures.length === 0) failures.push(reject);
        else pending.push(resolve);
      }),
    });
    const first = shown.panel.draw(shown.parent, MIRA);
    const second = shown.panel.draw(shown.parent, MIRA);
    await vi.waitFor(() => expect(pending).toHaveLength(1));
    pending[0]!("[[Mira]]");
    await second;
    failures[0]!(new Error("the disk is gone"));
    await first;
    expect(textsOf(shown.parent, ".dd-text")).toEqual(["[[Mira]]"]);
    expect(shown.parent.querySelector(".dd-empty")).toBeNull();
  });

  it("draws again when a listed note or a note that now links to the character is resolved, and not otherwise", async () => {
    const shown = openPanel({ links: { [MIRA.path]: { [ONE]: [0] } }, texts: { [ONE]: "[[Mira]]", [TWO]: "[[Mira]] again" } });
    await shown.panel.draw(shown.parent, MIRA);
    shown.linksResolved(TWO);
    shown.linksResolved(ELSEWHERE);
    expect(shown.reads.count).toBe(1);
    shown.links[MIRA.path]![TWO] = [0];
    shown.linksResolved(TWO);
    await vi.waitFor(() => expect(textsOf(shown.parent, ".dd-text")).toEqual(["[[Mira]] again", "[[Mira]]"]));
    delete shown.links[MIRA.path]![ONE];
    shown.linksResolved(ONE);
    await vi.waitFor(() => expect(textsOf(shown.parent, ".dd-text")).toEqual(["[[Mira]] again"]));
    expect(shown.reads.count).toBe(3);
  });

  it("draws again when a listed note is deleted or renamed, and not for other notes", async () => {
    const shown = openPanel({ links: { [MIRA.path]: { [ONE]: [0] } }, texts: { [ONE]: "[[Mira]]" } });
    await shown.panel.draw(shown.parent, MIRA);
    shown.noteMoved(TWO);
    expect(shown.reads.count).toBe(1);
    delete shown.links[MIRA.path]![ONE];
    shown.noteMoved(ONE);
    await vi.waitFor(() => expect(textsOf(shown.parent, ".dd-empty")).toEqual([noMentions(MIRA)]));
  });

  it("keeps a renamed character's lines, read by their new path", async () => {
    const shown = openPanel({
      links: { [MIRA.path]: { [ONE]: [0] }, [MIRABEL.path]: { [ONE]: [0], [TWO]: [0] } },
      texts: { [ONE]: "[[Mirabel]]", [TWO]: "[[Mirabel]] AC: 15" },
    });
    await shown.panel.draw(shown.parent, MIRA);
    await shown.panel.draw(shown.parent, MIRABEL);
    expect(textsOf(shown.parent, ".dd-text")).toEqual(["[[Mirabel]] AC: 15", "[[Mirabel]]"]);
    expect(textsOf(shown.parent, ".dd-empty")).toEqual([]);
  });

  it("draws nothing more once cleared, dropping a reading still on its way", async () => {
    const pending: ((text: string) => void)[] = [];
    const shown = openPanel({
      links: { [MIRA.path]: { [ONE]: [0] } },
      textOf: () => new Promise((resolve) => pending.push(resolve)),
    });
    const drawing = shown.panel.draw(shown.parent, MIRA);
    await vi.waitFor(() => expect(pending).toHaveLength(1));
    shown.panel.clear();
    pending[0]!("[[Mira]]");
    await drawing;
    expect(shown.parent.childElementCount).toBe(0);
    shown.linksResolved(ONE);
    shown.noteMoved(ONE);
    expect(shown.reads.count).toBe(1);
  });

  it("draws nothing for later changes once cleared", async () => {
    const shown = openPanel({ links: { [MIRA.path]: { [ONE]: [0], [TWO]: [0] } }, texts: { [ONE]: "[[Mira]]", [TWO]: "[[Mira]]" } });
    await shown.panel.draw(shown.parent, MIRA);
    shown.panel.clear();
    shown.links[MIRA.path]![ELSEWHERE] = [0];
    shown.linksResolved(ONE);
    shown.linksResolved(ELSEWHERE);
    shown.noteMoved(TWO);
    expect(shown.reads.count).toBe(1);
  });

  it("stops listening when the watch is stopped", () => {
    const shown = openPanel();
    shown.stop();
    expect(shown.stopped).toEqual(["resolved", "moved"]);
  });
});
