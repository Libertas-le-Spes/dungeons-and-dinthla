import type { Component } from "obsidian";
export type { PageId, PageTarget, ShowPage, StayOn } from "../../../interface/view/page-target";
import type { Campaign } from "../../../campaign/record/campaign";
import { coinTrackedKind } from "../../../kinds/coin-tracked-kind";
import { questTrackedKind } from "../../../kinds/quest-tracked-kind";
import { questionTrackedKind } from "../../../kinds/question-tracked-kind";
import type { PageId, ShowPage, StayOn } from "../../../interface/view/page-target";
import { questionsKind } from "../../../questions/list/questions-kind";
import { questsKind } from "../../../quests/list/quests-kind";

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
          id: questionTrackedKind.page,
          label: "Questions",
          shortLabel: "Questions",
          listed: true,
          inBar: false,
          glyph: questionTrackedKind.marker.symbol,
          glyphClass: questionTrackedKind.marker.colourClass,
          make: makers.questions,
          pathAfterDelete: LEAVE_DELETED_NOTE,
          countOf: (campaign) => questionsKind.contentsOf(campaign, []).openCount,
        },
        {
          id: questTrackedKind.page,
          label: "Quests",
          shortLabel: "Quests",
          listed: true,
          inBar: false,
          glyph: questTrackedKind.marker.symbol,
          glyphClass: questTrackedKind.marker.colourClass,
          make: makers.quests,
          pathAfterDelete: LEAVE_DELETED_NOTE,
          countOf: (campaign) => questsKind.contentsOf(campaign, []).openCount,
        },
        {
          id: coinTrackedKind.page,
          label: "Party funds",
          shortLabel: "Funds",
          listed: true,
          inBar: true,
          glyph: coinTrackedKind.marker.symbol,
          glyphClass: coinTrackedKind.marker.colourClass,
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
