export type Allowed = (path: string) => boolean;

export type AllowedName = (path: string, name: string) => boolean;

export interface Allowances {
  vault: Allowed;
  keyReading: Allowed;
  editorReading: Allowed;
  fileTree: Allowed;
  looseCasts: Allowed;
  noteReading: Allowed;
  codeMirror: Allowed;
  fileOpening: Allowed;
  viewState: Allowed;
  activeFile: Allowed;
  activeView: Allowed;
  eventTrigger: Allowed;
  leafView: Allowed;
  viewFile: Allowed;
  noteEvents: Allowed;
  gateBuilding: Allowed;
  network: Allowed;
  beyondCalling: Allowed;
  obsidianImports: AllowedName;
  postProcessing: Allowed;
  pageMembers: AllowedName;
  computedKeys: Allowed;
  pageText: Allowed;
  elementQueries: Allowed;
  tags: AllowedName;
  attributes: AllowedName;
  elementOptions: AllowedName;
  globals: AllowedName;
}
