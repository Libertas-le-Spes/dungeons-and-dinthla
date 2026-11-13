export interface PickedPdf {
  pdfPicked(bytes: Uint8Array): void;
  pdfRefused(reason: string): void;
}
