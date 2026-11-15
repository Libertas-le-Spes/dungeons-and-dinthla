export class CarryingSize {
  constructor(
    readonly name: string,
    readonly multiplier: number,
  ) {}
}

export const CARRYING_SIZES: readonly CarryingSize[] = [
  new CarryingSize("tiny", 0.5),
  new CarryingSize("small", 1),
  new CarryingSize("medium", 1),
  new CarryingSize("large", 2),
  new CarryingSize("huge", 4),
  new CarryingSize("gargantuan", 8),
];
