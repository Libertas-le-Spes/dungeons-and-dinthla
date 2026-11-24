export interface BeyondReplyText {
  readonly status: number;
  readonly text: string;
}

export interface BeyondCall {
  get(address: string): Promise<BeyondReplyText>;
}
