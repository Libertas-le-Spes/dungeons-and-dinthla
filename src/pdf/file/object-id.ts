export interface ObjectId {
  accepts(number: number, generation: number): boolean;
}

export class ExactId implements ObjectId {
  constructor(
    private readonly number: number,
    private readonly generation: number,
  ) {}

  accepts(number: number, generation: number): boolean {
    return number === this.number && generation === this.generation;
  }
}

export class AnyId implements ObjectId {
  accepts(): boolean {
    return true;
  }
}
