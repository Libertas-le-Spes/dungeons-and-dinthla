import { campaignFolderOf } from "../../campaign/paths/campaign-folders";
import type { NoteRef } from "../../host/notes/note-ref";
import type { NoteStore } from "../../host/notes/note-store";
import { LinkDecider, type DecisionFiles } from "./link-decisions";
import { LinkUpdates } from "./link-updates";
import type { LinkFiles } from "./link-writer";
import { planRenumbering, type NoRenumbering, type RenumberingPlan } from "./renumbering-plan";
import { NOT_IN_A_CAMPAIGN, SESSIONS_CHANGED_SINCE_ASKED, type RenumberingReport } from "./renumbering-words";
import { SessionRenamer, type RenameFiles } from "./session-renamer";
import type { PropertiesSyntax } from "../../campaign/paths/session-file";

export type RenumberingFiles = RenameFiles & LinkFiles & DecisionFiles & Pick<NoteStore, "notes">;

export type CampaignFolders = () => string[];

function namesOf(files: NoteRef[]): string[] {
  return files.map((file) => file.path);
}

function samePlan(first: RenumberingPlan, second: RenumberingPlan): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

export class SessionRenumbering {
  private readonly renamer: SessionRenamer;
  private readonly decider: LinkDecider;
  private readonly updates: LinkUpdates;

  constructor(
    private readonly files: RenumberingFiles,
    private readonly campaignFolders: CampaignFolders,
    syntax: PropertiesSyntax,
  ) {
    this.renamer = new SessionRenamer(files);
    this.decider = new LinkDecider(files, syntax);
    this.updates = new LinkUpdates(files, syntax);
  }

  planFor(deletedPath: string): RenumberingPlan | NoRenumbering {
    const campaignFolder = campaignFolderOf(deletedPath, this.campaignFolders());
    if (campaignFolder === null) return { error: NOT_IN_A_CAMPAIGN };
    return planRenumbering(campaignFolder, namesOf(this.files.files()), deletedPath);
  }

  confirmed(deletedPath: string, asked: RenumberingPlan): RenumberingPlan {
    const plan = this.planFor(deletedPath);
    if ("error" in plan) throw new Error(plan.error);
    if (!samePlan(plan, asked)) throw new Error(SESSIONS_CHANGED_SINCE_ASKED);
    return plan;
  }

  async carryOut(plan: RenumberingPlan): Promise<RenumberingReport> {
    const decisions = await this.decider.decide({
      campaignFolder: plan.campaignFolder,
      campaignFolders: this.campaignFolders(),
      notes: namesOf(this.files.notes()),
      renames: plan.renames,
    });
    const outcome = await this.renamer.rename(plan.renames);
    const stopped = { renamed: outcome.renamed, notRenamed: outcome.notRenamed, renameFailure: outcome.failure };
    if (outcome.failure !== null) return { ...stopped, linksNotUpdated: [], linksLeft: [], linksSkipped: [] };
    const links = await this.updates.apply(decisions, plan.renames);
    return { ...stopped, linksNotUpdated: links.notUpdated, linksLeft: links.leftAsWritten, linksSkipped: links.skipped };
  }
}
