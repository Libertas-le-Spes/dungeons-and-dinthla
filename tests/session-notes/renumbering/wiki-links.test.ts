import { describe, expect, it } from "vitest";
import { lineWithTargetsMasked, lineWithTargetsReplaced, targetsOf, type NewTarget } from "../../../src/session-notes/renumbering/wiki-links";

function renamingTo(names: Record<string, string>): NewTarget {
  return (target) => {
    const renamed = names[target];
    if (renamed === undefined) return null;
    return renamed;
  };
}

const FOUR_TO_THREE = renamingTo({ "Session 4": "Session 3" });

describe("lineWithTargetsReplaced", () => {
  it("replaces the target of a plain link", () => {
    expect(lineWithTargetsReplaced("from [[Session 4]] on", FOUR_TO_THREE)).toBe("from [[Session 3]] on");
  });

  it("keeps an alias, a heading, a block reference and an embed's mark", () => {
    expect(lineWithTargetsReplaced("[[Session 4|the mill]]", FOUR_TO_THREE)).toBe("[[Session 3|the mill]]");
    expect(lineWithTargetsReplaced("[[Session 4#Plans]]", FOUR_TO_THREE)).toBe("[[Session 3#Plans]]");
    expect(lineWithTargetsReplaced("[[Session 4^abc]]", FOUR_TO_THREE)).toBe("[[Session 3^abc]]");
    expect(lineWithTargetsReplaced("![[Session 4]]", FOUR_TO_THREE)).toBe("![[Session 3]]");
  });

  it("replaces every link on the line that has a new target and leaves the others", () => {
    expect(lineWithTargetsReplaced("[[Session 4]] and [[Mira]] and [[Session 4|again]]", FOUR_TO_THREE)).toBe("[[Session 3]] and [[Mira]] and [[Session 3|again]]");
  });

  it("changes each link once, from the original text, so one move doesn't carry on into the next", () => {
    const shifted = renamingTo({ "Session 4": "Session 3", "Session 5": "Session 4" });
    expect(lineWithTargetsReplaced("[[Session 5]] [[Session 4]]", shifted)).toBe("[[Session 4]] [[Session 3]]");
  });

  it("leaves a link the new targets don't name, and text that only looks like one", () => {
    expect(lineWithTargetsReplaced("[[Session 9]] [Session 4] [[Session 4", FOUR_TO_THREE)).toBe("[[Session 9]] [Session 4] [[Session 4");
  });

  it("leaves a link inside inline code", () => {
    expect(lineWithTargetsReplaced("`[[Session 4]]` and [[Session 4]]", FOUR_TO_THREE)).toBe("`[[Session 4]]` and [[Session 3]]");
  });

  it("asks for the new target of a link only, never of inline code", () => {
    const asked: string[] = [];
    lineWithTargetsReplaced("`[[Session 4]]` and [[Session 4]]", (target) => {
      asked.push(target);
      return null;
    });
    expect(asked).toEqual(["Session 4"]);
  });

  it("hands the new targets the target as written, including a folder and an ending", () => {
    const asked: string[] = [];
    lineWithTargetsReplaced("[[Sessions/Session 4.md]]", (target) => {
      asked.push(target);
      return null;
    });
    expect(asked).toEqual(["Sessions/Session 4.md"]);
  });
});

describe("lineWithTargetsMasked", () => {
  it("keeps everything but link targets", () => {
    expect(lineWithTargetsMasked("see ![[Session 4#Plans]] and [[Mira|her]]")).toBe("see ![[#Plans]] and [[|her]]");
  });

  it("keeps inline code as it is", () => {
    expect(lineWithTargetsMasked("`[[Session 4]]` [[Session 4]]")).toBe("`[[Session 4]]` [[]]");
  });
});

describe("targetsOf", () => {
  it("lists the targets of the links on a line, not those in inline code", () => {
    expect(targetsOf("[[Session 4|x]] `[[Mira]]` ![[Sessions/Session 5#Plans]]")).toEqual(["Session 4", "Sessions/Session 5"]);
  });

  it("lists nothing for a line without links", () => {
    expect(targetsOf("Tracks lead to the mill.")).toEqual([]);
  });
});
