import { RefusedKey } from "../refusals/refused-key";
import { RefusedName } from "../refusals/refused-name";

const OPENS = "This PDF does something when it is opened, so it was not read.";
const DOCUMENT_ACTIONS = "This PDF runs actions for the whole document, so it was not read.";
const DOCUMENT_SCRIPT = "This PDF carries a script for the whole document, so it was not read.";
const FILES = "This PDF carries files inside it, so it was not read.";
const MEDIA = "This PDF carries embedded media, so it was not read.";
const SECOND_FORM = "This PDF carries a second copy of its form that could say something different, so it was not read.";
const PAGE_ACTIONS = "This PDF runs actions when a page opens, so it was not read.";
const OTHER_ACTION = "This PDF has an action on something that is not a form field, so it was not read.";
const OTHER_ACTIONS = "This PDF has actions on something that is not a form field, so it was not read.";
const WEB_ADDRESS = "This PDF can open a web address, so it was not read.";

export const NOT_A_SCRIPT = "This PDF has an action that is not a script, so it was not read.";

export const REFUSED_CATALOG_KEYS: readonly RefusedKey[] = [new RefusedKey("OpenAction", OPENS), new RefusedKey("AA", DOCUMENT_ACTIONS), new RefusedKey("AF", FILES)];

export const REFUSED_NAMES_KEYS: readonly RefusedKey[] = [new RefusedKey("JavaScript", DOCUMENT_SCRIPT), new RefusedKey("EmbeddedFiles", FILES)];

export const REFUSED_FORM_KEYS: readonly RefusedKey[] = [new RefusedKey("XFA", SECOND_FORM)];

export const REFUSED_PAGE_KEYS: readonly RefusedKey[] = [new RefusedKey("AA", PAGE_ACTIONS)];

export const REFUSED_OTHER_ANNOTATION_KEYS: readonly RefusedKey[] = [new RefusedKey("A", OTHER_ACTION), new RefusedKey("AA", OTHER_ACTIONS)];

export const REFUSED_ACTION_KEYS: readonly RefusedKey[] = [new RefusedKey("URI", WEB_ADDRESS)];

export const REFUSED_ANNOTATION_KINDS: readonly RefusedName[] = [
  new RefusedName("FileAttachment", FILES),
  new RefusedName("RichMedia", MEDIA),
  new RefusedName("Screen", MEDIA),
  new RefusedName("Movie", MEDIA),
  new RefusedName("Sound", MEDIA),
  new RefusedName("3D", MEDIA),
];
