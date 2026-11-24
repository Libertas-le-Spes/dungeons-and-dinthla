import { afterEach, describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { NameSuggest } from "../../../../src/obsidian/views/mount/name-suggest";
import { AppKit, PLAIN_KIT } from "../../../../src/obsidian/views/mount/mount-kit";
import { openedInputSuggests } from "../../../stubs/obsidian";
import { obsidianDocument } from "../../../stubs/obsidian-dom";

function input(): HTMLInputElement {
  return obsidianDocument().createElement("input");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

class Suggesting extends NameSuggest {
  suggestionsFor(query: string): string[] {
    return this.getSuggestions(query);
  }
}

describe("the name suggest", () => {
  it("suggests the names holding what was typed, whatever its capitals", () => {
    expect(new Suggesting({} as App, input(), ["Lady Vess", "Mira", "Vesper"]).suggestionsFor("VES")).toEqual(["Lady Vess", "Vesper"]);
  });

  it("writes the picked name into its input, tells the input it changed, and closes", () => {
    const field = input();
    vi.stubGlobal("Event", field.ownerDocument.defaultView!.Event);
    const heard = vi.fn();
    field.addEventListener("input", heard);
    const suggest = new NameSuggest({} as App, field, ["Mira"]);
    suggest.selectSuggestion("Mira");
    expect(field.value).toBe("Mira");
    expect(heard).toHaveBeenCalledOnce();
    expect((suggest as unknown as { closedTimes: number }).closedTimes).toBe(1);
  });

  it("shows a name as its own text", () => {
    const shown = obsidianDocument().createElement("div");
    new NameSuggest({} as App, input(), []).renderSuggestion("Mira", shown);
    expect(shown.textContent).toBe("Mira");
  });
});

describe("the mount kits", () => {
  it("suggests names on an input with Obsidian's app", () => {
    const field = input();
    const app = {} as App;
    new AppKit(app).suggestNames(field, ["Mira"]);
    const made = openedInputSuggests[openedInputSuggests.length - 1]!;
    expect(made).toBeInstanceOf(NameSuggest);
    expect(made.app).toBe(app);
    expect(made.textInputEl).toBe(field);
  });

  it("refuses to suggest names without Obsidian's app", () => {
    expect(() => PLAIN_KIT.suggestNames(input(), ["Mira"])).toThrow("Names can only be suggested in a frame that has Obsidian's app.");
  });
});
