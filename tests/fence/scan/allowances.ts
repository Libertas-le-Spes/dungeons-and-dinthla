export type Allowed = (path: string) => boolean;

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
}
