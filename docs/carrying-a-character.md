# Carrying a character into another campaign

A character can take their values with them into a new campaign. Add two properties to their note in the new campaign:

```markdown
---
carried from: "[[Ashen Road/Characters/Mira]]"
carried: [abilities, values]
---
```

`carried from` links to the character's note in the old campaign. `carried` says what comes along: `abilities` for the six ability scores, `values` for everything else on the sheet. Anything learned in the new campaign takes the place of a carried value.
