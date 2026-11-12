import { ClassicSectionReader } from "./classic-section-reader";
import type { SectionReader } from "./section-reader";
import { StreamSectionReader } from "./stream-section-reader";

export const SECTION_READERS: readonly SectionReader[] = [new ClassicSectionReader(), new StreamSectionReader()];
