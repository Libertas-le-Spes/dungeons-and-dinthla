import { PdfRefusal } from "./pdf-refusal";

export class RefusedName {
  constructor(
    private readonly name: string,
    private readonly words: string,
  ) {}

  check(name: string | null): void {
    if (name === this.name) throw new PdfRefusal(this.words);
  }
}

export function refuseNamed(name: string | null, names: readonly RefusedName[]): void {
  for (const refused of names) refused.check(name);
}
