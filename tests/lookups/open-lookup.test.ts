import { describe, expect, it } from "vitest";
import type { App, Editor, EditorPosition, EditorSuggestContext, TFile } from "obsidian";
import type { Source } from "../../src/campaign/campaign";
import type { LookupMatch } from "../../src/lookups/lookup";
import { openLookup, sourceAfterRemoving } from "../../src/lookups/open-lookup";

const SESSION = "Pale Moon/Sessions/Session 1.md";

class FakeEditor {
  text: string;

  constructor(text: string) {
    this.text = text;
  }

  get editor(): Editor {
    const lines = () => this.text.split("\n");
    const offset = (position: EditorPosition) => lines().slice(0, position.line).reduce((sum, line) => sum + line.length + 1, 0) + position.ch;
    return {
      getLine: (line: number) => lines()[line]!,
      lineCount: () => lines().length,
      getValue: () => this.text,
      replaceRange: (replacement: string, from: EditorPosition, to: EditorPosition) => {
        this.text = this.text.slice(0, offset(from)) + replacement + this.text.slice(offset(to));
      },
    } as unknown as Editor;
  }
}

async function pick(text: string, line: number, match: LookupMatch) {
  const fake = new FakeEditor(text);
  const steps: string[] = [];
  const app = { workspace: { getActiveViewOfType: () => ({ save: async () => steps.push(`saved ${JSON.stringify(fake.text)}`) }) } } as unknown as App;
  const context = { editor: fake.editor, file: { path: SESSION } as TFile, start: { line, ch: 0 } } as EditorSuggestContext;
  await openLookup(app, match, context, (path, noted) => steps.push(`store ${path} ${JSON.stringify(noted)}`), {
    question: (source: Source) => steps.push(`question ${source.line}`),
    quest: (source: Source) => steps.push(`quest ${source.line}`),
    item: (name: string) => steps.push(`item ${name}`),
  });
  return steps;
}

describe("openLookup", () => {
  it("removes the lookup line, saves, tells the store, then opens the question below it at its new line", async () => {
    const match: LookupMatch = { kind: "question", text: "Who", holder: "", source: { path: SESSION, line: 2 } };
    expect(await pick("We rode on.\n?? who\n? Who\n", 1, match)).toEqual([
      'saved "We rode on.\\n? Who\\n"',
      `store ${SESSION} "We rode on.\\n? Who\\n"`,
      "question 1",
    ]);
  });

  it("removes a last lookup line with the line break before it, and an only line whole", async () => {
    const quest: LookupMatch = { kind: "quest", text: "Find it", holder: "", source: { path: SESSION, line: 0 } };
    expect(await pick("! Find it\n!! find", 1, quest)).toEqual(['saved "! Find it"', `store ${SESSION} "! Find it"`, "quest 0"]);
    const item: LookupMatch = { kind: "item", text: "Rope", holder: "", source: { path: "Pale Moon/Sessions/Session 2.md", line: 4 } };
    expect(await pick("$$ rope", 0, item)).toEqual(['saved ""', `store ${SESSION} ""`, "item Rope"]);
  });
});

describe("sourceAfterRemoving", () => {
  it("moves a line below the removed one up, and leaves the rest", () => {
    expect(sourceAfterRemoving({ path: SESSION, line: 5 }, SESSION, 3)).toEqual({ path: SESSION, line: 4 });
    expect(sourceAfterRemoving({ path: SESSION, line: 2 }, SESSION, 3)).toEqual({ path: SESSION, line: 2 });
    expect(sourceAfterRemoving({ path: "Other.md", line: 5 }, SESSION, 3)).toEqual({ path: "Other.md", line: 5 });
  });
});
