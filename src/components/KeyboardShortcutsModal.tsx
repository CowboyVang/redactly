import { useState, useEffect, useCallback } from "react";
import { RotateCcw } from "lucide-react";
import type { ShortcutBinding } from "../hooks/useKeyboardShortcuts";
import { formatKeys } from "../hooks/useKeyboardShortcuts";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Button, Badge,
} from "./ui";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
  bindings: ShortcutBinding[];
  onUpdateBinding: (id: string, keys: string[]) => void;
  onResetBindings: () => void;
}

function keysFromEvent(e: KeyboardEvent): string[] | null {
  // Ignore bare modifier presses
  if (["Meta", "Shift", "Alt", "Control"].includes(e.key)) return null;

  const keys: string[] = [];
  if (e.metaKey || e.ctrlKey) keys.push("Meta");
  if (e.shiftKey) keys.push("Shift");
  if (e.altKey) keys.push("Alt");

  keys.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
  return keys;
}

export function KeyboardShortcutsModal({ open, onClose, bindings, onUpdateBinding, onResetBindings }: KeyboardShortcutsModalProps) {
  const [rebindingId, setRebindingId] = useState<string | null>(null);

  const handleCapture = useCallback((e: KeyboardEvent) => {
    if (!rebindingId) return;
    e.preventDefault();
    e.stopPropagation();

    if (e.key === "Escape") {
      setRebindingId(null);
      return;
    }

    const keys = keysFromEvent(e);
    if (keys) {
      onUpdateBinding(rebindingId, keys);
      setRebindingId(null);
    }
  }, [rebindingId, onUpdateBinding]);

  useEffect(() => {
    if (!rebindingId) return;
    window.addEventListener("keydown", handleCapture, true);
    return () => window.removeEventListener("keydown", handleCapture, true);
  }, [rebindingId, handleCapture]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setRebindingId(null); onClose(); } }}>
      <DialogContent className="max-w-sm gap-5">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Click a shortcut to rebind it. Press Escape to cancel.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1">
          {bindings.map((binding) => (
            <button
              key={binding.id}
              onClick={() => setRebindingId(binding.id)}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted/50"
            >
              <span className="text-foreground">{binding.label}</span>
              {rebindingId === binding.id ? (
                <Badge variant="secondary" className="animate-pulse font-mono text-xs">
                  Press keys...
                </Badge>
              ) : (
                <span className="flex items-center gap-0.5">
                  {formatKeys(binding.keys).map((k, i) => (
                    <kbd
                      key={i}
                      className="inline-flex min-w-[1.5rem] items-center justify-center rounded border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
                    >
                      {k}
                    </kbd>
                  ))}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onResetBindings} className="text-muted-foreground">
            <RotateCcw className="size-3" />
            Reset to defaults
          </Button>
          <div className="flex-1" />
          <Button variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
