export interface PropertiesSpan {
  readonly exists: boolean;
  readonly from: number;
  readonly to: number;
  readonly contentStart: number;
  readonly text: string;
}

export interface NoteSyntax {
  propertiesIn(text: string): PropertiesSpan;
  readProperties(text: string): unknown;
  linkPathOf(linkText: string): string;
}
