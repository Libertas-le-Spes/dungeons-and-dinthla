import type { Component } from "obsidian";
import type { Campaign } from "../campaign/campaign";
import { coinSourceKind } from "../kinds/coin-source-kind";
import { questSourceKind } from "../kinds/quest-source-kind";
import { questionSourceKind } from "../kinds/question-source-kind";
import { questionsKind } from "../questions/questions-kind";
import { questsKind } from "../quests/quests-kind";

export type PageId = "home" | "cast" | "notes" | "questions" | "quests" | "funds" | "note" | "welcome";

export type PageTarget = { page: PageId; path: string | null };

export type ShowPage = (target: PageTarget) => void;

export type StayOn = (path: string) => void;

export type MakePage = (contentEl: HTMLElement, show: ShowPage, path: string | null, stayOn: StayOn) => Component;

export type PathAfterDelete = (path: string) => string | null;

export interface PageEntry {
  id: PageId;
  label: string;
  shortLabel: string;
  listed: boolean;
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
          listed: true,
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
          listed: true,
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
          listed: true,
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
          id: questionSourceKind.page,
          label: "Questions",
          shortLabel: "Questions",
          listed: true,
          inBar: false,
          glyph: questionSourceKind.marker.symbol,
          glyphClass: questionSourceKind.marker.colourClass,
          make: makers.questions,
          pathAfterDelete: LEAVE_DELETED_NOTE,
          countOf: (campaign) => questionsKind.contentsOf(campaign, []).openCount,
        },
        {
          id: questSourceKind.page,
          label: "Quests",
          shortLabel: "Quests",
          listed: true,
          inBar: false,
          glyph: questSourceKind.marker.symbol,
          glyphClass: questSourceKind.marker.colourClass,
          make: makers.quests,
          pathAfterDelete: LEAVE_DELETED_NOTE,
          countOf: (campaign) => questsKind.contentsOf(campaign, []).openCount,
        },
        {
          id: coinSourceKind.page,
          label: "Party funds",
          shortLabel: "Funds",
          listed: true,
          inBar: true,
          glyph: coinSourceKind.marker.symbol,
          glyphClass: coinSourceKind.marker.colourClass,
          make: makers.funds,
          pathAfterDelete: LEAVE_DELETED_NOTE,
          countOf: NO_COUNT,
        },
      ],
    },
    {
      heading: null,
      pages: [
        {
          id: "note",
          label: "Note",
          shortLabel: "Note",
          listed: false,
          inBar: false,
          glyph: "",
          glyphClass: "dd-nav-glyph-plain",
          make: makers.note,
          pathAfterDelete: KEEP_DELETED_NOTE,
          countOf: NO_COUNT,
        },
        {
          id: "welcome",
          label: "Welcome",
          shortLabel: "Welcome",
          listed: false,
          inBar: false,
          glyph: "",
          glyphClass: "dd-nav-glyph-plain",
          make: makers.welcome,
          pathAfterDelete: LEAVE_DELETED_NOTE,
          countOf: NO_COUNT,
        },
      ],
    },
  ];
}
