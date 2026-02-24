import type { AutoDetectOptions, FuzzyLevel } from "./types";

export type PatternKey = keyof AutoDetectOptions;

export const DEFAULT_AUTO_DETECT_CONFIG: AutoDetectOptions = {
  email: { enabled: true, rules: [] },
  ip: { enabled: true, rules: [] },
  hostname: { enabled: true, rules: [] },
  path: { enabled: true, rules: [] },
  username: { enabled: true, rules: [] },
  mac: { enabled: false, rules: [] },
  phone: { enabled: false, rules: [] },
  url: { enabled: false, rules: [] },
};

export const PATTERN_LABELS: Record<PatternKey, string> = {
  email: "Email",
  ip: "IP Address",
  hostname: "Hostname",
  path: "File Path",
  username: "Username",
  mac: "MAC Address",
  phone: "Phone",
  url: "URL",
};

export const TOKEN_PREFIX: Record<PatternKey, string> = {
  email: "EMAIL",
  ip: "IP",
  hostname: "HOST",
  path: "PATH",
  username: "USER",
  mac: "MAC",
  phone: "PHONE",
  url: "URL",
};

export const PATTERN_HINTS: Record<
  PatternKey,
  { pattern: string; label: string; preview: string }
> = {
  email: {
    pattern: "acme.com",
    label: "ACME",
    preview: "john@acme.com \u2192 {ACME_EMAIL-1}",
  },
  ip: {
    pattern: "10.0.0.0/8",
    label: "INTERNAL",
    preview: "10.50.1.20 \u2192 {INTERNAL_IP-1}",
  },
  hostname: {
    pattern: ".internal",
    label: "INTERNAL",
    preview: "server.internal \u2192 {INTERNAL_HOST-1}",
  },
  path: {
    pattern: "/home/admin",
    label: "ADMIN",
    preview: "/home/admin/file \u2192 {ADMIN_PATH-1}",
  },
  username: {
    pattern: "@johndoe",
    label: "ADMIN_USER",
    preview: "@johndoe \u2192 {ADMIN_USER_USER-1}",
  },
  mac: {
    pattern: "aa:bb:cc:dd:ee:ff",
    label: "DEVICE",
    preview: "aa:bb:cc:dd:ee:ff \u2192 {DEVICE_MAC-1}",
  },
  phone: {
    pattern: "+1-555",
    label: "US_OFFICE",
    preview: "+1-555-123-4567 \u2192 {US_OFFICE_PHONE-1}",
  },
  url: {
    pattern: "internal.corp",
    label: "INTERNAL",
    preview: "https://internal.corp/api \u2192 {INTERNAL_URL-1}",
  },
};

export const FUZZY_LEVELS: FuzzyLevel[] = ["Off", "Low", "Medium", "High"];

export const CATEGORY_COLORS = [
  "var(--sr-purple)",
  "var(--sr-orange)",
  "var(--sr-blue)",
  "var(--sr-mint)",
  "var(--sr-pink)",
  "var(--sr-green)",
  "var(--sr-yellow)",
  "var(--sr-red)",
];

export const AUTO_DETECT_TOGGLES: { key: PatternKey; label: string }[] = [
  { key: "email", label: "Email" },
  { key: "ip", label: "IP Address" },
  { key: "url", label: "URL" },
  { key: "mac", label: "MAC Address" },
  { key: "phone", label: "Phone" },
  { key: "hostname", label: "Hostname" },
  { key: "path", label: "File Path" },
  { key: "username", label: "Username" },
];
