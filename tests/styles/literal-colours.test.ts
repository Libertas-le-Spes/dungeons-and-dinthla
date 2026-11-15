import { describe, expect, it } from "vitest";
import { literalColoursInCode, literalColoursInStyles, sourceFiles, styleFiles, textOf } from "./literal-colours";

describe("the colour guard", () => {
  it("finds a hex colour, a colour function and a named colour in styles", () => {
    expect(literalColoursInStyles(".a { color: #8a2d20; }")).toEqual(["#8a2d20"]);
    expect(literalColoursInStyles(".a { background: rgba(0, 0, 0, 0.5); }")).toEqual(["rgba("]);
    expect(literalColoursInStyles(".a { border: 1px solid white; }")).toHaveLength(1);
    expect(literalColoursInStyles(".a { color: oklch(0.5 0.1 20); }")).toEqual(["oklch("]);
  });

  it("lets styles use Obsidian's variables, colour mixes of them, and keywords", () => {
    const css = ".a { color: var(--text-normal); background: color-mix(in srgb, var(--color-red) 8%, transparent); border-color: currentColor; white-space: nowrap; }";
    expect(literalColoursInStyles(css)).toEqual([]);
  });

  it("finds a colour written in code", () => {
    expect(literalColoursInCode('const colour = "#fff";')).toEqual(["#fff"]);
    expect(literalColoursInCode('el.style.color = "red";')).toEqual(['"red"']);
    expect(literalColoursInCode("const hsl = `hsl(10, 50%, 50%)`;")).toEqual(["hsl("]);
  });

  it("lets code mention words that merely contain a colour name", () => {
    expect(literalColoursInCode('const text = "Add a red flag to the tan line"; const id = "dd-tan";')).toEqual([]);
  });
});

function offendersIn({ files, find }: { files: string[]; find: (text: string) => string[] }): Record<string, string[]> {
  const offenders: Record<string, string[]> = {};
  for (const file of files) {
    const found = find(textOf(file));
    if (found.length > 0) offenders[file] = found;
  }
  return offenders;
}

describe("every colour the plugin draws comes from Obsidian's theme", () => {
  it("is written in no stylesheet as a literal colour", () => {
    expect(offendersIn({ files: styleFiles(), find: literalColoursInStyles })).toEqual({});
  });

  it("is written in no source file as a literal colour", () => {
    expect(offendersIn({ files: sourceFiles(), find: literalColoursInCode })).toEqual({});
  });
});
