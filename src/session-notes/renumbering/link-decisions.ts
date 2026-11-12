import { campaignFolderOf } from "../../campaign/paths/campaign-folders";
import type { FencedFiles } from "../../fence/gate/fenced-files";
import { messageOf } from "../../views/dialogs/message-of";
import { DecidedTargets } from "./decided-targets";
import { linkOnSkippedLine, withLinksRewritten } from "./link-rewriting";
import { NoteLinks } from "./note-links";
import type { SessionRename } from "./renumbering-plan";
import type { NewTarget } from "./wiki-links";

export type DecisionFiles = Pick<FencedFiles, "getFileByPath" | "read" | "getFiles">;

export interface DecisionPlan {
  campaignFolder: string;
  campaignFolders: string[];
  notes: string[];
  renames: SessionRename[];
}

export interface NoteDecision {
  path: string;
  changes: boolean;
  leftAsWritten: boolean;
  skipped: boolean;
  newTarget: NewTarget;
}

export interface Decisions {
  notes: NoteDecision[];
  unread: string[];
}

function candidateCampaigns(notePath: string, plan: DecisionPlan): string[] {
  const own = campaignFolderOf(notePath, plan.campaignFolders);
  if (own === null) return plan.campaignFolders;
  return [own];
}

export class LinkDecider {
  constructor(private readonly files: DecisionFiles) {}

  async decide(plan: DecisionPlan): Promise<Decisions> {
    const decisions: Decisions = { notes: [], unread: [] };
    for (const path of plan.notes) await this.decideNote(path, plan, decisions);
    return decisions;
  }

  private async decideNote(path: string, plan: DecisionPlan, decisions: Decisions): Promise<void> {
    try {
      decisions.notes.push(await this.decisionFor(path, plan));
    } catch (error) {
      decisions.unread.push(`${path} (${messageOf(error)})`);
    }
  }

  private async decisionFor(path: string, plan: DecisionPlan): Promise<NoteDecision> {
    const file = this.files.getFileByPath(path);
    if (file === null) throw new Error(`${path} was moved or deleted`);
    const text = await this.files.read(file);
    const links = new NoteLinks(path, candidateCampaigns(path, plan), this.files, plan.renames);
    const targets = new DecidedTargets();
    withLinksRewritten(text, (target) => {
      const replacement = links.newTarget(target);
      targets.record(target, replacement);
      return replacement;
    });
    const skipped = linkOnSkippedLine(text, links.newTarget);
    return { path, changes: targets.hasChange(), leftAsWritten: links.leftAsWritten().length > 0, skipped, newTarget: targets.newTarget };
  }
}
