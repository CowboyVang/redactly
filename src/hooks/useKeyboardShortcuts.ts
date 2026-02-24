import { useState, useCallback } from "react";

export interface ShortcutBinding {
  id: string;
  label: string;
  keys: string[];
}

const STORAGE_KEY = "redactly-keyboard-shortcuts";

export const DEFAULT_BINDINGS: ShortcutBinding[] = [
  { id: "redact-restore", label: "Redact / Restore", keys: ["Meta", "Enter"] },
  { id: "tab-redact", label: "Switch to Redact tab", keys: ["Meta", "1"] },
  { id: "tab-restore", label: "Switch to Restore tab", keys: ["Meta", "2"] },
  { id: "copy-output", label: "Copy output", keys: ["Meta", "Shift", "C"] },
];

function loadBindings(): ShortcutBinding[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ShortcutBinding[];
      // Merge with defaults to pick up any new bindings
      return DEFAULT_BINDINGS.map((def) => {
        const saved = parsed.find((b) => b.id === def.id);
        return saved ?? def;
      });
    }
  } catch {
    // ignore
  }
  return DEFAULT_BINDINGS;
}

function saveBindings(bindings: ShortcutBinding[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
}

export function matchesShortcut(e: KeyboardEvent, keys: string[]): boolean {
  const normalizedKeys = new Set(keys.map((k) => k.toLowerCase()));
  const needsMeta = normalizedKeys.has("meta");
  const needsShift = normalizedKeys.has("shift");
  const needsAlt = normalizedKeys.has("alt");

  if (needsMeta && !(e.metaKey || e.ctrlKey)) return false;
  if (!needsMeta && (e.metaKey || e.ctrlKey)) return false;
  if (needsShift !== e.shiftKey) return false;
  if (needsAlt !== e.altKey) return false;

  const mainKey = keys.find(
    (k) => !["Meta", "Shift", "Alt", "Control"].includes(k)
  );
  if (!mainKey) return false;

  return e.key.toLowerCase() === mainKey.toLowerCase();
}

export function isTypingTarget(e: KeyboardEvent): boolean {
  const tag = (e.target as HTMLElement)?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable === true;
}

export function formatKeys(keys: string[]): string[] {
  return keys.map((k) => {
    switch (k) {
      case "Meta": return "\u2318";
      case "Shift": return "\u21E7";
      case "Enter": return "\u21A9";
      case "Alt": return "\u2325";
      case "Control": return "\u2303";
      default: return k;
    }
  });
}

export function useKeyboardShortcuts() {
  const [bindings, setBindings] = useState<ShortcutBinding[]>(loadBindings);

  const updateBinding = useCallback((id: string, keys: string[]) => {
    setBindings((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, keys } : b));
      saveBindings(updated);
      return updated;
    });
  }, []);

  const resetBindings = useCallback(() => {
    setBindings(DEFAULT_BINDINGS);
    saveBindings(DEFAULT_BINDINGS);
  }, []);

  return { bindings, updateBinding, resetBindings, defaultBindings: DEFAULT_BINDINGS };
}
