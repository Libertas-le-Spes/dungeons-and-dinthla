import type { PdfValue } from "../../../src/pdf/values/pdf-value";
import { PdfNull } from "../../../src/pdf/values/pdf-null";
import type { ObjectLoading } from "../../../src/pdf/xref/xref-entry";

export class RecordingLoading implements ObjectLoading {
  offsets: number[] = [];
  generations: number[] = [];
  containers: number[] = [];
  indexes: number[] = [];

  readInFile(_number: number, generation: number, offset: number): PdfValue {
    this.offsets.push(offset);
    this.generations.push(generation);
    return PdfNull.NULL;
  }

  readCompressed(_number: number, container: number, index: number): PdfValue {
    this.containers.push(container);
    this.indexes.push(index);
    return PdfNull.NULL;
  }
}
