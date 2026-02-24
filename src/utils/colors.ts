import type { RedactionMapping } from "../types";

export function getSourceColor(source: RedactionMapping["source"]): string {
  if ("Keyword" in source) return "var(--sr-purple)";
  const type = source.Pattern.pattern_type;
  switch (type) {
    case "Email": return "var(--sr-blue)";
    case "Ip": return "var(--sr-orange)";
    case "Hostname": return "var(--sr-mint)";
    case "Path": return "var(--sr-green)";
    case "Username": return "var(--sr-pink)";
    case "Mac": return "var(--sr-yellow)";
    case "Phone": return "var(--sr-red)";
    case "Url": return "var(--sr-blue)";
    default: return "var(--muted-foreground)";
  }
}

export function getTokenColor(token: string, mappings: RedactionMapping[]): string {
  const mapping = mappings.find((m) => m.token === token);
  if (!mapping) return "var(--sr-blue)";
  return getSourceColor(mapping.source);
}

export function getSourceLabel(source: RedactionMapping["source"]): string {
  if ("Keyword" in source) return `keyword (${source.Keyword.category})`;
  return `auto (${source.Pattern.pattern_type})`;
}
