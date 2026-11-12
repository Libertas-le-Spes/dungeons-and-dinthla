import { vi } from "vitest";
import type { NoRenumbering, RenumberingPlan, SessionRename } from "../../../src/session-notes/renumbering/renumbering-plan";
import type { RenumberingReport } from "../../../src/session-notes/renumbering/renumbering-words";
import type { SessionRenumbering } from "../../../src/session-notes/renumbering/session-renumbering";

export type RenumberingTool = Pick<SessionRenumbering, "planFor" | "confirmed" | "carryOut">;

export const NOTHING_WRONG: RenumberingReport = { renamed: [], notRenamed: [], renameFailure: null, linksNotUpdated: [], linksLeft: [] };

export interface StubbedRenumbering {
  latest?: string | null;
  renames?: SessionRename[];
  report?: RenumberingReport;
  refusal?: NoRenumbering;
  changedSinceAsked?: string;
}

export function stubRenumbering(stubbed: StubbedRenumbering = {}) {
  const { latest = null, renames = [], report = NOTHING_WRONG, refusal, changedSinceAsked } = stubbed;
  const plan: RenumberingPlan = { campaignFolder: "Pale Moon", renames, latest };
  return {
    planFor: vi.fn((): RenumberingPlan | NoRenumbering => {
      if (refusal !== undefined) return refusal;
      return plan;
    }),
    confirmed: vi.fn((_deleted: string, asked: RenumberingPlan) => {
      if (changedSinceAsked !== undefined) throw new Error(changedSinceAsked);
      return asked;
    }),
    carryOut: vi.fn(async () => report),
  } satisfies RenumberingTool;
}
