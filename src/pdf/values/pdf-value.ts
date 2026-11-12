import type { PdfArray } from "./pdf-array";
import type { PdfDictionary } from "./pdf-dictionary";
import type { PdfReference } from "./scalars/pdf-reference";
import type { PdfStream } from "./pdf-stream";

export abstract class PdfValue {
  isPresent(): boolean {
    return true;
  }

  asDictionary(): PdfDictionary | null {
    return null;
  }

  asArray(): PdfArray | null {
    return null;
  }

  asName(): string | null {
    return null;
  }

  asInteger(): number | null {
    return null;
  }

  asReference(): PdfReference | null {
    return null;
  }

  asStream(): PdfStream | null {
    return null;
  }

  asText(): string | null {
    return null;
  }
}
