import { campaignFolderOf } from "../../campaign/paths/campaign-folders";
import type { FencedFiles } from "../../fence/gate/fenced-files";
import { messageOf } from "../../views/dialogs/message-of";
import { withLinksRewritten } from "./link-rewriting";
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
  newTarget: NewTarget;
}

export interface Decisions {
  notes: NoteDecision[];
  unread: string[];
}

class DecidedTargets {
  readonly newTarget: NewTarget = (target) => this.lookup(target);
  private readonly decided = new Map<string, string | null>();

  record(target: string, replacement: string | null): void {
    this.decided.set(target, replacement);
  }

  hasChange(): boolean {
    return [...this.decided.values()].some((replacement) => replacement !== null);
  }

  private lookup(target: string): string | null {
    const replacement = this.decided.get(target);
    if (replacement === undefined) return null;
    return replacement;
  }
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
    return { path, changes: targets.hasChange(), leftAsWritten: links.leftAsWritten().length > 0, newTarget: targets.newTarget };
  }
}
