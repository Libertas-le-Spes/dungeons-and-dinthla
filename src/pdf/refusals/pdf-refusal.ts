export class PdfRefusal extends Error {
  constructor(readonly reason: string) {
    super(reason);
    this.name = "PdfRefusal";
  }
}
