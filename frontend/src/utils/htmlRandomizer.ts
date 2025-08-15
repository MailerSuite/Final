import RandExp from "randexp";

export function randomizeContent(text: string): string {
  let result = "";
  for (let i = 0; i < text.length; ) {
    const char = text[i];
    if (char === "{") {
      const end = text.indexOf("}", i);
      if (end !== -1) {
        const choices = text.slice(i + 1, end).split("|");
        result += choices[Math.floor(Math.random() * choices.length)] || "";
        i = end + 1;
        continue;
      }
    }
    if (char === "[") {
      let j = i;
      while (j < text.length && text[j] !== "]") j++;
      if (j < text.length) {
        let pattern = text.slice(i, j + 1);
        j++;
        const quantMatch = text.slice(j).match(/^(\{\d+(?:,\d+)?\}|[+*?])/);
        if (quantMatch) {
          pattern += quantMatch[1];
          j += quantMatch[1].length;
        }
        try {
          result += new RandExp(pattern).gen();
        } catch {
          result += pattern;
        }
        i = j;
        continue;
      }
    }
    result += char;
    i++;
  }
  return result;
}

export function validatePlaceholders(text: string): boolean {
  try {
    for (let i = 0; i < text.length; ) {
      const char = text[i];
      if (char === "{") {
        const end = text.indexOf("}", i);
        if (end === -1) return false;
        const choices = text.slice(i + 1, end).split("|");
        if (choices.length < 2 || choices.some((c) => c === "")) return false;
        i = end + 1;
        continue;
      }
      if (char === "[") {
        let j = i;
        while (j < text.length && text[j] !== "]") j++;
        if (j >= text.length) return false;
        let pattern = text.slice(i, j + 1);
        j++;
        const quantMatch = text.slice(j).match(/^(\{\d+(?:,\d+)?\}|[+*?])/);
        if (quantMatch) {
          pattern += quantMatch[1];
          j += quantMatch[1].length;
        }
        new RandExp(pattern); // verify
        i = j;
        continue;
      }
      i++;
    }
    return true;
  } catch {
    return false;
  }
}
