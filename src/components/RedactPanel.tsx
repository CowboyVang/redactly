import { useState, useEffect, useCallback } from "react";
import { Copy, Check, ClipboardPaste } from "lucide-react";
import type { RedactionResult, RedactOptions, RedactionMapping } from "../types";
import { getTokenColor } from "../utils/colors";
import { createTokenRegex } from "../utils/tokens";
import { Button, Badge, Textarea, ToggleSwitch, TokenPill } from "./ui";


function renderHighlightedText(text: string, mappings: RedactionMapping[]): React.ReactNode[] {
  const tokenRegex = createTokenRegex();
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    const color = getTokenColor(token, mappings);
    parts.push(<TokenPill key={match.index} token={token} color={color} />);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

interface RedactPanelProps {
  onRedact: (text: string, options?: Partial<RedactOptions>) => Promise<RedactionResult | null>;
  result: RedactionResult | null;
  loading: boolean;
  error: string | null;
  input: string;
  onInputChange: (value: string) => void;
  mappings: RedactionMapping[];
}

export function RedactPanel({ onRedact, result, loading, error, input, onInputChange, mappings }: RedactPanelProps) {
  const [copied, setCopied] = useState(false);
  const [autoCopy, setAutoCopy] = useState(() => localStorage.getItem("redactly-auto-copy") === "true");

  function handleAutoCopyChange(checked: boolean) {
    setAutoCopy(checked);
    localStorage.setItem("redactly-auto-copy", String(checked));
  }

  const handleRedactAndCopy = useCallback(async () => {
    if (!input.trim()) return;
    const res = await onRedact(input);
    if (autoCopy && res?.redacted_text) {
      await navigator.clipboard.writeText(res.redacted_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [input, onRedact, autoCopy]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleRedactAndCopy();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRedactAndCopy]);

  async function handleCopy() {
    if (result?.redacted_text) {
      await navigator.clipboard.writeText(result.redacted_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handlePaste() {
    const text = await navigator.clipboard.readText();
    if (text) onInputChange(text);
  }

  return (
    <div className="flex flex-1 flex-col gap-3" style={{ minHeight: 0 }}>
      {/* Side-by-side panels */}
      <div className="flex flex-1" style={{ minHeight: 0 }}>
        {/* Input */}
        <div className="flex flex-1 flex-col rounded-l-xl border border-r-0 bg-card p-4 shadow-[inset_0_1px_3px_0_var(--card-inset-shadow)]" style={{ minHeight: 0 }}>
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium uppercase leading-relaxed tracking-wider text-muted-foreground">
              Input
              <Button variant="ghost" size="icon-xs" onClick={handlePaste} className="text-muted-foreground hover:text-foreground">
                <ClipboardPaste className="size-3" />
              </Button>
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {input.length > 0 ? `${input.length} chars` : ""}
            </span>
          </div>
          <div className="relative flex flex-1 flex-col" style={{ minHeight: 0 }}>
            <Textarea
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Paste or type text here…"
              className="flex-1 resize-none font-mono text-sm focus-visible:ring-1 focus-visible:ring-ring/30"
              style={{ minHeight: 0 }}
            />
            {!input && (
              <span className="pointer-events-none absolute bottom-3 right-3 font-mono text-[10px] text-muted-foreground/50">
                ⌘↵ to redact
              </span>
            )}
          </div>
        </div>

        {/* Vertical divider */}
        <div className="w-[2px] shrink-0 bg-border" />

        {/* Output */}
        <div className="flex flex-1 flex-col rounded-r-xl border border-l-0 bg-card p-4 shadow-[inset_0_1px_3px_0_var(--card-inset-shadow)]" style={{ minHeight: 0 }}>
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-medium uppercase leading-relaxed tracking-wider text-muted-foreground">
              Redacted Output
              <span className="flex items-center gap-1 text-[10px] normal-case tracking-normal">
                <ToggleSwitch checked={autoCopy} onCheckedChange={handleAutoCopyChange} />
                Auto-copy
              </span>
            </span>
            {result && (
              <Button variant="ghost" size="xs" onClick={handleCopy}>
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            )}
          </div>
          <div
            className="flex-1 overflow-y-auto whitespace-pre-wrap break-words font-mono text-sm leading-relaxed"
            style={{
              minHeight: 0,
              color: result?.redacted_text ? undefined : "var(--muted-foreground)",
              fontStyle: result?.redacted_text ? "normal" : "italic",
            }}
          >
            {result?.redacted_text
              ? renderHighlightedText(result.redacted_text, mappings)
              : "Redacted text will appear here..."}
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-col items-center gap-3 border-t pt-3">
        <Button
          onClick={handleRedactAndCopy}
          disabled={loading || !input.trim()}
          size="lg"
          className="w-full py-3 bg-primary text-white shadow-md shadow-primary/25 hover:bg-primary/80 hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-40 disabled:shadow-none"
        >
          {loading ? "Redacting..." : "Redact"}
          <kbd className="ml-1 rounded border border-white/10 bg-white/20 px-1.5 py-0.5 font-mono text-[10px]">
            {"\u2318\u21A9"}
          </kbd>
        </Button>
        <div className="flex items-center gap-3">
          {result && (
            <Badge variant="secondary" className="font-mono">
              {result.detection_count} detection{result.detection_count !== 1 ? "s" : ""}
            </Badge>
          )}
          {error && (
            <span className="text-sm text-destructive">{error}</span>
          )}
        </div>
      </div>
    </div>
  );
}
