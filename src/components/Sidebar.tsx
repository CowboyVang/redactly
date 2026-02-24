import type { AutoDetectOptions, KeywordCategory } from "../types";
import type { PatternKey } from "../constants";
import { CustomRulesSection } from "./sidebar/CustomRulesSection";
import { AutoDetectSection } from "./sidebar/AutoDetectSection";
import { SessionSection } from "./sidebar/SessionSection";
import { ScrollArea, Separator } from "./ui";

interface SidebarProps {
  categories: KeywordCategory[];
  autoDetect: AutoDetectOptions;
  onTogglePattern: (key: PatternKey) => void;
  onOpenRuleModal: (key: PatternKey) => void;
  onOpenCustomRuleModal: (index: number) => void;
  onAddCategory: (name: string) => void;
  onRemoveCategory: (index: number) => void;
  onAddKeyword: (categoryIndex: number, term: string) => void;
  onRemoveKeyword: (categoryIndex: number, keywordIndex: number) => void;
  onImportCategories: () => void;
  onExportCategories: () => void;
  onOpenDir: (dir: string) => void;
  onClearSession: () => void;
  hasSession: boolean;
  onOpenShortcuts?: () => void;
}

export function Sidebar({
  categories,
  autoDetect,
  onTogglePattern,
  onOpenRuleModal,
  onOpenCustomRuleModal,
  onAddCategory,
  onRemoveCategory,
  onAddKeyword,
  onRemoveKeyword,
  onImportCategories,
  onExportCategories,
  onOpenDir,
  onClearSession,
  hasSession,
  onOpenShortcuts,
}: SidebarProps) {
  return (
    <aside
      data-slot="sidebar"
      className="flex h-full w-[280px] min-w-[280px] flex-col border-r border-sidebar-border bg-sidebar shadow-[2px_0_8px_-2px_rgba(0,0,0,0.3)]"
    >
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-4 pt-3">
          <CustomRulesSection
            categories={categories}
            onOpenCustomRuleModal={onOpenCustomRuleModal}
            onAddCategory={onAddCategory}
            onRemoveCategory={onRemoveCategory}
            onAddKeyword={onAddKeyword}
            onRemoveKeyword={onRemoveKeyword}
            onImportCategories={onImportCategories}
            onExportCategories={onExportCategories}
          />
          <Separator className="my-3" />
          <AutoDetectSection
            autoDetect={autoDetect}
            onTogglePattern={onTogglePattern}
            onOpenRuleModal={onOpenRuleModal}
          />
        </div>
      </ScrollArea>
      <div className="border-t border-sidebar-border p-4">
        <SessionSection
          hasSession={hasSession}
          onOpenDir={onOpenDir}
          onClearSession={onClearSession}
          onOpenShortcuts={onOpenShortcuts}
        />
      </div>
    </aside>
  );
}
