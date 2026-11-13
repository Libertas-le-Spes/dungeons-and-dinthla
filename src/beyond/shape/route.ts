export interface Route {
  readonly name: string;
  readonly source: string;
}

export class Online implements Route {
  readonly name = "online";
  readonly source = "Worked out here, from D&D Beyond (online)";
}

export class Pdf implements Route {
  readonly name = "pdf";
  readonly source = "Printed on D&D Beyond's PDF";
}
