export const TOKEN_REGEX_SOURCE = "\\{[A-Z_]+-\\d+\\}";

export function createTokenRegex(): RegExp {
  return new RegExp(TOKEN_REGEX_SOURCE, "g");
}

export function countTokens(text: string): number {
  const matches = text.match(createTokenRegex());
  return matches ? matches.length : 0;
}

export function findTokens(text: string): string[] {
  return text.match(createTokenRegex()) || [];
}
