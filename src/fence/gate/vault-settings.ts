import type { App } from "obsidian";

export interface ConfigReader {
  getConfig(key: string): unknown;
}

function readConfig(vault: object, key: string): unknown {
  if (!("getConfig" in vault) || typeof vault.getConfig !== "function") return undefined;
  return vault.getConfig(key);
}

export function configReaderOf(app: Pick<App, "vault">): ConfigReader {
  const vault: object = app.vault;
  return { getConfig: (key) => readConfig(vault, key) };
}

export class VaultSettings {
  constructor(private readonly config: ConfigReader) {}

  trashOption(): unknown {
    return this.config.getConfig("trashOption");
  }
}
