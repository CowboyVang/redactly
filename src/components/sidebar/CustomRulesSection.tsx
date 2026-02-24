import { useState } from "react";
import { ChevronRight, Download, Upload, Settings, X } from "lucide-react";
import type { KeywordCategory } from "../../types";
import { CATEGORY_COLORS } from "../../constants";
import { Button, Input, SectionHeader, Tooltip, TooltipTrigger, TooltipContent } from "../ui";
import { cn } from "@/lib/utils";

interface CustomRulesSectionProps {
  categories: KeywordCategory[];
  onOpenCustomRuleModal: (index: number) => void;
  onAddCategory: (name: string) => void;
  onRemoveCategory: (index: number) => void;
  onAddKeyword: (categoryIndex: number, term: string) => void;
  onRemoveKeyword: (categoryIndex: number, keywordIndex: number) => void;
  onImportCategories?: () => void;
  onExportCategories?: () => void;
}

export function CustomRulesSection({
  categories,
  onOpenCustomRuleModal,
  onAddCategory,
  onRemoveCategory,
  onAddKeyword,
  onRemoveKeyword,
  onImportCategories,
  onExportCategories,
}: CustomRulesSectionProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newKeywords, setNewKeywords] = useState<Record<number, string>>({});
  const [expandedCats, setExpandedCats] = useState<Set<number>>(new Set());

  function toggleCategory(index: number) {
    const next = new Set(expandedCats);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setExpandedCats(next);
  }

  function handleAddCategory() {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName("");
    }
  }

  function handleAddKeyword(catIndex: number) {
    const term = newKeywords[catIndex]?.trim();
    if (term) {
      onAddKeyword(catIndex, term);
      setNewKeywords((prev) => ({ ...prev, [catIndex]: "" }));
    }
  }

  return (
    <div>
      <SectionHeader bordered>
        <span className="flex items-center justify-between">
          Custom Rules
          <span className="flex items-center gap-0.5">
            {onImportCategories && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onImportCategories}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Upload className="size-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Import keywords</TooltipContent>
              </Tooltip>
            )}
            {categories.length > 0 && onExportCategories && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onExportCategories}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Download className="size-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export keywords</TooltipContent>
              </Tooltip>
            )}
          </span>
        </span>
      </SectionHeader>

      {categories.map((cat, catIndex) => (
        <div key={catIndex} className="mb-1">
          <button
            onClick={() => toggleCategory(catIndex)}
            className={cn(
              "flex h-8 w-full cursor-pointer items-center gap-2 rounded-md border-l-[3px] px-3 text-left text-sm font-medium transition-colors hover:bg-muted/50",
              expandedCats.has(catIndex) ? "bg-muted/50" : "bg-transparent"
            )}
            style={{ borderLeftColor: CATEGORY_COLORS[catIndex % CATEGORY_COLORS.length] }}
          >
            <span className="flex-1">
              {cat.name}{" "}
              <span className="text-muted-foreground">({cat.keywords.length})</span>
            </span>
            <ChevronRight
              className={cn(
                "size-3 text-muted-foreground transition-transform",
                expandedCats.has(catIndex) && "rotate-90"
              )}
            />
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => { e.stopPropagation(); onOpenCustomRuleModal(catIndex); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => { e.stopPropagation(); onRemoveCategory(catIndex); }}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="size-3" />
            </Button>
          </button>

          {expandedCats.has(catIndex) && (
            <div className="pl-4 pt-1">
              {cat.keywords.map((kw, kwIndex) => (
                <div key={kwIndex} className="flex h-7 items-center gap-1 text-xs">
                  <span className="flex-1 truncate font-mono">
                    {kw.term}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onRemoveKeyword(catIndex, kwIndex)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-2.5" />
                  </Button>
                </div>
              ))}
              <div className="mt-1 flex gap-1">
                <Input
                  placeholder="Add keyword..."
                  value={newKeywords[catIndex] || ""}
                  onChange={(e) => setNewKeywords((prev) => ({ ...prev, [catIndex]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddKeyword(catIndex); }}
                  className="h-6 flex-1 font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>
      ))}

      {categories.length === 0 && (
        <p className="px-1 py-2 text-xs italic text-muted-foreground/70">
          Add keyword categories to redact specific terms
        </p>
      )}

      {/* Add category */}
      <div className="mt-2 flex gap-1">
        <Input
          placeholder="New category..."
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); }}
          className="h-7 flex-1 text-xs"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="xs" onClick={handleAddCategory}>
              +
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add category</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
