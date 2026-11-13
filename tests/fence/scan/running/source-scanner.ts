import type { FileSystem } from "typescript/unstable/fs";
import { API, type Project, type Snapshot } from "typescript/unstable/sync";
import type { Node } from "typescript/unstable/ast";
import type { Allowances } from "../reading/allowances";
import { editorViewBreaches } from "../vault-rules/editor-view-rules";
import type { FileScan, Rules } from "../reading/file-scan";
import { codeTextBreaches } from "../code-rules/code-text-rules";
import { computedKeyBreaches } from "../code-rules/computed-key-rules";
import { foundIn } from "../reading/found";
import { pageElementBreaches } from "../page-rules/page-element-rules";
import { pageFoundIn } from "../reading/page-found";
import { pageMemberBreaches } from "../page-rules/page-member-rules";
import { pageTextBreaches } from "../page-rules/page-text-rules";
import { GateHolding } from "../reading/gate-holding";
import { gateForgingBreaches } from "../vault-rules/gate-forging-rules";
import { globalBreaches } from "../page-rules/global-rules";
import { importBreaches } from "../code-rules/import-rules";
import { openingBreaches } from "../vault-rules/opening-rules";
import { TypeQueries } from "../reading/type-queries";
import { isLibraryFile } from "../reading/type-shapes";
import { vaultAccessBreaches } from "../vault-rules/vault-access-rules";
import { workspaceEventBreaches } from "../vault-rules/workspace-event-rules";

export type { Allowances } from "../reading/allowances";

const RULES: Rules[] = [vaultAccessBreaches, editorViewBreaches, openingBreaches, workspaceEventBreaches, gateForgingBreaches, importBreaches, globalBreaches, codeTextBreaches, pageElementBreaches, pageTextBreaches, computedKeyBreaches, pageMemberBreaches];

export class SourceScanner {
  private readonly api: API;
  private readonly openedProjects = new Map<string, Project>();

  constructor(
    private readonly root: string,
    files: FileSystem,
  ) {
    this.api = new API({ cwd: root, fs: files });
  }

  close(): void {
    this.openedProjects.clear();
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
    const opened = this.openedProjects.get(configPath);
    if (opened !== undefined) return opened;
    const project = this.openProject(configPath);
    this.openedProjects.set(configPath, project);
    return project;
  }

  private openProject(configPath: string): Project {
    const snapshot = this.api.updateSnapshot({ openProjects: [configPath] });
    try {
      return this.checkedProject(snapshot, configPath);
    } catch (error) {
      snapshot.dispose();
      throw error;
    }
  }

  private checkedProject(snapshot: Snapshot, configPath: string): Project {
    const project = snapshot.getProject(configPath);
    if (project === undefined) throw new Error(`${configPath} could not be opened`);
    const problems = project.program.getConfigFileParsingDiagnostics();
    if (problems.length > 0) throw new Error(`${configPath} has problems: ${problems.map((problem) => problem.text).join("; ")}`);
    return project;
  }

  private breachesInFile(project: Project, path: string, allowances: Allowances, types: TypeQueries, gate: GateHolding): string[] {
    const sourceFile = project.program.getSourceFile(path);
    if (sourceFile === undefined) throw new Error(`${path} is not in ${project.configFileName}`);
    const shownPath = path.slice(this.root.length + 1);
    const whereAt = (position: number) => `${shownPath}:${sourceFile.getLineAndCharacterOfPosition(position).line + 1}`;
    const where = (node: Node) => whereAt(node.getStart(sourceFile));
    const scan: FileScan = { project, path, sourceFile, found: foundIn(sourceFile), page: pageFoundIn(sourceFile), allowances, types, gate, where, whereAt };
    return RULES.flatMap((rules) => rules(scan));
  }
}
