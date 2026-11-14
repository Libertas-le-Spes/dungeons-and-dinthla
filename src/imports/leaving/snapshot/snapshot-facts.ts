export interface Leaving {
  readonly how: string;
  readonly day: string;
  readonly sessionLink: string | null;
  readonly lastDoing: string | null;
}

export interface Held {
  readonly questions: readonly string[];
  readonly quests: readonly string[];
  readonly coins: readonly string[];
  readonly items: readonly string[];
}
