import { describe, expect, it } from "vitest";
import { Component } from "obsidian";
import { campaignSections, type MakePage, type PageId, type PageMakers } from "../../../src/interface/view/campaign-pages";
import { campaignsFolderFirst } from "../../../src/interface/view/campaigns-folder-first";

interface Made {
  page: PageId | "ask";
  path: string | null;
}

function makerOf(page: PageId | "ask", made: Made[]): MakePage {
  return (_contentEl, _show, path) => {
    made.push({ page, path });
    return new Component();
  };
}

function makersFor(made: Made[]): PageMakers {
  const maker = (page: PageId) => makerOf(page, made);
  return { home: maker("home"), cast: maker("cast"), notes: maker("notes"), questions: maker("questions"), quests: maker("quests"), funds: maker("funds"), note: maker("note"), welcome: maker("welcome") };
}

function openEveryPage(campaignsFolder: string | null): Made[] {
  const made: Made[] = [];
  const sections = campaignsFolderFirst(campaignSections(makersFor(made)), makerOf("ask", made), () => campaignsFolder);
  const contentEl = {} as HTMLElement;
  for (const page of sections.flatMap((section) => section.pages)) page.make(contentEl, () => {}, "D&D/Pale Moon/Notes.md", () => {});
  return made;
}

describe("campaignsFolderFirst", () => {
  it("asks for the Campaigns folder on every page of the campaign tab while none is set", () => {
    const made = openEveryPage(null);
    expect(made).toHaveLength(8);
    expect(made.every((each) => each.page === "ask" && each.path === null)).toBe(true);
  });

  it("shows each page as asked once a Campaigns folder is set", () => {
    const made = openEveryPage("D&D");
    expect(made.map((each) => each.page)).toEqual(["home", "cast", "notes", "questions", "quests", "funds", "note", "welcome"]);
    expect(made.every((each) => each.path === "D&D/Pale Moon/Notes.md")).toBe(true);
  });

  it("keeps every page's place in the sidebar", () => {
    const sections = campaignSections(makersFor([]));
    const asking = campaignsFolderFirst(sections, makerOf("ask", []), () => null);
    const placeOf = (all: typeof sections) => all.map((section) => [section.heading, section.pages.map((page) => [page.id, page.label, page.listed, page.inBar])]);
    expect(placeOf(asking)).toEqual(placeOf(sections));
  });
});
