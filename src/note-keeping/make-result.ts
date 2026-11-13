export type MakeResult = "made" | "left" | "failed";

export interface MakeTally {
  made: number;
  failed: number;
}
