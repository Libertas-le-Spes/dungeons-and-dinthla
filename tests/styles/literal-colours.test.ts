import { describe, expect, it } from "vitest";
import { COLOUR_WORDS_ALLOWED } from "./colour-allow-list";
import { literalColoursInCode, literalColoursInStyles } from "./colour-finder";
import { sourceFiles, styleFiles, textOf } from "./source-listing";

describe("finding colours in styles", () => {
  it("finds a hex colour, a colour function and a named colour", () => {
    expect(literalColoursInStyles(".a { color: #8a2d20; }")).toEqual(["#8a2d20"]);
    expect(literalColoursInStyles(".a { background: rgba(0, 0, 0, 0.5); }")).toEqual(["rgba(0"]);
    expect(literalColoursInStyles(".a { border: 1px solid white; }")).toHaveLength(1);
    expect(literalColoursInStyles(".a { color: oklch(0.5 0.1 20); }")).toEqual(["oklch(0"]);
  });

  it("finds them however they are capitalised", () => {
    expect(literalColoursInStyles(".a { color: #8A2D20; }")).toEqual(["#8A2D20"]);
    expect(literalColoursInStyles(".a { color: RGB(1, 2, 3); }")).toEqual(["RGB(1"]);
    expect(literalColoursInStyles(".a { color: Tomato; }")).toHaveLength(1);
  });

  it("finds system colours", () => {
    expect(literalColoursInStyles(".a { color: CanvasText; }")).toHaveLength(1);
    expect(literalColoursInStyles(".a { background: Highlight; }")).toHaveLength(1);
  });

  it("lets styles use Obsidian's variables, colour mixes of them, and keywords", () => {
    const css = ".a { color: var(--text-normal); background: color-mix(in srgb, var(--color-red) 8%, transparent); border-color: currentColor; white-space: nowrap; }";
    expect(literalColoursInStyles(css)).toEqual([]);
  });

  it("lets a colour be made from the theme's colours with a relative colour", () => {
    expect(literalColoursInStyles(".a { color: oklch(from var(--color-blue) l calc(c * 2) h); }")).toEqual([]);
  });

  it("lets a property or a selector carry a colour's name", () => {
    expect(literalColoursInStyles(".a:hover mark { transition: background 120ms; }")).toEqual([]);
  });

  it("lets a selector or class carry a colour's name", () => {
    expect(literalColoursInStyles(".dd-red-flag, .tan { margin: 0; }")).toEqual([]);
  });
});

describe("finding colours in code", () => {
  it("finds a hex colour written as a string or after a colon", () => {
    expect(literalColoursInCode('const colour = "#fff";')).toEqual(["#fff"]);
    expect(literalColoursInCode('const rule = "color: #FFAA00";')).toEqual(["#FFAA00"]);
  });

  it("finds a colour function in any case", () => {
    expect(literalColoursInCode("const hsl = `hsl(10, 50%, 50%)`;")).toEqual(["hsl(1"]);
    expect(literalColoursInCode("const hsl = `HSL(10, 50%, 50%)`;")).toEqual(["HSL(1"]);
  });

  it("finds a colour name anywhere in a string, in any case", () => {
    expect(literalColoursInCode('el.style.color = "red";')).toEqual(["red"]);
    expect(literalColoursInCode('const rule = "border: 1px solid Tomato";')).toEqual(["Tomato"]);
    expect(literalColoursInCode("const text = `a Tomato line`;")).toEqual(["Tomato"]);
  });

  it("lets code name its own variables in a template", () => {
    expect(literalColoursInCode("const text = `${gold} gp`;")).toEqual([]);
  });

  it("lets ordinary text mention an issue number, or a word that merely contains a colour name", () => {
    expect(literalColoursInCode('const text = "See issue #123 for details";')).toEqual([]);
    expect(literalColoursInCode('const id = "dd-tan"; const word = "stand";')).toEqual([]);
  });
});

function withoutAllowed({ file, found }: { file: string; found: string[] }): string[] {
  const allowed = new Map(Object.entries(COLOUR_WORDS_ALLOWED)).get(file);
  if (allowed === undefined) return found;
  return found.filter((colour) => !allowed.includes(colour));
}

function offendersIn({ files, find }: { files: string[]; find: (text: string) => string[] }): Record<string, string[]> {
  const offenders: Record<string, string[]> = {};
  for (const file of files) {
    const found = withoutAllowed({ file, found: find(textOf(file)) });
    if (found.length > 0) offenders[file] = found;
  }
  return offenders;
}

describe("every colour the plugin draws comes from Obsidian's theme", () => {
  it("is written in no stylesheet as a literal colour", () => {
    expect(offendersIn({ files: styleFiles(), find: literalColoursInStyles })).toEqual({});
  });

  it("is written in no source file as a literal colour, but for the coin names Beyond uses", () => {
    expect(offendersIn({ files: sourceFiles(), find: literalColoursInCode })).toEqual({});
  });

  it("keeps each allowed word only while its file still holds it", () => {
    for (const [file, words] of Object.entries(COLOUR_WORDS_ALLOWED)) {
      const found = literalColoursInCode(textOf(file));
      for (const word of words) expect(found, `${file} ${word}`).toContain(word);
    }
  });
});
