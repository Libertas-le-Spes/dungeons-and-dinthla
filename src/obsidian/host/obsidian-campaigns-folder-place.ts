import type { FolderChoices } from "../../fence/gate/folder-choices";
import type { CampaignsFolderPlace } from "../../host/notes/campaigns-folder-place";

export class ObsidianCampaignsFolderPlace implements CampaignsFolderPlace {
  constructor(private readonly choices: Pick<FolderChoices, "folderPaths" | "make">) {}

  folderPaths(): string[] {
    return this.choices.folderPaths();
  }

  make(typed: string): Promise<string> {
    return this.choices.make(typed);
  }
}
