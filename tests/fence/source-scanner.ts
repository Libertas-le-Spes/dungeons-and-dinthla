import type { FileSystem } from "typescript/unstable/fs";
import { API, type Project } from "typescript/unstable/sync";
import type { Node } from "typescript/unstable/ast";
import type { Allowances } from "./scan/allowances";
import { editorViewBreaches } from "./scan/editor-view-rules";
import type { FileScan, Rules } from "./scan/file-scan";
import { foundIn } from "./scan/found";
import { GateHolding } from "./scan/gate-holding";
import { gateForgingBreaches } from "./scan/gate-forging-rules";
import { globalBreaches } from "./scan/global-rules";
import { importBreaches } from "./scan/import-rules";
import { openingBreaches } from "./scan/opening-rules";
import { TypeQueries } from "./scan/type-queries";
import { isLibraryFile } from "./scan/type-shapes";
import { vaultAccessBreaches } from "./scan/vault-access-rules";
import { workspaceEventBreaches } from "./scan/workspace-event-rules";

export type { Allowances } from "./scan/allowances";

const RULES: Rules[] = [vaultAccessBreaches, editorViewBreaches, openingBreaches, workspaceEventBreaches, gateForgingBreaches, importBreaches, globalBreaches];

export class SourceScanner {
  private readonly api: API;

  constructor(
    private readonly root: string,
    files: FileSystem,
  ) {
    this.api = new API({ cwd: root, fs: files });
  }

  close(): void {
    this.api.close();
  }

  loadedFiles(configPath: string): string[] {
    return this.project(configPath).program.getSourceFileNames().filter((path) => !isLibraryFile(path));
  }

  breaches(configPath: string, paths: string[], allowances: Allowances): string[] {
    const project = this.project(configPath);
    const types = new TypeQueries();
    const gate = new GateHolding(types);
    return paths.flatMap((path) => this.breachesInFile(project, path, allowances, types, gate));
  }

  private project(configPath: string): Project {
    const snapshot = this.api.updateSnapshot({ openProjects: [configPath] });
    const project = snapshot.getProject(configPath);
    if (project === undefined) throw new Error(`${configPath} could not be opened`);
    return project;
  }

  private breachesInFile(project: Project, path: string, allowances: Allowances, types: TypeQueries, gate: GateHolding): string[] {
    const sourceFile = project.program.getSourceFile(path);
    if (sourceFile === undefined) throw new Error(`${path} is not in ${project.configFileName}`);
    const shownPath = path.slice(this.root.length + 1);
    const whereAt = (position: number) => `${shownPath}:${sourceFile.getLineAndCharacterOfPosition(position).line + 1}`;
    const where = (node: Node) => whereAt(node.getStart(sourceFile));
    const scan: FileScan = { project, path, sourceFile, found: foundIn(sourceFile), allowances, types, gate, where, whereAt };
    return RULES.flatMap((rules) => rules(scan));
  }
}
