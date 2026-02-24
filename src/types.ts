export type PatternType = "Email" | "Username" | "Hostname" | "Ip" | "Path" | "Mac" | "Phone" | "Url";

export type DetectionSource =
  | { Keyword: { category: string } }
  | { Pattern: { pattern_type: PatternType; classification: string | null } };

export interface RedactionMapping {
  token: string;
  original: string;
  source: DetectionSource;
}

export interface RedactionResult {
  redacted_text: string;
  mappings: RedactionMapping[];
  detection_count: number;
}

export type FuzzyLevel = "Off" | "Low" | "Medium" | "High";

export interface KeywordEntry {
  term: string;
  variants: boolean;
  fuzzy: FuzzyLevel;
}

export interface KeywordCategory {
  name: string;
  keywords: KeywordEntry[];
}

export interface ClassificationRule {
  pattern: string;
  label: string;
}

export interface PatternConfig {
  enabled: boolean;
  rules: ClassificationRule[];
}

export interface AutoDetectOptions {
  email: PatternConfig;
  ip: PatternConfig;
  hostname: PatternConfig;
  path: PatternConfig;
  username: PatternConfig;
  mac: PatternConfig;
  phone: PatternConfig;
  url: PatternConfig;
}

export interface RedactOptions {
  auto_detect: AutoDetectOptions;
}
