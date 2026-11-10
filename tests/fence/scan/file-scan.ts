import type { Node, SourceFile } from "typescript/unstable/ast";
import type { Project } from "typescript/unstable/sync";
import type { Allowances } from "./allowances";
import type { Found } from "./found";
import type { GateHolding } from "./gate-holding";
import type { TypeQueries } from "./type-queries";

export interface FileScan {
  project: Project;
  path: string;
  sourceFile: SourceFile;
  found: Found;
  allowances: Allowances;
  types: TypeQueries;
  gate: GateHolding;
  where(node: Node): string;
  whereAt(position: number): string;
}

export type Rules = (scan: FileScan) => string[];
