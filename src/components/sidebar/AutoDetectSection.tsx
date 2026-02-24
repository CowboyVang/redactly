import { useState } from "react";
import { ChevronRight, Settings } from "lucide-react";
import type { AutoDetectOptions } from "../../types";
import { AUTO_DETECT_TOGGLES, type PatternKey } from "../../constants";
import { Badge, Button, SectionHeader, ToggleSwitch } from "../ui";
import { cn } from "@/lib/utils";

interface AutoDetectSectionProps {
  autoDetect: AutoDetectOptions;
  onTogglePattern: (key: PatternKey) => void;
  onOpenRuleModal: (key: PatternKey) => void;
}

export function AutoDetectSection({ autoDetect, onTogglePattern, onOpenRuleModal }: AutoDetectSectionProps) {
  const [showDisabled, setShowDisabled] = useState(false);

  const enabledPatterns = AUTO_DETECT_TOGGLES.filter(({ key }) => autoDetect[key].enabled);
  const disabledPatterns = AUTO_DETECT_TOGGLES.filter(({ key }) => !autoDetect[key].enabled);

  return (
    <div>
      <SectionHeader bordered>Auto-Detect</SectionHeader>

      {/* Enabled patterns */}
      {enabledPatterns.map(({ key, label }) => (
        <div key={key} className="group flex h-8 items-center gap-2 px-2">
          <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm">
            <ToggleSwitch
              checked={true}
              onCheckedChange={() => onTogglePattern(key)}
            />
            {label}
          </label>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onOpenRuleModal(key)}
            className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
          >
            <Settings className="size-3" />
          </Button>
        </div>
      ))}

      {/* Collapsed disabled group */}
      {disabledPatterns.length > 0 && (
        <>
          <button
            onClick={() => setShowDisabled((s) => !s)}
            className={cn(
              "mt-1 flex h-8 w-full items-center gap-2 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-muted/50",
              showDisabled && "bg-muted/30"
            )}
          >
            <ChevronRight
              className={cn(
                "size-3 transition-transform",
                showDisabled && "rotate-90"
              )}
            />
            <span className="flex-1 text-left">Show disabled</span>
            <Badge variant="secondary" className="font-mono text-[10px]">
              {disabledPatterns.length}
            </Badge>
          </button>
          {showDisabled && disabledPatterns.map(({ key, label }) => (
            <div key={key} className="group flex h-8 items-center gap-2 px-2">
              <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <ToggleSwitch
                  checked={false}
                  onCheckedChange={() => onTogglePattern(key)}
                />
                {label}
              </label>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onOpenRuleModal(key)}
                className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
              >
                <Settings className="size-3" />
              </Button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
