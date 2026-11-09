import type { Vault } from "obsidian";

interface ConfigReader {
  getConfig(key: string): unknown;
}

export class VaultSettings {
  constructor(private readonly vault: Vault) {}

  trashOption(): unknown {
    return this.reader().getConfig("trashOption");
  }

  cssTheme(): unknown {
    return this.reader().getConfig("cssTheme");
  }

  private reader(): ConfigReader {
    return this.vault as unknown as ConfigReader;
  }
}
