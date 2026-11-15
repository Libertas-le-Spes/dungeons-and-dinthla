export interface Route {
  readonly name: string;
}

export class Online implements Route {
  readonly name = "online";
}

export class Pdf implements Route {
  readonly name = "pdf";
}
