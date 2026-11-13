export interface BlockState {
  readonly allowsHeading: boolean;
  readonly isClosed: boolean;
  after(line: string): BlockState;
}
