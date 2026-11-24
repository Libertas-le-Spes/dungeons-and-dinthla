import { messageOf } from "../../views/dialogs/message-of";
import type { Decisions } from "./link-decisions";
import { LinkWriter, type LinkFiles } from "./link-writer";
import type { SessionRename } from "./renumbering-plan";
import type { NewTarget } from "./wiki-links";
import type { PropertiesSyntax } from "../../campaign/paths/session-file";

export interface LinkUpdateReport {
  notUpdated: string[];
  leftAsWritten: string[];
  skipped: string[];
}

function pathNowOf(path: string, renames: SessionRename[]): string {
  const moved = renames.find((rename) => rename.from === path);
  if (moved === undefined) return path;
  return moved.to;
}

export class LinkUpdates {
  private readonly writer: LinkWriter;

  constructor(files: LinkFiles, syntax: PropertiesSyntax) {
    this.writer = new LinkWriter(files, syntax);
  }

  async apply(decisions: Decisions, renames: SessionRename[]): Promise<LinkUpdateReport> {
    const report: LinkUpdateReport = { notUpdated: [...decisions.unread], leftAsWritten: [], skipped: [] };
    for (const note of decisions.notes) {
      const nowAt = pathNowOf(note.path, renames);
      if (note.changes) await this.rewrite(nowAt, note.newTarget, report);
      if (note.leftAsWritten) report.leftAsWritten.push(nowAt);
      if (note.skipped) report.skipped.push(nowAt);
    }
    return report;
  }

  private async rewrite(path: string, newTarget: NewTarget, report: LinkUpdateReport): Promise<void> {
    try {
      await this.writer.rewrite(path, newTarget);
    } catch (error) {
      report.notUpdated.push(`${path} (${messageOf(error)})`);
    }
  }
}
