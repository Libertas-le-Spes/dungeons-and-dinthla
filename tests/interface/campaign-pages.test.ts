import { describe, expect, it } from "vitest";
import { Component } from "obsidian";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { campaignSections, type PageId, type PageMakers } from "../../src/interface/campaign-pages";

const campaign = buildCampaign([
  {
    path: "Pale Moon/Sessions/Session 1.md",
    number: 1,
    firstLine: 0,
    text: ["? Who sent the letter", "? Why does the Old Mill wheel turn at night", "?+ Who owns the Old Mill: Lady Vess", "! Find the missing caravan", "$ 20 gp from Lady Vess"].join("\n"),
  },
]);

function makersMadeBy(made: PageId[]): PageMakers {
  const maker = (id: PageId) => () => {
    made.push(id);
    return new Component();
  };
  return { home: maker("home"), cast: maker("cast"), notes: maker("notes"), questions: maker("questions"), quests: maker("quests"), funds: maker("funds") };
}

describe("campaignSections", () => {
  it("lists the pages in the prototype's order, the ones read from notes under their own heading", () => {
    const sections = campaignSections(makersMadeBy([]));
    expect(sections.map((section) => [section.heading, section.pages.map((page) => page.label)])).toEqual([
      [null, ["Dashboard", "Characters", "Session notes"]],
      ["From the notes", ["Questions", "Quests", "Party funds"]],
    ]);
  });

  it("shows the Notes page with a pilcrow", () => {
    const pages = campaignSections(makersMadeBy([])).flatMap((section) => section.pages);
    const notes = pages.find((page) => page.id === "notes");
    expect([notes?.glyph, notes?.glyphClass]).toEqual(["¶", "dd-nav-glyph-plain"]);
  });

  it("makes each page with its own maker", () => {
    const made: PageId[] = [];
    const pages = campaignSections(makersMadeBy(made)).flatMap((section) => section.pages);
    for (const page of pages) page.make({} as HTMLElement, () => {}, null);
    expect(made).toEqual(["home", "cast", "notes", "questions", "quests", "funds"]);
    expect(pages.map((page) => page.id)).toEqual(made);
  });

  it("counts open questions and active quests, and nothing for the other pages", () => {
    const pages = campaignSections(makersMadeBy([])).flatMap((section) => section.pages);
    expect(pages.map((page) => [page.id, page.countOf(campaign)])).toEqual([
      ["home", 0],
      ["cast", 0],
      ["notes", 0],
      ["questions", 2],
      ["quests", 1],
      ["funds", 0],
    ]);
  });
});
