import type { Allowances } from "../reading/allowances";
import { NOTHING_ALLOWED } from "./allowance-sets";
import { ROOT, VIRTUAL_FOLDER } from "./scan-paths";
import { virtualFileSystem } from "./virtual-files";
import { SourceScanner } from "./source-scanner";

export class SampleScan {
  private readonly folder: string;
  private readonly scanner: SourceScanner;

  constructor(
    family: string,
    private readonly samples: string[],
  ) {
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
    return `${this.folder}/sample-${index}.ts`;
  }

  private files(): Map<string, string> {
    const files = new Map<string, string>(this.samples.map((sample, index) => [this.samplePath(index), sample]));
    const names = this.samples.map((_sample, index) => `sample-${index}.ts`);
    files.set(this.project(), JSON.stringify({ extends: "../../../../tsconfig.json", files: names, include: [] }));
    return files;
  }
}
