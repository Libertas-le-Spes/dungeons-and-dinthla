export interface RuleModifier {
  readonly type: string;
  readonly subType: string;
  readonly value: number | null;
  readonly restriction: string;
  readonly sourceName: string;
  readonly appliesNow: boolean;
}
