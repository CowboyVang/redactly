import { useState } from "react";
import { X, Search } from "lucide-react";
import type { KeywordCategory, KeywordEntry, FuzzyLevel } from "../types";
import { FUZZY_LEVELS } from "../constants";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Button, Input, SectionHeader, ToggleSwitch,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui";

interface CustomRuleModalProps {
  category: KeywordCategory;
  categoryIndex: number;
  onSave: (updated: KeywordCategory) => void;
  onClose: () => void;
}

export function CustomRuleModal({ category, categoryIndex: _categoryIndex, onSave, onClose }: CustomRuleModalProps) {
  const [name, setName] = useState(category.name);
  const [keywords, setKeywords] = useState<KeywordEntry[]>([...category.keywords]);
  const [newTerm, setNewTerm] = useState("");

  function handleSaveAndClose() {
    onSave({ name: name.trim() || category.name, keywords });
    onClose();
  }

  function updateKeyword(index: number, updates: Partial<KeywordEntry>) {
    const updated = [...keywords];
    updated[index] = { ...updated[index], ...updates };
    setKeywords(updated);
    onSave({ name: name.trim() || category.name, keywords: updated });
  }

  function removeKeyword(index: number) {
    const updated = keywords.filter((_, i) => i !== index);
    setKeywords(updated);
    onSave({ name: name.trim() || category.name, keywords: updated });
  }

  function addKeyword() {
    const term = newTerm.trim();
    if (!term) return;
    const updated = [...keywords, { term, variants: true, fuzzy: "Off" as FuzzyLevel }];
    setKeywords(updated);
    setNewTerm("");
    onSave({ name: name.trim() || category.name, keywords: updated });
  }

  function handleNameBlur() {
    const trimmed = name.trim();
    if (trimmed && trimmed !== category.name) {
      onSave({ name: trimmed, keywords });
    }
  }

  const tokenPrefix = (name.trim() || category.name).toUpperCase().replace(/\s+/g, "_");

  return (
    <Dialog open onOpenChange={(open) => { if (!open) handleSaveAndClose(); }}>
      <DialogContent className="max-w-md gap-6">
        <DialogHeader>
          <DialogTitle>Custom Rule Settings</DialogTitle>
          <DialogDescription>
            Configure keywords and matching behavior for this category.
          </DialogDescription>
        </DialogHeader>

        {/* Category name + token preview */}
        <div>
          <SectionHeader>Category Name</SectionHeader>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            className="h-8 font-mono text-sm"
          />
          <div className="mt-2 rounded-md border border-dashed bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
            Token: {`{${tokenPrefix}-N}`}
          </div>
        </div>

        {/* Keywords list */}
        <div>
          <SectionHeader>Keywords ({keywords.length})</SectionHeader>
          <div className="flex flex-col gap-2">
            {keywords.map((kw, index) => (
              <div
                key={index}
                className="rounded-md border border-l-[3px] border-l-primary bg-secondary p-2 px-3"
              >
                {/* Term + delete */}
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex-1 font-mono text-sm font-medium">
                    {kw.term}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeKeyword(index)}
                  >
                    <X className="size-3" />
                  </Button>
                </div>

                {/* Variants toggle + Fuzzy dropdown */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <label className="flex cursor-pointer items-center gap-2">
                    Variants
                    <ToggleSwitch
                      checked={kw.variants}
                      onCheckedChange={(v) => updateKeyword(index, { variants: v })}
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    Fuzzy
                    <Select
                      value={kw.fuzzy}
                      onValueChange={(v) => updateKeyword(index, { fuzzy: v as FuzzyLevel })}
                    >
                      <SelectTrigger size="sm" className="h-6 w-auto px-2 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FUZZY_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                </div>
              </div>
            ))}

            {keywords.length === 0 && (
              <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                <Search className="size-3.5" />
                No keywords yet
              </div>
            )}
          </div>
        </div>

        {/* Add keyword */}
        <div>
          <SectionHeader>Add Keyword</SectionHeader>
          <div className="flex gap-2">
            <Input
              placeholder="Enter keyword..."
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addKeyword(); }}
              className="h-8 flex-1 font-mono text-sm"
            />
            <Button size="sm" onClick={addKeyword}>
              Add
            </Button>
          </div>
        </div>

        <Button variant="secondary" onClick={handleSaveAndClose} className="w-full">
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}
