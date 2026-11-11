import { relative } from "node:path";
import type { Allowances } from "../reading/allowances";
import { NOTHING_ALLOWED } from "./allowance-sets";
import { ROOT, VIRTUAL_FOLDER } from "../reading/scan-paths";
import { virtualFileSystem } from "./virtual-files";
import { SourceScanner } from "./source-scanner";

export function extendsRootConfig(folder: string): string {
  return `${relative(folder, ROOT)}/tsconfig.json`;
}

export function numberedFileNames(samples: string[]): string[] {
  return samples.map((_sample, index) => `sample-${index}.ts`);
}

export class SampleScan {
  private readonly folder: string;
  private readonly scanner: SourceScanner;

  constructor(
    family: string,
    private readonly samples: string[],
    private readonly fileNames: string[],
  ) {
    if (fileNames.length !== samples.length) throw new Error(`${samples.length} samples were given ${fileNames.length} file names.`);
    this.folder = `${VIRTUAL_FOLDER}/${family}`;
    this.scanner = new SourceScanner(ROOT, virtualFileSystem(VIRTUAL_FOLDER, this.files()));
  }

  breaches(sample: string, allowances: Allowances = NOTHING_ALLOWED): string[] {
    return this.scanner.breaches(this.project(), [this.samplePath(this.samples.indexOf(sample))], allowances);
  }

  close(): void {
    this.scanner.close();
  }

  private project(): string {
    return `${this.folder}/tsconfig.json`;
  }

  private samplePath(index: number): string {
    const name = this.fileNames[index];
    if (name === undefined) throw new Error(`Sample ${index} has no file name.`);
    return `${this.folder}/${name}`;
  }

  private files(): Map<string, string> {
    const files = new Map<string, string>(this.samples.map((sample, index) => [this.samplePath(index), sample]));
    files.set(this.project(), JSON.stringify({ extends: extendsRootConfig(this.folder), files: this.fileNames, include: [] }));
    return files;
  }
}
