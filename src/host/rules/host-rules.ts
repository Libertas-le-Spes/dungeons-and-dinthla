export interface HostRules {
  settingsFolder(): string;
  isWrittenAsStored(path: string): boolean;
}
