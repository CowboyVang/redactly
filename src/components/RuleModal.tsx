import { useState } from "react";
import { X, Info, ClipboardList } from "lucide-react";
import type { AutoDetectOptions, ClassificationRule } from "../types";
import type { PatternKey } from "../constants";
import { PATTERN_LABELS, TOKEN_PREFIX, PATTERN_HINTS } from "../constants";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Button, Input, SectionHeader, Card, CardContent,
} from "./ui";

interface RuleModalProps {
  patternKey: PatternKey;
  config: AutoDetectOptions;
  onAddRule: (key: PatternKey, rule: ClassificationRule) => void;
  onRemoveRule: (key: PatternKey, index: number) => void;
  onClose: () => void;
}

export function RuleModal({ patternKey, config, onAddRule, onRemoveRule, onClose }: RuleModalProps) {
  const [pattern, setPattern] = useState("");
  const [label, setLabel] = useState("");

  const rules = config[patternKey].rules;
  const hint = PATTERN_HINTS[patternKey];
  const prefix = TOKEN_PREFIX[patternKey];

  function formatLabel(raw: string): string {
    return raw.toUpperCase().replace(/\s+/g, "_");
  }

  function getPreview(): string {
    const formatted = formatLabel(label);
    return formatted ? `{${formatted}_${prefix}-1}` : `{${prefix}-1}`;
  }

  function handleAdd() {
    const trimmedPattern = pattern.trim();
    const trimmedLabel = formatLabel(label.trim());
    if (trimmedPattern && trimmedLabel) {
      onAddRule(patternKey, { pattern: trimmedPattern, label: trimmedLabel });
      setPattern("");
      setLabel("");
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md gap-6">
        <DialogHeader>
          <DialogTitle>Auto-Detect Rules: {PATTERN_LABELS[patternKey]}</DialogTitle>
          <DialogDescription>
            Add classification rules to organize detected tokens by context.
          </DialogDescription>
        </DialogHeader>

        {/* Classification Rules */}
        <div>
          <SectionHeader>Classification Rules</SectionHeader>
          {rules.length > 0 ? (
            <div className="flex flex-col gap-1">
              {rules.map((rule, index) => (
                <div
                  key={index}
                  className="flex h-8 items-center gap-3 rounded-md border border-l-[3px] border-l-primary bg-secondary px-3"
                >
                  <span className="flex-1 truncate font-mono text-sm">
                    {rule.pattern}
                  </span>
                  <span className="font-mono text-sm font-medium text-primary">
                    {rule.label}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onRemoveRule(patternKey, index)}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
              <ClipboardList className="size-3.5" />
              No custom rules yet
            </div>
          )}
        </div>

        {/* Add Rule Form */}
        <div>
          <SectionHeader>Add Rule</SectionHeader>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Pattern</label>
              <Input
                placeholder={hint.pattern}
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                className="h-8 font-mono text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Label</label>
              <Input
                placeholder={hint.label}
                value={label}
                onChange={(e) => setLabel(formatLabel(e.target.value))}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                className="h-8 font-mono text-sm"
              />
            </div>
            <div className="rounded-md border border-dashed bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
              Preview: {getPreview()}
            </div>
            <Button size="sm" onClick={handleAdd} className="self-start">
              Add Rule
            </Button>
          </div>
        </div>

        {/* How It Works */}
        <Card className="border-primary/20 bg-primary/10 py-3">
          <CardContent className="flex gap-2 px-4">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Classification rules add context labels to tokens. When a detected
              value matches a rule&apos;s pattern, its token includes the label. For
              example: {hint.preview}
            </p>
          </CardContent>
        </Card>

        <Button variant="secondary" onClick={onClose} className="w-full">
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}
