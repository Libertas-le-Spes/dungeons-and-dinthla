import { describe, expect, it } from "vitest";
import { Component } from "obsidian";
import { buildCampaign } from "../../../../src/campaign/reading/build-campaign";
import { campaignSections, type PageId, type PageMakers } from "../../../../src/obsidian/interface/view/campaign-pages";

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
  return { home: maker("home"), cast: maker("cast"), notes: maker("notes"), questions: maker("questions"), quests: maker("quests"), funds: maker("funds"), note: maker("note"), welcome: maker("welcome") };
}

function listedPages(made: PageId[] = []) {
  return campaignSections(makersMadeBy(made)).flatMap((section) => section.pages.filter((page) => page.listed));
}

describe("campaignSections", () => {
  it("lists the pages in the prototype's order, the ones read from notes under their own heading", () => {
    const sections = campaignSections(makersMadeBy([]));
    const listed = sections.map((section) => [section.heading, section.pages.filter((page) => page.listed).map((page) => page.label)]);
    expect(listed).toEqual([
      [null, ["Dashboard", "Characters", "Session notes"]],
      ["From the notes", ["Questions", "Quests", "Party funds"]],
      [null, []],
    ]);
  });

  it("has a page for any other note of the campaign that the sidebar and the bar leave out, as it is reached by opening the note", () => {
    const pages = campaignSections(makersMadeBy([])).flatMap((section) => section.pages);
    const note = pages.find((page) => page.id === "note");
    expect([note?.listed, note?.inBar]).toEqual([false, false]);
  });

  it("has a Welcome page that the sidebar and the bar leave out, as it opens on first install or from the settings", () => {
    const pages = campaignSections(makersMadeBy([])).flatMap((section) => section.pages);
    const welcome = pages.find((page) => page.id === "welcome");
    expect([welcome?.label, welcome?.listed, welcome?.inBar]).toEqual(["Welcome", false, false]);
  });

  it("keeps the note page on its note when the note is deleted, so what was typed stays", () => {
    const pages = campaignSections(makersMadeBy([])).flatMap((section) => section.pages);
    const note = pages.find((page) => page.id === "note");
    expect(note?.pathAfterDelete("Pale Moon/Places/Old Mill.md")).toBe("Pale Moon/Places/Old Mill.md");
  });

  it("puts Home, Cast, Notes and Funds in the bottom bar under their short names, and leaves Questions and Quests to the dashboard", () => {
    const pages = listedPages();
    expect(pages.map((page) => [page.shortLabel, page.inBar])).toEqual([
      ["Home", true],
      ["Cast", true],
      ["Notes", true],
      ["Questions", false],
      ["Quests", false],
      ["Funds", true],
    ]);
  });

  it("shows the Notes page with a pilcrow", () => {
    const pages = campaignSections(makersMadeBy([])).flatMap((section) => section.pages);
    const notes = pages.find((page) => page.id === "notes");
    expect([notes?.glyph, notes?.glyphClass]).toEqual(["¶", "dd-nav-glyph-plain"]);
  });

  it("keeps the Notes page on its session when the note is deleted, and leaves the note on every other listed page", () => {
    const pages = listedPages();
    const after = pages.map((page) => [page.id, page.pathAfterDelete("Pale Moon/Sessions/Session 3.md")]);
    expect(after).toEqual([
      ["home", null],
      ["cast", null],
      ["notes", "Pale Moon/Sessions/Session 3.md"],
      ["questions", null],
      ["quests", null],
      ["funds", null],
    ]);
  });

  it("makes each page with its own maker", () => {
    const made: PageId[] = [];
    const pages = campaignSections(makersMadeBy(made)).flatMap((section) => section.pages);
    for (const page of pages) page.make({} as HTMLElement, () => {}, null, () => {});
    expect(made).toEqual(["home", "cast", "notes", "questions", "quests", "funds", "note", "welcome"]);
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
      ["note", 0],
      ["welcome", 0],
    ]);
  });
});
