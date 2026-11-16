import { describe, expect, it } from "vitest";
import { withoutComments } from "../../src/reading/without-comments";

describe("withoutComments", () => {
  it.each([
    { kind: "a note without comments", text: "$$ Potion of healing :used\nWe rested.\n", kept: "$$ Potion of healing :used\nWe rested.\n" },
    { kind: "an Obsidian comment inside a line", text: "$ 5 gp rooms %% DM: overcharged %% at the inn\n", kept: "$ 5 gp rooms  at the inn\n" },
    { kind: "an Obsidian comment over several lines, keeping its line breaks", text: "$$ Rope :lost\n%%\nDM: Mira is the spy\n%%\nWe rested.\n", kept: "$$ Rope :lost\n\n\n\nWe rested.\n" },
    { kind: "an Obsidian comment never closed, to the end of the note", text: "$$ Rope :lost\n%% DM: Mira is the spy\nShe lies.\n", kept: "$$ Rope :lost\n\n\n" },
    { kind: "an HTML comment", text: "$$ Rope :lost <!-- DM: Mira is the spy -->\n", kept: "$$ Rope :lost \n" },
    { kind: "an HTML comment over several lines", text: "<!--\nDM: Mira is the spy\n-->\nWe rested.\n", kept: "\n\n\nWe rested.\n" },
    { kind: "an HTML comment never closed, to the end of the note", text: "We rested.\n<!-- DM: Mira is the spy\n", kept: "We rested.\n\n" },
    { kind: "two comments of both kinds, each closed by its own mark", text: "a %% one --> still %% b <!-- two %% still --> c\n", kept: "a  b  c\n" },
    { kind: "the closing mark of the comment that opens first", text: "<!-- one %% --> after\n", kept: " after\n" },
  ])("takes out $kind", ({ text, kept }) => {
    expect(withoutComments(text)).toBe(kept);
  });
});
