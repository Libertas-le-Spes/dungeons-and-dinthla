import { campaignFolderOf } from "../../campaign/paths/campaign-folders";
import type { FencedFiles } from "../../fence/gate/fenced-files";
import { messageOf } from "../../views/dialogs/message-of";
import { withLinksRewritten } from "./link-rewriting";
import { LinkWriter, type LinkFiles } from "./link-writer";
import { NoteLinks } from "./note-links";
import type { SessionRename } from "./renumbering-plan";

export type LinkUpdateFiles = LinkFiles & Pick<FencedFiles, "getFileByPath" | "read">;

export interface NotePath {
  path: string;
}

export interface LinkUpdateReport {
  notUpdated: string[];
  leftAsWritten: string[];
}

export interface LinkUpdatePlan {
  campaignFolder: string;
  campaignFolders: string[];
  notes: NotePath[];
  filesBeforeRenames: NotePath[];
  renames: SessionRename[];
}

function candidateCampaigns(notePath: string, plan: LinkUpdatePlan): string[] {
  const own = campaignFolderOf(notePath, plan.campaignFolders);
  if (own === null) return plan.campaignFolders;
  return [own];
}

function pathNowOf(path: string, renames: SessionRename[]): string {
  const moved = renames.find((rename) => rename.from === path);
  if (moved === undefined) return path;
  return moved.to;
}

export class LinkUpdates {
  private readonly writer: LinkWriter;

  constructor(private readonly files: LinkUpdateFiles) {
    this.writer = new LinkWriter(files);
  }

  async update(plan: LinkUpdatePlan): Promise<LinkUpdateReport> {
    const report: LinkUpdateReport = { notUpdated: [], leftAsWritten: [] };
    for (const note of plan.notes) await this.updateNote(note.path, plan, report);
    return report;
  }

  private async updateNote(path: string, plan: LinkUpdatePlan, report: LinkUpdateReport): Promise<void> {
    const links = new NoteLinks(path, candidateCampaigns(path, plan), { getFiles: () => plan.filesBeforeRenames }, plan.renames);
    const nowAt = pathNowOf(path, plan.renames);
    await this.rewriteIfChanged(nowAt, links, report);
    if (links.leftAsWritten().length > 0) report.leftAsWritten.push(nowAt);
  }

  private async rewriteIfChanged(path: string, links: NoteLinks, report: LinkUpdateReport): Promise<void> {
    try {
      const file = this.files.getFileByPath(path);
      if (file === null) throw new Error(`${path} was moved or deleted`);
      const text = await this.files.read(file);
      if (withLinksRewritten(text, links.newTarget) === text) return;
      await this.writer.rewrite(path, links.newTarget);
    } catch (error) {
      report.notUpdated.push(`${path} (${messageOf(error)})`);
    }
  }
}
