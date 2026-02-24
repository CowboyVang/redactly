import { FolderOpen, Trash2, Sun, Moon, Keyboard } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { Button, Badge, Separator, Tooltip, TooltipTrigger, TooltipContent } from "../ui";
import { useTheme } from "../../hooks/useTheme";

interface SessionSectionProps {
  hasSession: boolean;
  onOpenDir: (dir: string) => void;
  onClearSession: () => void;
  onOpenShortcuts?: () => void;
}

export function SessionSection({ hasSession, onOpenDir, onClearSession, onOpenShortcuts }: SessionSectionProps) {
  const { theme, toggleTheme } = useTheme();

  async function handleOpenDir() {
    const selected = await open({ directory: true, multiple: false });
    if (selected) {
      onOpenDir(selected as string);
    }
  }

  return (
    <div>
      <div className="mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Session
          </h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="font-mono text-[10px] font-semibold uppercase tracking-wider">
                {hasSession && (
                  <span
                    className="size-1.5 rounded-full bg-[var(--sr-green)]"
                    style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
                  />
                )}
                {hasSession ? "Active" : "Idle"}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {hasSession ? "Redaction session in progress" : "No active redaction session"}
            </TooltipContent>
          </Tooltip>
          <div className="ml-auto flex items-center gap-0.5">
            {onOpenShortcuts && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="xs" onClick={onOpenShortcuts} className="size-6 p-0">
                    <Keyboard className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Keyboard shortcuts</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="xs" onClick={toggleTheme} className="size-6 p-0">
                  {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <Separator className="mt-1.5" />
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={handleOpenDir} className="flex-1">
          <FolderOpen className="size-3.5" />
          Open Dir
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSession}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
          Clear
        </Button>
      </div>
    </div>
  );
}
