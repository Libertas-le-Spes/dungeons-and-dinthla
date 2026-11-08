import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { CHANGED_IN_NOTE, PartlyWritten } from "../../src/campaign/note-editor";
import { characterSheetOf, type SheetValue } from "../../src/characters/character-sheet";
import { SheetValueModal, whereText, type SheetValueDialog } from "../../src/characters/sheet-value-modal";
import type { ValueChoice } from "../../src/characters/sheet-value-writer";
import type { SourcedFact } from "../../src/characters/sheet-values";
import { Notice, type Modal as StubModal } from "../stubs/obsidian";

const MIRA = "Pale Moon/Characters/Mira.md";

function hpOf(learned: SourcedFact[], overrides: SourcedFact[] = []): SheetValue {
  return characterSheetOf(learned, overrides, null).values.find((value) => value.name === "HP")!;
}

function inSession(number: number, value: string): SourcedFact {
  return { name: "HP", value, source: { path: `Pale Moon/Sessions/Session ${number}.md`, line: 0 } };
}

interface Setup {
  value?: SheetValue;
  save?: SheetValueDialog["save"];
  sessionLabel?: string | null;
}

function openDialog({ value = hpOf([inSession(1, "31"), inSession(2, "38")]), save = async () => true, sessionLabel = "Session 2" }: Setup = {}) {
  const saved: ValueChoice[] = [];
  const onClosed = vi.fn();
  const openSource = vi.fn();
  const dialog: SheetValueDialog = {
    character: "Mira",
    notePath: MIRA,
    value,
    sessionLabel,
    save: async (choice) => {
      saved.push(choice);
      return save(choice);
    },
    openSource,
  };
  const modal = new SheetValueModal({} as App, dialog, onClosed);
  modal.contentEl.ownerDocument.body.append(modal.contentEl);
  modal.open();
  const root = modal.contentEl;
  const input = root.querySelector<HTMLInputElement>('input[aria-label="Value"]')!;
  const choice = (state: string) => root.querySelector<HTMLButtonElement>(`.dd-state-choice[data-state="${state}"]`)!;
  const type = (typed: string) => {
    input.value = typed;
    input.dispatchEvent(new input.ownerDocument.defaultView!.Event("input"));
  };
  const enter = () => input.dispatchEvent(new input.ownerDocument.defaultView!.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
  return { modal, root, input, choice, type, enter, saved, onClosed, openSource };
}

beforeEach(() => {
  Notice.shown = [];
});

describe("SheetValueModal", () => {
  it("is titled with the value's name and starts with the value shown", () => {
    const { modal, input, root } = openDialog();
    expect((modal as unknown as StubModal).title).toBe("Hit Points");
    expect(input.value).toBe("38");
    expect(root.ownerDocument.activeElement).toBe(input);
  });

  it("starts empty for a value not known", () => {
    const { input } = openDialog({ value: hpOf([inSession(1, "31")], [{ name: "HP", value: "?", source: { path: MIRA, line: 0 } }]) });
    expect(input.value).toBe("");
  });

  it("offers each state, marking the value's own", () => {
    const { root } = openDialog();
    const choices = Array.from(root.querySelectorAll(".dd-state-choice"));
    expect(choices.map((choice) => choice.textContent)).toEqual(["Learned at the table", "Override", "Carried over", "Not known yet"]);
    expect(choices.map((choice) => choice.getAttribute("aria-pressed"))).toEqual(["true", "false", "false", "false"]);
  });

  it("lists the earlier values newest first, with where each was written, and opens one's line", () => {
    const value = hpOf([inSession(1, "31"), inSession(2, "34")], [{ name: "HP", value: "40", source: { path: MIRA, line: 3 } }]);
    const { root, onClosed, openSource } = openDialog({ value });
    const links = Array.from(root.querySelectorAll<HTMLElement>(".dd-earlier-list .dd-source-link"));
    expect(links.map((link) => link.textContent)).toEqual(["34 · Session 2", "31 · Session 1"]);
    links[1]!.click();
    expect(onClosed).toHaveBeenCalledOnce();
    expect(openSource).toHaveBeenCalledWith({ path: "Pale Moon/Sessions/Session 1.md", line: 0 });
  });

  it("names an earlier override as one", () => {
    const value = hpOf([inSession(1, "31")], [{ name: "HP", value: "40", source: { path: MIRA, line: 3 } }, { name: "HP", value: "41", source: { path: MIRA, line: 4 } }]);
    const { root } = openDialog({ value });
    expect(Array.from(root.querySelectorAll(".dd-earlier-list .dd-source-link")).map((link) => link.textContent)).toEqual([
      "40 · Override",
      "31 · Session 1",
    ]);
  });

  it("lists no earlier values when there are none", () => {
    const { root } = openDialog({ value: hpOf([inSession(1, "31")]) });
    expect(root.querySelector(".dd-earlier-list")).toBeNull();
  });

  it("says where each choice writes", () => {
    expect(openDialog().root.querySelector(".dd-where")!.textContent).toBe(whereText("Mira", "Session 2"));
    expect(whereText("Mira", "Session 2")).toBe("Learned at the table adds a line to Session 2. Override and Not known yet change Mira's note.");
    expect(whereText("Mira", null)).toBe("Learned at the table needs a session to write in. Override and Not known yet change Mira's note.");
  });

  it("saves the state tapped with the value typed, then closes", async () => {
    const { type, choice, saved, onClosed } = openDialog();
    type("40");
    choice("override").click();
    await vi.waitFor(() => expect(onClosed).toHaveBeenCalledOnce());
    expect(saved).toEqual([{ state: "override", value: "40" }]);
  });

  it("closes when there was nothing to write", async () => {
    const { choice, onClosed } = openDialog({ save: async () => false });
    choice("learned").click();
    await vi.waitFor(() => expect(onClosed).toHaveBeenCalledOnce());
  });

  it("keeps the value's state on Enter", async () => {
    const { type, enter, saved } = openDialog({ value: hpOf([], [{ name: "HP", value: "40", source: { path: MIRA, line: 0 } }]) });
    type("41");
    enter();
    await vi.waitFor(() => expect(saved).toEqual([{ state: "override", value: "41" }]));
  });

  it("saves a value not known as learned on Enter", async () => {
    const { type, enter, saved } = openDialog({ value: hpOf([]) });
    type("41");
    enter();
    await vi.waitFor(() => expect(saved).toEqual([{ state: "learned", value: "41" }]));
  });

  it("saves once however often a state is tapped while saving", async () => {
    let finish: (written: boolean) => void = () => {};
    const { choice, saved, onClosed } = openDialog({ save: () => new Promise((resolve) => { finish = resolve; }) });
    choice("override").click();
    choice("unknown").click();
    expect(saved).toHaveLength(1);
    finish(true);
    await vi.waitFor(() => expect(onClosed).toHaveBeenCalledOnce());
  });

  it("stays open while saving, however it is asked to close", () => {
    const { modal, choice, onClosed } = openDialog({ save: () => new Promise(() => {}) });
    choice("override").click();
    modal.close();
    expect(onClosed).not.toHaveBeenCalled();
  });

  it("says why nothing was written, and stays open with focus on the value", async () => {
    const { choice, onClosed, input, root } = openDialog({ save: async () => {
      throw new Error("Type a value first.");
    } });
    choice("override").click();
    await vi.waitFor(() => expect(Notice.shown).toEqual(["Couldn't change the hit points: Type a value first."]));
    expect(onClosed).not.toHaveBeenCalled();
    expect(root.ownerDocument.activeElement).toBe(input);
  });

  it("closes when the note changed since the sheet was read", async () => {
    const { choice, onClosed } = openDialog({ save: async () => {
      throw new Error(CHANGED_IN_NOTE);
    } });
    choice("override").click();
    await vi.waitFor(() => expect(onClosed).toHaveBeenCalledOnce());
  });

  it("closes when only part was written", async () => {
    const { choice, onClosed } = openDialog({ save: async () => {
      throw new PartlyWritten("The line was added to the session, but Mira's note was left.");
    } });
    choice("learned").click();
    await vi.waitFor(() => expect(onClosed).toHaveBeenCalledOnce());
  });
});
