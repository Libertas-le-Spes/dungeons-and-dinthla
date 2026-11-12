import type { PluginSettings } from "./plugin-settings";
import type { SettingsChange, SettingsSaver } from "./settings-saver";

export type NotesMadeSaver = Pick<SettingsSaver, "settings" | "saveFrom">;

function withFolder(folder: string, settings: Readonly<PluginSettings>): SettingsChange | null {
  if (settings.notesMadeFor.includes(folder)) return null;
  return { notesMadeFor: [...settings.notesMadeFor, folder] };
}

export class NotesMade {
  constructor(private readonly saver: NotesMadeSaver) {}

  hasMadeFor(folder: string): boolean {
    return this.saver.settings.notesMadeFor.includes(folder);
  }

  async markMadeFor(folder: string): Promise<void> {
    await this.saver.saveFrom((settings) => withFolder(folder, settings));
  }
}
