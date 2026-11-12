import { campaignFolderOf } from "../../campaign/paths/campaign-folders";
import type { FencedFiles } from "../../fence/gate/fenced-files";
import { LinkUpdates, type LinkUpdateFiles, type NotePath } from "./link-updates";
import { planRenumbering, type NoRenumbering, type RenumberingPlan } from "./renumbering-plan";
import { NOT_IN_A_CAMPAIGN, SESSIONS_CHANGED_SINCE_ASKED, type RenumberingReport } from "./renumbering-words";
import { SessionRenamer, type RenameFiles } from "./session-renamer";

export type RenumberingFiles = RenameFiles & LinkUpdateFiles & Pick<FencedFiles, "getFiles" | "getMarkdownFiles">;

export type CampaignFolders = () => string[];

function pathsOf(files: NotePath[]): NotePath[] {
  return files.map((file) => ({ path: file.path }));
}

function namesOf(files: NotePath[]): string[] {
  return files.map((file) => file.path);
}

function samePlan(first: RenumberingPlan, second: RenumberingPlan): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

export class SessionRenumbering {
  private readonly renamer: SessionRenamer;
  private readonly updates: LinkUpdates;

  constructor(
    private readonly files: RenumberingFiles,
    private readonly campaignFolders: CampaignFolders,
  ) {
    this.renamer = new SessionRenamer(files);
    this.updates = new LinkUpdates(files);
  }

  planFor(deletedPath: string): RenumberingPlan | NoRenumbering {
    const campaignFolder = campaignFolderOf(deletedPath, this.campaignFolders());
    if (campaignFolder === null) return { error: NOT_IN_A_CAMPAIGN };
    return planRenumbering(campaignFolder, namesOf(this.files.getFiles()), deletedPath);
  }

  confirmed(deletedPath: string, asked: RenumberingPlan): RenumberingPlan {
    const plan = this.planFor(deletedPath);
    if ("error" in plan) throw new Error(plan.error);
    if (!samePlan(plan, asked)) throw new Error(SESSIONS_CHANGED_SINCE_ASKED);
    return plan;
  }

  async carryOut(plan: RenumberingPlan): Promise<RenumberingReport> {
    const filesBeforeRenames = pathsOf(this.files.getFiles());
    const notes = pathsOf(this.files.getMarkdownFiles());
    const outcome = await this.renamer.rename(plan.renames);
    const stopped = { renamed: outcome.renamed, notRenamed: outcome.notRenamed, renameFailure: outcome.failure };
    if (outcome.failure !== null) return { ...stopped, linksNotUpdated: [], linksLeft: [] };
    const campaigns = this.campaignFolders();
    const links = await this.updates.update({ campaignFolder: plan.campaignFolder, campaignFolders: campaigns, notes, filesBeforeRenames, renames: plan.renames });
    return { ...stopped, linksNotUpdated: links.notUpdated, linksLeft: links.leftAsWritten };
  }
}
