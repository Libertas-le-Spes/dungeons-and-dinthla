import type { Component } from "obsidian";
import type { Campaign } from "../campaign/campaign";
import { questionsKind } from "../questions/questions-kind";
import { questsKind } from "../quests/quests-kind";

export type PageId = "home" | "cast" | "questions" | "quests" | "funds";

export type ShowPage = (page: PageId) => void;

export type MakePage = (contentEl: HTMLElement, show: ShowPage) => Component;

export interface PageEntry {
  id: PageId;
  label: string;
  glyph: string;
  glyphClass: string;
  make: MakePage;
  countOf(campaign: Campaign): number;
}

export interface NavSection {
  heading: string | null;
  pages: PageEntry[];
}

export type PageMakers = Record<PageId, MakePage>;

const NO_COUNT = () => 0;

export function campaignSections(makers: PageMakers): NavSection[] {
  return [
    {
      heading: null,
      pages: [
        { id: "home", label: "Dashboard", glyph: "⌂", glyphClass: "dd-nav-glyph-plain", make: makers.home, countOf: NO_COUNT },
        { id: "cast", label: "Characters", glyph: "♟", glyphClass: "dd-nav-glyph-plain", make: makers.cast, countOf: NO_COUNT },
      ],
    },
    {
      heading: "From the notes",
      pages: [
        {
          id: "questions",
          label: "Questions",
          glyph: "?",
          glyphClass: "dd-marker-question",
          make: makers.questions,
          countOf: (campaign) => questionsKind.contentsOf(campaign, []).openCount,
        },
        {
          id: "quests",
          label: "Quests",
          glyph: "!",
          glyphClass: "dd-marker-quest",
          make: makers.quests,
          countOf: (campaign) => questsKind.contentsOf(campaign, []).openCount,
        },
        { id: "funds", label: "Party funds", glyph: "$", glyphClass: "dd-marker-ledger", make: makers.funds, countOf: NO_COUNT },
      ],
    },
  ];
}
