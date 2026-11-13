export interface Identity {
  readonly name: string;
  readonly species: string | null;
  readonly classes: string | null;
}

export interface Leaving {
  readonly standing: string;
  readonly how: string;
  readonly day: string;
  readonly sessionLink: string | null;
  readonly lastDoing: string | null;
}
