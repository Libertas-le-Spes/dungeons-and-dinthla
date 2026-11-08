import { describe, expect, it } from "vitest";
import { MarkdownView, type App, type Editor, type EditorPosition, type EditorSuggestContext, type TFile } from "obsidian";
import type { Source } from "../../src/campaign/campaign";
import type { LookupMatch } from "../../src/lookups/lookup";
import { NOT_IN_A_NOTE_VIEW, openLookup, sourceAfterRemoving } from "../../src/lookups/open-lookup";
import { PROPERTIES_WOULD_CHANGE } from "../../src/campaign/note-editor";

const SESSION = "Pale Moon/Sessions/Session 1.md";

class FakeEditor {
  text: string;

  constructor(text: string) {
    this.text = text;
  }

  focused = 0;
  private built: Editor | null = null;

  get editor(): Editor {
    if (this.built !== null) return this.built;
    const lines = () => this.text.split("\n");
    const offset = (position: EditorPosition) => lines().slice(0, position.line).reduce((sum, line) => sum + line.length + 1, 0) + position.ch;
    const editor = {
      getLine: (line: number) => lines()[line]!,
      lineCount: () => lines().length,
      getValue: () => this.text,
      replaceRange: (replacement: string, from: EditorPosition, to: EditorPosition) => {
        this.text = this.text.slice(0, offset(from)) + replacement + this.text.slice(offset(to));
      },
      focus: () => {
        this.focused += 1;
      },
    } as unknown as Editor;
    this.built = editor;
    return this.built;
  }
}

async function pick(text: string, line: number, match: LookupMatch, inView = true) {
  const fake = new FakeEditor(text);
  const steps: string[] = [];
  const view = Object.assign(Object.create(MarkdownView.prototype) as MarkdownView, {
    editor: fake.editor,
    save: async () => {
      steps.push(`saved ${JSON.stringify(fake.text)}`);
    },
  });
  const leaves = [{ view: Object.assign(Object.create(MarkdownView.prototype) as MarkdownView, { editor: new FakeEditor("").editor }) }];
  if (inView) leaves.push({ view });
  const app = { workspace: { getLeavesOfType: () => leaves } } as unknown as App;
  const context = { editor: fake.editor, file: { path: SESSION } as TFile, start: { line, ch: 0 } } as EditorSuggestContext;
  const opened = (name: string) => (source: Source, onClosed: () => void) => {
    steps.push(`${name} ${source.line}`);
    onClosed();
  };
  await openLookup(app, match, context, (path, noted) => steps.push(`store ${path} ${JSON.stringify(noted)}`), {
    question: opened("question"),
    quest: opened("quest"),
    item: (name: string, source: Source, onClosed: () => void) => opened(`item ${name}`)(source, onClosed),
  });
  return { steps, fake };
}

describe("openLookup", () => {
  it("removes the lookup line, saves, tells the store, then opens the question below it at its new line", async () => {
    const match: LookupMatch = { kind: "question", text: "Who", holder: "", source: { path: SESSION, line: 2 } };
    expect((await pick("We rode on.\n?? who\n? Who\n", 1, match)).steps).toEqual([
      'saved "We rode on.\\n? Who\\n"',
      `store ${SESSION} "We rode on.\\n? Who\\n"`,
      "question 1",
    ]);
  });

  it("removes a last lookup line with the line break before it, and an only line whole", async () => {
    const quest: LookupMatch = { kind: "quest", text: "Find it", holder: "", source: { path: SESSION, line: 0 } };
    expect((await pick("! Find it\n!! find", 1, quest)).steps).toEqual(['saved "! Find it"', `store ${SESSION} "! Find it"`, "quest 0"]);
    const item: LookupMatch = { kind: "item", text: "Rope", holder: "", source: { path: "Pale Moon/Sessions/Session 2.md", line: 4 } };
    const picked = await pick("$$ rope", 0, item);
    expect(picked.steps).toEqual(['saved ""', `store ${SESSION} ""`, "item Rope 4"]);
    expect(picked.fake.focused).toBe(1);
  });
});

describe("openLookup refusing", () => {
  const match: LookupMatch = { kind: "question", text: "Who", holder: "", source: { path: SESSION, line: 0 } };

  it("changes nothing when the editor isn't a note's own view", async () => {
    await expect(pick("? Who\n?? who\n", 1, match, false)).rejects.toThrow(NOT_IN_A_NOTE_VIEW);
  });

  it("changes nothing when removing the line would turn lines into properties", async () => {
    await expect(pick("?? who\n---\nx\n---\n", 0, match)).rejects.toThrow(PROPERTIES_WOULD_CHANGE);
  });
});

describe("sourceAfterRemoving", () => {
  it("moves a line below the removed one up, and leaves the rest", () => {
    expect(sourceAfterRemoving({ path: SESSION, line: 5 }, SESSION, 3)).toEqual({ path: SESSION, line: 4 });
    expect(sourceAfterRemoving({ path: SESSION, line: 2 }, SESSION, 3)).toEqual({ path: SESSION, line: 2 });
    expect(sourceAfterRemoving({ path: "Other.md", line: 5 }, SESSION, 3)).toEqual({ path: "Other.md", line: 5 });
  });
});
