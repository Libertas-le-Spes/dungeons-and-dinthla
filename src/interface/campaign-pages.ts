import type { Component } from "obsidian";
import type { Campaign } from "../campaign/campaign";
import { questionsKind } from "../questions/questions-kind";
import { questsKind } from "../quests/quests-kind";

export type PageId = "home" | "cast" | "notes" | "questions" | "quests" | "funds";

export type PageTarget = { page: PageId; path: string | null };

export type ShowPage = (target: PageTarget) => void;

export type StayOn = (path: string) => void;

export type MakePage = (contentEl: HTMLElement, show: ShowPage, path: string | null, stayOn: StayOn) => Component;

export type PathAfterDelete = (path: string) => string | null;

export interface PageEntry {
  id: PageId;
  label: string;
  shortLabel: string;
  inBar: boolean;
  glyph: string;
  glyphClass: string;
  make: MakePage;
  pathAfterDelete: PathAfterDelete;
  countOf(campaign: Campaign): number;
}

export interface NavSection {
  heading: string | null;
  pages: PageEntry[];
}

export type PageMakers = Record<PageId, MakePage>;

const NO_COUNT = () => 0;

const LEAVE_DELETED_NOTE: PathAfterDelete = () => null;

const KEEP_DELETED_NOTE: PathAfterDelete = (path) => path;

export function campaignSections(makers: PageMakers): NavSection[] {
  return [
    {
      heading: null,
      pages: [
        {
          id: "home",
          label: "Dashboard",
          shortLabel: "Home",
          inBar: true,
          glyph: "⌂",
          glyphClass: "dd-nav-glyph-plain",
          make: makers.home,
          pathAfterDelete: LEAVE_DELETED_NOTE,
          countOf: NO_COUNT,
        },
        {
          id: "cast",
          label: "Characters",
          shortLabel: "Cast",
          inBar: true,
          glyph: "♟",
          glyphClass: "dd-nav-glyph-plain",
          make: makers.cast,
          pathAfterDelete: LEAVE_DELETED_NOTE,
          countOf: NO_COUNT,
        },
        {
          id: "notes",
          label: "Session notes",
          shortLabel: "Notes",
          inBar: true,
          glyph: "¶",
          glyphClass: "dd-nav-glyph-plain",
          make: makers.notes,
          pathAfterDelete: KEEP_DELETED_NOTE,
          countOf: NO_COUNT,
        },
      ],
    },
    {
      heading: "From the notes",
      pages: [
        {
          id: "questions",
          label: "Questions",
          shortLabel: "Questions",
          inBar: false,
          glyph: "?",
          glyphClass: "dd-marker-question",
          make: makers.questions,
          pathAfterDelete: LEAVE_DELETED_NOTE,
          countOf: (campaign) => questionsKind.contentsOf(campaign, []).openCount,
        },
        {
          id: "quests",
          label: "Quests",
          shortLabel: "Quests",
          inBar: false,
          glyph: "!",
          glyphClass: "dd-marker-quest",
          make: makers.quests,
          pathAfterDelete: LEAVE_DELETED_NOTE,
          countOf: (campaign) => questsKind.contentsOf(campaign, []).openCount,
        },
        {
          id: "funds",
          label: "Party funds",
          shortLabel: "Funds",
          inBar: true,
          glyph: "$",
          glyphClass: "dd-marker-ledger",
          make: makers.funds,
          pathAfterDelete: LEAVE_DELETED_NOTE,
          countOf: NO_COUNT,
        },
      ],
    },
  ];
}
