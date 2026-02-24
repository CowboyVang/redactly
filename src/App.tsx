import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Shield, RotateCcw } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { RedactPanel } from "./components/RedactPanel";
import { RestorePanel } from "./components/RestorePanel";
import { MappingTable } from "./components/MappingTable";
import { RuleModal } from "./components/RuleModal";
import { CustomRuleModal } from "./components/CustomRuleModal";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";
import { useRedact } from "./hooks/useRedact";
import { useKeywords } from "./hooks/useKeywords";
import { useAutoDetect } from "./hooks/useAutoDetect";
import { useKeyboardShortcuts, matchesShortcut, isTypingTarget } from "./hooks/useKeyboardShortcuts";
import { TooltipProvider } from "./components/ui";
import { cn } from "@/lib/utils";
import type { PatternKey } from "./constants";

type Tab = "redact" | "restore";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("redact");
  const [ruleModalPattern, setRuleModalPattern] = useState<PatternKey | null>(null);
  const [customRuleCatIndex, setCustomRuleCatIndex] = useState<number | null>(null);
  const [redactInput, setRedactInput] = useState("");
  const [restoreInput, setRestoreInput] = useState("");
  const [restoreOutput, setRestoreOutput] = useState("");
  const [mappingCollapsed, setMappingCollapsed] = useState(true);
  const [mappingHeight, setMappingHeight] = useState(200);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  const {
    config: autoDetect,
    togglePattern,
    addRule,
    removeRule,
  } = useAutoDetect();

  const {
    result,
    mappings,
    loading,
    error,
    redact,
    restore,
    clearSession,
    openWorkspaceDir,
    removeMapping,
    exportMappings,
  } = useRedact();

  const {
    categories,
    addCategory,
    removeCategory,
    addKeyword,
    removeKeyword,
    saveCategories,
    importCategories,
    exportCategories,
  } = useKeywords();

  const { bindings, updateBinding, resetBindings } = useKeyboardShortcuts();

  useEffect(() => {
    if (mappings.length > 0) setMappingCollapsed(false);
  }, [mappings.length]);

  const handleRedact = useCallback(
    (text: string) => redact(text, { auto_detect: autoDetect }),
    [redact, autoDetect]
  );

  const handleRestore = useCallback(async (text: string) => {
    const restored = await restore(text);
    if (restored !== null) setRestoreOutput(restored);
    return restored;
  }, [restore]);

  // Ref to access latest result for copy-output shortcut
  const resultRef = useRef(result);
  resultRef.current = result;
  const restoreOutputRef = useRef(restoreOutput);
  restoreOutputRef.current = restoreOutput;

  const shortcutActions = useMemo(() => ({
    "tab-redact": () => setActiveTab("redact"),
    "tab-restore": () => setActiveTab("restore"),
    "copy-output": async () => {
      const text = activeTab === "redact"
        ? resultRef.current?.redacted_text
        : restoreOutputRef.current;
      if (text) await navigator.clipboard.writeText(text);
    },
  }), [activeTab]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Skip redact-restore — handled by panels (with auto-copy)
      for (const binding of bindings) {
        if (binding.id === "redact-restore") continue;
        if (matchesShortcut(e, binding.keys)) {
          // Typing guard: skip non-Meta shortcuts when in input/textarea
          if (!binding.keys.some((k) => k === "Meta") && isTypingTarget(e)) continue;
          const action = shortcutActions[binding.id as keyof typeof shortcutActions];
          if (action) {
            e.preventDefault();
            action();
            return;
          }
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [bindings, shortcutActions]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "redact", label: "Redact", icon: <Shield className="size-4" /> },
    { key: "restore", label: "Restore", icon: <RotateCcw className="size-4" /> },
  ];

  return (
    <TooltipProvider>
      <div className="flex h-screen w-screen overflow-hidden">
        <Sidebar
          categories={categories}
          autoDetect={autoDetect}
          onTogglePattern={togglePattern}
          onOpenRuleModal={setRuleModalPattern}
          onOpenCustomRuleModal={setCustomRuleCatIndex}
          onAddCategory={addCategory}
          onRemoveCategory={removeCategory}
          onAddKeyword={addKeyword}
          onRemoveKeyword={removeKeyword}
          onImportCategories={importCategories}
          onExportCategories={exportCategories}
          onOpenDir={openWorkspaceDir}
          onClearSession={clearSession}
          hasSession={mappings.length > 0}
          onOpenShortcuts={() => setShortcutsModalOpen(true)}
        />

        <main className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
          {/* Tab bar */}
          <div className="flex border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === tab.key
                    ? "border-b-[3px] border-primary text-foreground"
                    : "border-b border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex flex-1 flex-col overflow-auto" style={{ minHeight: 0 }}>
            <div key={activeTab} className="flex flex-1 flex-col animate-in fade-in duration-150" style={{ minHeight: 0 }}>
            {activeTab === "redact" ? (
              <RedactPanel
                onRedact={handleRedact}
                result={result}
                loading={loading}
                error={error}
                input={redactInput}
                onInputChange={setRedactInput}
                mappings={mappings}
              />
            ) : (
              <RestorePanel
                onRestore={handleRestore}
                loading={loading}
                error={error}
                input={restoreInput}
                onInputChange={setRestoreInput}
              />
            )}
            </div>

            {/* Mappings as a panel section */}
            <MappingTable
              mappings={mappings}
              collapsed={mappingCollapsed}
              onToggleCollapse={() => setMappingCollapsed((c) => !c)}
              height={mappingHeight}
              onHeightChange={setMappingHeight}
              onExportMappings={exportMappings}
              onRemoveMapping={removeMapping}
            />
          </div>
        </main>

        {ruleModalPattern && (
          <RuleModal
            patternKey={ruleModalPattern}
            config={autoDetect}
            onAddRule={addRule}
            onRemoveRule={removeRule}
            onClose={() => setRuleModalPattern(null)}
          />
        )}

        {customRuleCatIndex !== null && (
          <CustomRuleModal
            category={categories[customRuleCatIndex]}
            categoryIndex={customRuleCatIndex}
            onSave={(updated) => {
              const newCategories = [...categories];
              newCategories[customRuleCatIndex] = updated;
              saveCategories(newCategories);
            }}
            onClose={() => setCustomRuleCatIndex(null)}
          />
        )}

        <KeyboardShortcutsModal
          open={shortcutsModalOpen}
          onClose={() => setShortcutsModalOpen(false)}
          bindings={bindings}
          onUpdateBinding={updateBinding}
          onResetBindings={resetBindings}
        />
      </div>
    </TooltipProvider>
  );
}

export default App;
