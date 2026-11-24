export interface PropertiesSpan {
  readonly exists: boolean;
  readonly from: number;
  readonly to: number;
  readonly contentStart: number;
}

export interface NoteSyntax {
  propertiesIn(text: string): PropertiesSpan;
  readProperties(text: string): unknown;
  linkPathOf(linkText: string): string;
}
