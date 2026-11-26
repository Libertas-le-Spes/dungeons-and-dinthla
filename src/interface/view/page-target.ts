import type { ReferencePageId } from "../../kinds/reference-page-id";
import type { TrackedPageId } from "../../kinds/tracked-page-id";

export type PageId = "home" | ReferencePageId | "notes" | TrackedPageId | "welcome";

export type PageTarget = { page: PageId; path: string | null };

export type ShowPage = (target: PageTarget) => void;

export type StayOn = (path: string) => void;
