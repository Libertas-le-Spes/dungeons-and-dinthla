export interface SwitchChoice {
  readonly words: string;
  run(typedLastDoing: string): Promise<boolean>;
}
