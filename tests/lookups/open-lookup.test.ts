import { describe, expect, it } from "vitest";
import { MarkdownView, type App, type Editor, type EditorSuggestContext, type TFile } from "obsidian";
import type { Source } from "../../src/campaign/campaign";
import { PROPERTIES_WOULD_CHANGE } from "../../src/campaign/note-editor";
import { OUTSIDE_FENCE, Fence } from "../../src/fence/fence";
import { FencedFiles } from "../../src/fence/fenced-files";
import type { LookupMatch } from "../../src/lookups/lookup";
import { LOOKUP_CHANGED, NOT_IN_A_NOTE_VIEW, NOTE_NOT_SHOWN, openLookup, sourceAfterRemoving } from "../../src/lookups/open-lookup";
import { messageOf } from "../../src/views/message-of";
import { fileAt, rawVaultWith } from "../fence/fake-raw-vault";

const SESSION = "D&D/Pale Moon/Sessions/Session 1.md";

class FakeEditor {
  text: string;
  focused = 0;
  readonly editor: Editor;

  constructor(text: string) {
    this.text = text;
    const lines = () => this.text.split("\n");
    this.editor = {
      getLine: (line: number) => lines()[line],
      getValue: () => this.text,
      focus: () => {
        this.focused += 1;
      },
    } as unknown as Editor;
  }
}

interface Picking {
  text: string;
  line: number;
  match: LookupMatch;
  inView?: boolean;
  beforePicking?: (file: TFile) => void;
  whileReading?: (fake: FakeEditor, view: MarkdownView) => void;
}

async function pick({ text, line, match, inView = true, beforePicking = () => {}, whileReading = () => {} }: Picking) {
  const fake = new FakeEditor(text);
  const file = fileAt(SESSION);
  const steps: string[] = [];
  const view = Object.assign(Object.create(MarkdownView.prototype) as MarkdownView, { editor: fake.editor, file });
  const leaves = [{ view: Object.assign(Object.create(MarkdownView.prototype) as MarkdownView, { editor: new FakeEditor("").editor }) }];
  if (inView) leaves.push({ view });
  const app = { workspace: { getLeavesOfType: () => leaves } } as unknown as App;
  const { vault, calls } = rawVaultWith([file]);
  calls.process.mockImplementation(async (_file: TFile, change: (text: string) => string) => {
    whileReading(fake, view);
    const written = change("saved before the lookup was typed");
    steps.push(`written ${JSON.stringify(written)}`);
    return written;
  });
  const files = new FencedFiles(vault, new Fence(() => "D&D"));
  const context = { editor: fake.editor, file, start: { line, ch: 0 } } as EditorSuggestContext;
  const opened = (name: string) => (source: Source, onClosed: () => void) => {
    steps.push(`${name} ${source.line}`);
    onClosed();
  };
  beforePicking(file);
  let refusal = "";
  await openLookup(app, files, match, context, (path, noted) => steps.push(`store ${path} ${JSON.stringify(noted)}`), {
    question: opened("question"),
    quest: opened("quest"),
    item: (name: string, source: Source, onClosed: () => void) => opened(`item ${name}`)(source, onClosed),
  }).catch((error: unknown) => {
    refusal = messageOf(error);
  });
  return { steps, fake, refusal };
}

describe("openLookup", () => {
  it("writes the note without the lookup line, tells the store, then opens the question below it at its new line", async () => {
    const match: LookupMatch = { kind: "question", text: "Who", holder: "", source: { path: SESSION, line: 2 } };
    const { steps, refusal } = await pick({ text: "We rode on.\n?? who\n? Who\n", line: 1, match });
    expect(refusal).toBe("");
    expect(steps).toEqual(['written "We rode on.\\n? Who\\n"', `store ${SESSION} "We rode on.\\n? Who\\n"`, "question 1"]);
  });

  it("removes a last lookup line with the line break before it, and an only line whole", async () => {
    const quest: LookupMatch = { kind: "quest", text: "Find it", holder: "", source: { path: SESSION, line: 0 } };
    expect((await pick({ text: "! Find it\n!! find", line: 1, match: quest })).steps).toEqual(['written "! Find it"', `store ${SESSION} "! Find it"`, "quest 0"]);
    const item: LookupMatch = { kind: "item", text: "Rope", holder: "", source: { path: "D&D/Pale Moon/Sessions/Session 2.md", line: 4 } };
    const only = await pick({ text: "$$ rope", line: 0, match: item });
    expect(only.steps).toEqual(['written ""', `store ${SESSION} ""`, "item Rope 4"]);
    expect(only.fake.focused).toBe(1);
  });

  it("writes what the editor holds at the moment of writing, so typing not yet saved is kept", async () => {
    const match: LookupMatch = { kind: "question", text: "Who", holder: "", source: { path: SESSION, line: 0 } };
    const typeMore = (fake: FakeEditor) => {
      fake.text = "? Who\n?? who\nMira lit the lamp.\n";
    };
    const { steps } = await pick({ text: "? Who\n?? who\n", line: 1, match, whileReading: typeMore });
    expect(steps).toEqual(['written "? Who\\nMira lit the lamp.\\n"', `store ${SESSION} "? Who\\nMira lit the lamp.\\n"`, "question 0"]);
  });
});

describe("openLookup refusing", () => {
  const match: LookupMatch = { kind: "question", text: "Who", holder: "", source: { path: SESSION, line: 0 } };
  const unchanged = 'written "saved before the lookup was typed"';

  it("changes nothing when the editor isn't a note's own view", async () => {
    const { steps, refusal } = await pick({ text: "? Who\n?? who\n", line: 1, match, inView: false });
    expect(refusal).toBe(NOT_IN_A_NOTE_VIEW);
    expect(steps).toEqual([]);
  });

  it("writes nothing when the note was moved outside the Campaigns folder after the lookup was typed", async () => {
    const moveOut = (file: TFile) => {
      file.path = "Self/Session 1.md";
    };
    const { steps, refusal } = await pick({ text: "? Who\n?? who\n", line: 1, match, beforePicking: moveOut });
    expect(refusal).toBe(OUTSIDE_FENCE);
    expect(steps).toEqual([]);
  });

  it("changes nothing when the tab shows another note by the time it is written", async () => {
    const showOther = (_fake: FakeEditor, view: MarkdownView) => {
      view.file = fileAt("D&D/Pale Moon/Sessions/Session 2.md");
    };
    const { steps, refusal } = await pick({ text: "? Who\n?? who\n", line: 1, match, whileReading: showOther });
    expect(refusal).toBe(NOTE_NOT_SHOWN);
    expect(steps).toEqual([unchanged]);
  });

  it("changes nothing when the lookup line is no longer where it was picked by the time it is written", async () => {
    const typeAbove = (fake: FakeEditor) => {
      fake.text = "? Who\nMira lit the lamp.\n?? who\n";
    };
    const { steps, refusal } = await pick({ text: "? Who\n?? who\n", line: 1, match, whileReading: typeAbove });
    expect(refusal).toBe(LOOKUP_CHANGED);
    expect(steps).toEqual([unchanged]);
  });

  it("changes nothing when removing the line would turn lines into properties", async () => {
    const { steps, refusal } = await pick({ text: "?? who\n---\nx\n---\n", line: 0, match });
    expect(refusal).toBe(PROPERTIES_WOULD_CHANGE);
    expect(steps).toEqual([unchanged]);
  });
});

describe("sourceAfterRemoving", () => {
  it("moves a line below the removed one up, and leaves the rest", () => {
    expect(sourceAfterRemoving({ path: SESSION, line: 5 }, SESSION, 3)).toEqual({ path: SESSION, line: 4 });
    expect(sourceAfterRemoving({ path: SESSION, line: 2 }, SESSION, 3)).toEqual({ path: SESSION, line: 2 });
    expect(sourceAfterRemoving({ path: "Other.md", line: 5 }, SESSION, 3)).toEqual({ path: "Other.md", line: 5 });
  });
});
