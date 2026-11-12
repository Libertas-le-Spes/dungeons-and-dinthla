import { RefusedKey } from "../refusals/refused-key";
import { RefusedName } from "../refusals/refused-name";

export const REFUSED_CATALOG_KEYS: readonly RefusedKey[] = [
  new RefusedKey("OpenAction", "This PDF does something when it is opened, so it was not read."),
  new RefusedKey("AA", "This PDF runs actions for the whole document, so it was not read."),
  new RefusedKey("AF", "This PDF carries files inside it, so it was not read."),
];

export const REFUSED_NAMES_KEYS: readonly RefusedKey[] = [
  new RefusedKey("JavaScript", "This PDF carries a script for the whole document, so it was not read."),
  new RefusedKey("EmbeddedFiles", "This PDF carries files inside it, so it was not read."),
];

export const REFUSED_FORM_KEYS: readonly RefusedKey[] = [new RefusedKey("XFA", "This PDF carries a second copy of its form that could say something different, so it was not read.")];

export const REFUSED_PAGE_KEYS: readonly RefusedKey[] = [new RefusedKey("AA", "This PDF runs actions when a page opens, so it was not read.")];

export const REFUSED_OTHER_ANNOTATION_KEYS: readonly RefusedKey[] = [
  new RefusedKey("A", "This PDF has an action on something that is not a form field, so it was not read."),
  new RefusedKey("AA", "This PDF has actions on something that is not a form field, so it was not read."),
];

export const REFUSED_ANNOTATION_KINDS: readonly RefusedName[] = [
  new RefusedName("FileAttachment", "This PDF carries files inside it, so it was not read."),
  new RefusedName("RichMedia", "This PDF carries embedded media, so it was not read."),
  new RefusedName("Screen", "This PDF carries embedded media, so it was not read."),
  new RefusedName("Movie", "This PDF carries embedded media, so it was not read."),
  new RefusedName("Sound", "This PDF carries embedded media, so it was not read."),
  new RefusedName("3D", "This PDF carries embedded media, so it was not read."),
];

export const REFUSED_ACTION_KINDS: readonly RefusedName[] = [
  new RefusedName("Launch", "This PDF can open another program, so it was not read."),
  new RefusedName("URI", "This PDF can open a web address, so it was not read."),
  new RefusedName("SubmitForm", "This PDF can send its form somewhere, so it was not read."),
  new RefusedName("ImportData", "This PDF can pull in data from a file, so it was not read."),
  new RefusedName("GoToR", "This PDF can open another file, so it was not read."),
  new RefusedName("GoToE", "This PDF can open an embedded file, so it was not read."),
];
