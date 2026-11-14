export const AGREEMENT_TITLE = "Fetch your character from D&D Beyond?";

export const AGREEMENT_PARAGRAPHS: readonly string[] = [
  "To bring your character in, this plugin sends one message to one address, character-service.dndbeyond.com. The message holds your character's number and nothing else. This plugin adds no login, cookies or other headers of its own, and it never touches your D&D Beyond account. Obsidian sends the message and may add its own details and follow redirects.",
  "Your character has to be set to Public on D&D Beyond. A public character's backstory and notes can be read by anyone who has the link, not only by this plugin. The plugin throws them away before it reads anything and never saves them in your vault.",
  "You are asked this once on this device. After you continue, the button fetches only when you press it. If you would rather send nothing, bring your character in with its PDF instead.",
];

export const CONTINUE_WORDS = "Continue";
export const USE_A_PDF_WORDS = "Use a PDF instead";
export const AGREE_WORDS = "Agree";
export const NOT_YET_WORDS = "Not yet";
