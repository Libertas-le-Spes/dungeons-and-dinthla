export interface PlannedWrite {
  readonly done: string;
  readonly failed: string;
  apply(): Promise<void>;
}
