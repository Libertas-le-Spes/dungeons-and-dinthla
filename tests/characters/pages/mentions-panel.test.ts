import { describe, expect, it, vi } from "vitest";
import type { TFile } from "obsidian";
import type { MentionNotes } from "../../../src/characters/reading/mention-notes";
import { couldNotReadMentions, IN_THE_NOTES, MentionsPanel, noMentions } from "../../../src/characters/pages/mentions-panel";
import type { LinkActions } from "../../../src/views/lists/linked-text";
import { obsidianDocument } from "../../stubs/obsidian-dom";

const waiting = vi.hoisted(() => ({ calls: [] as (() => void)[] }));

vi.mock("obsidian", async (importOriginal) => ({
  ...(await importOriginal<typeof import("obsidian")>()),
  debounce: <T extends unknown[]>(callback: (...args: T) => void) => {
    const debouncer = (...args: T) => {
      waiting.calls = [() => callback(...args)];
    };
    debouncer.cancel = () => {
      waiting.calls = [];
    };
    return debouncer;
  },
}));

function settle(): void {
  const calls = waiting.calls;
  waiting.calls = [];
  for (const call of calls) call();
}

function fileAt(path: string): TFile {
  return { path, basename: path.slice(path.lastIndexOf("/") + 1, -3) } as TFile;
}

const MIRA = fileAt("Pale Moon/Characters/Mira.md");
const MIRABEL = fileAt("Pale Moon/Characters/Mirabel.md");
const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";
const THREE = "Pale Moon/Sessions/Session 3.md";

interface Setup {
  links?: Record<string, Record<string, number[]>>;
  texts?: Record<string, string>;
  textOf?: MentionNotes["textOf"];
}

function openPanel({ links = {}, texts = {}, textOf }: Setup = {}) {
  waiting.calls = [];
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
    linksResolved: (path: string) => linksResolved(path),
    noteMoved: (path: string) => noteMoved(path),
  };
}

function textsOf(root: Element, selector: string): string[] {
  return Array.from(root.querySelectorAll(selector)).map((element) => String(element.textContent));
}

async function finished(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("MentionsPanel", () => {
  it("lists each session line that links to the character, newest first, with its session and how many there are", async () => {
    const shown = openPanel({
      links: { [MIRA.path]: { [ONE]: [0], [TWO]: [1] } },
      texts: { [ONE]: "Met [[Mira]] at the ford", [TWO]: "Rain.\n- [[Mira]] AC: 15" },
    });
    shown.panel.draw(shown.parent, MIRA);
    await shown.panel.readSettled();
    expect(textsOf(shown.parent, ".dd-title")).toEqual([`${IN_THE_NOTES}2 lines`]);
    expect(textsOf(shown.parent, ".dd-count")).toEqual(["2 lines"]);
    expect(textsOf(shown.parent, ".dd-row .dd-text")).toEqual(["[[Mira]] AC: 15", "Met [[Mira]] at the ford"]);
    expect(textsOf(shown.parent, ".dd-row .dd-meta")).toEqual(["Session 2", "Session 1"]);
  });

  it("says one line for a single line", async () => {
    const shown = openPanel({ links: { [MIRA.path]: { [ONE]: [0] } }, texts: { [ONE]: "[[Mira]]" } });
    shown.panel.draw(shown.parent, MIRA);
    await shown.panel.readSettled();
    expect(textsOf(shown.parent, ".dd-count")).toEqual(["1 line"]);
  });

  it("opens a line's session at that line, and a link in it at its note", async () => {
    const shown = openPanel({ links: { [MIRA.path]: { [TWO]: [1] } }, texts: { [TWO]: "Rain.\n[[Mira]] meets [[Vess]]" } });
    shown.panel.draw(shown.parent, MIRA);
    await shown.panel.readSettled();
    shown.parent.querySelector<HTMLElement>(".dd-row")!.click();
    expect(shown.actions.openRow).toHaveBeenCalledWith({ path: TWO, line: 1 });
    shown.parent.querySelectorAll<HTMLElement>(".dd-row a")[1]!.click();
    expect(shown.actions.openLink).toHaveBeenCalledWith("Vess", TWO, false);
    expect(shown.actions.openRow).toHaveBeenCalledTimes(1);
  });

  it("says so when no session mentions the character, without a count", async () => {
    const shown = openPanel();
    shown.panel.draw(shown.parent, MIRA);
    await shown.panel.readSettled();
    expect(textsOf(shown.parent, ".dd-empty")).toEqual([noMentions(MIRA)]);
    expect(textsOf(shown.parent, ".dd-empty")).toEqual(["No session mentions [[Mira]] yet."]);
    expect(shown.parent.querySelector(".dd-count")).toBeNull();
    expect(shown.parent.querySelector(".dd-list")).toBeNull();
  });

  it("says so when the sessions can't be read", async () => {
    const shown = openPanel({ links: { [MIRA.path]: { [ONE]: [0] } }, textOf: async () => {
      throw new Error("the disk is gone");
    } });
    shown.panel.draw(shown.parent, MIRA);
    await shown.panel.readSettled();
    expect(textsOf(shown.parent, ".dd-title")).toEqual([IN_THE_NOTES]);
    expect(textsOf(shown.parent, ".dd-empty")).toEqual([couldNotReadMentions(MIRA, new Error("the disk is gone"))]);
    expect(textsOf(shown.parent, ".dd-empty")).toEqual(["Couldn't read the sessions that mention Mira: the disk is gone"]);
  });

  it("draws the lines it has into a new place without reading them again", async () => {
    const shown = openPanel({ links: { [MIRA.path]: { [ONE]: [0] } }, texts: { [ONE]: "[[Mira]]" } });
    shown.panel.draw(shown.parent, MIRA);
    await shown.panel.readSettled();
    const next = obsidianDocument().createElement("section");
    shown.panel.draw(next, MIRA);
    expect(textsOf(next, ".dd-text")).toEqual(["[[Mira]]"]);
    expect(shown.reads.count).toBe(1);
  });

  it("draws a reading still on its way into the newest place, without starting another", async () => {
    const pending: ((text: string) => void)[] = [];
    const shown = openPanel({ links: { [MIRA.path]: { [ONE]: [0] } }, textOf: () => new Promise((resolve) => pending.push(resolve)) });
    shown.panel.draw(shown.parent, MIRA);
    const next = obsidianDocument().createElement("section");
    shown.panel.draw(next, MIRA);
    expect(pending).toHaveLength(1);
    pending[0]!("[[Mira]]");
    await shown.panel.readSettled();
    expect(textsOf(next, ".dd-text")).toEqual(["[[Mira]]"]);
    expect(shown.reads.count).toBe(1);
  });

  it("tries again when drawn into a new place after a failed reading", async () => {
    const reading = { fails: true };
    const shown = openPanel({ links: { [MIRA.path]: { [ONE]: [0] } }, textOf: async () => {
      if (reading.fails) throw new Error("the disk is gone");
      return "[[Mira]]";
    } });
    shown.panel.draw(shown.parent, MIRA);
    await shown.panel.readSettled();
    reading.fails = false;
    const next = obsidianDocument().createElement("section");
    shown.panel.draw(next, MIRA);
    await shown.panel.readSettled();
    expect(textsOf(next, ".dd-text")).toEqual(["[[Mira]]"]);
  });

  it("reads again when drawn into a new place after a later reading failed, instead of drawing the old lines", async () => {
    const reading = { fails: false };
    const shown = openPanel({ links: { [MIRA.path]: { [ONE]: [0] } }, textOf: async () => {
      if (reading.fails) throw new Error("the disk is gone");
      return "[[Mira]]";
    } });
    shown.panel.draw(shown.parent, MIRA);
    await shown.panel.readSettled();
    reading.fails = true;
    shown.linksResolved(ONE);
    settle();
    await shown.panel.readSettled();
    expect(textsOf(shown.parent, ".dd-empty")).toHaveLength(1);
    const next = obsidianDocument().createElement("section");
    shown.panel.draw(next, MIRA);
    await shown.panel.readSettled();
    expect(textsOf(next, ".dd-empty")).toHaveLength(1);
    expect(next.querySelector(".dd-text")).toBeNull();
    expect(shown.reads.count).toBe(3);
  });

  it("listens before the first reading has finished", async () => {
    const pending: ((text: string) => void)[] = [];
    const shown = openPanel({ links: { [MIRA.path]: { [ONE]: [0] } }, textOf: () => new Promise((resolve) => pending.push(resolve)) });
    shown.panel.draw(shown.parent, MIRA);
    expect(() => shown.linksResolved(THREE)).not.toThrow();
    expect(() => shown.noteMoved(THREE)).not.toThrow();
  });

  it("reads again for another character, so a renamed character keeps their lines", async () => {
    const shown = openPanel({
      links: { [MIRA.path]: { [ONE]: [0] }, [MIRABEL.path]: { [ONE]: [0], [TWO]: [0] } },
      texts: { [ONE]: "[[Mirabel]]", [TWO]: "[[Mirabel]] AC: 15" },
    });
    shown.panel.draw(shown.parent, MIRA);
    await shown.panel.readSettled();
    shown.panel.draw(shown.parent, MIRABEL);
    await shown.panel.readSettled();
    expect(textsOf(shown.parent, ".dd-text")).toEqual(["[[Mirabel]] AC: 15", "[[Mirabel]]"]);
  });

  it("draws only the latest reading when readings finish out of order", async () => {
    const pending: ((text: string) => void)[] = [];
    const shown = openPanel({
      links: { [MIRA.path]: { [ONE]: [0] }, [MIRABEL.path]: { [ONE]: [0] } },
      textOf: () => new Promise((resolve) => pending.push(resolve)),
    });
    shown.panel.draw(shown.parent, MIRA);
    shown.panel.draw(shown.parent, MIRABEL);
    expect(pending).toHaveLength(2);
    pending[1]!("[[Mirabel]]");
    await finished();
    expect(textsOf(shown.parent, ".dd-text")).toEqual(["[[Mirabel]]"]);
    pending[0]!("[[Mira]]");
    await shown.panel.readSettled();
    expect(textsOf(shown.parent, ".dd-text")).toEqual(["[[Mirabel]]"]);
  });

  it("keeps the latest list when an earlier reading fails late", async () => {
    const pending: ((text: string) => void)[] = [];
    const failures: ((error: Error) => void)[] = [];
    const shown = openPanel({
      links: { [MIRA.path]: { [ONE]: [0] }, [MIRABEL.path]: { [ONE]: [0] } },
      textOf: () => new Promise((resolve, reject) => {
        if (failures.length === 0) failures.push(reject);
        else pending.push(resolve);
      }),
    });
    shown.panel.draw(shown.parent, MIRA);
    shown.panel.draw(shown.parent, MIRABEL);
    expect(pending).toHaveLength(1);
    pending[0]!("[[Mirabel]]");
    await finished();
    expect(textsOf(shown.parent, ".dd-text")).toEqual(["[[Mirabel]]"]);
    failures[0]!(new Error("the disk is gone"));
    await shown.panel.readSettled();
    expect(textsOf(shown.parent, ".dd-text")).toEqual(["[[Mirabel]]"]);
    expect(shown.parent.querySelector(".dd-empty")).toBeNull();
  });

  it("reads again once settled when a listed session or one that now links to the character is resolved, and not otherwise", async () => {
    const shown = openPanel({ links: { [MIRA.path]: { [ONE]: [0] } }, texts: { [ONE]: "[[Mira]]", [TWO]: "[[Mira]] again" } });
    shown.panel.draw(shown.parent, MIRA);
    await shown.panel.readSettled();
    shown.linksResolved(TWO);
    shown.linksResolved(THREE);
    settle();
    expect(shown.reads.count).toBe(1);
    shown.links[MIRA.path]![TWO] = [0];
    shown.linksResolved(TWO);
    expect(shown.reads.count).toBe(1);
    settle();
    await shown.panel.readSettled();
    expect(textsOf(shown.parent, ".dd-text")).toEqual(["[[Mira]] again", "[[Mira]]"]);
    delete shown.links[MIRA.path]![ONE];
    shown.linksResolved(ONE);
    settle();
    await shown.panel.readSettled();
    expect(textsOf(shown.parent, ".dd-text")).toEqual(["[[Mira]] again"]);
    expect(shown.reads.count).toBe(3);
  });

  it("reads again when a listed session is deleted or renamed, and not for other notes", async () => {
    const shown = openPanel({ links: { [MIRA.path]: { [ONE]: [0] } }, texts: { [ONE]: "[[Mira]]" } });
    shown.panel.draw(shown.parent, MIRA);
    await shown.panel.readSettled();
    shown.links[MIRA.path]![TWO] = [0];
    shown.noteMoved(TWO);
    settle();
    expect(shown.reads.count).toBe(1);
    delete shown.links[MIRA.path]![ONE];
    delete shown.links[MIRA.path]![TWO];
    shown.noteMoved(ONE);
    settle();
    await shown.panel.readSettled();
    expect(textsOf(shown.parent, ".dd-empty")).toEqual([noMentions(MIRA)]);
  });

  it("draws nothing more once cleared, dropping a reading still on its way", async () => {
    const pending: ((text: string) => void)[] = [];
    const shown = openPanel({
      links: { [MIRA.path]: { [ONE]: [0] } },
      textOf: () => new Promise((resolve) => pending.push(resolve)),
    });
    shown.panel.draw(shown.parent, MIRA);
    expect(pending).toHaveLength(1);
    shown.panel.clear();
    pending[0]!("[[Mira]]");
    await shown.panel.readSettled();
    expect(shown.parent.childElementCount).toBe(0);
  });

  it("reads nothing for later changes once cleared, nor for one waiting to settle", async () => {
    const shown = openPanel({ links: { [MIRA.path]: { [ONE]: [0] } }, texts: { [ONE]: "[[Mira]]" } });
    shown.panel.draw(shown.parent, MIRA);
    await shown.panel.readSettled();
    shown.linksResolved(ONE);
    shown.panel.clear();
    shown.linksResolved(ONE);
    shown.noteMoved(ONE);
    settle();
    expect(shown.reads.count).toBe(1);
  });

  it("stops listening when the watch is stopped, dropping a change waiting to settle", async () => {
    const shown = openPanel({ links: { [MIRA.path]: { [ONE]: [0] } }, texts: { [ONE]: "[[Mira]]" } });
    shown.panel.draw(shown.parent, MIRA);
    await shown.panel.readSettled();
    shown.linksResolved(ONE);
    shown.stop();
    settle();
    expect(shown.reads.count).toBe(1);
    expect(shown.stopped).toEqual(["resolved", "moved"]);
  });
});
