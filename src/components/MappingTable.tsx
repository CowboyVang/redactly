import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronRight, ArrowRightLeft, Download, Search, Copy, Check, X } from "lucide-react";
import type { RedactionMapping } from "../types";
import { getSourceColor, getSourceLabel } from "../utils/colors";
import { Badge, Button, Input, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Tooltip, TooltipTrigger, TooltipContent } from "./ui";
import { cn } from "@/lib/utils";

interface MappingTableProps {
  mappings: RedactionMapping[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  height: number;
  onHeightChange: (height: number) => void;
  onExportMappings?: () => void;
  onRemoveMapping?: (index: number) => void;
}

export function MappingTable({ mappings, collapsed, onToggleCollapse, height, onHeightChange, onExportMappings, onRemoveMapping }: MappingTableProps) {
  const [dragging, setDragging] = useState(false);
  const [search, setSearch] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  const filteredMappings = useMemo(() => {
    if (!search.trim()) return mappings.map((m, i) => ({ ...m, _index: i }));
    const q = search.toLowerCase();
    return mappings
      .map((m, i) => ({ ...m, _index: i }))
      .filter((m) => m.token.toLowerCase().includes(q) || m.original.toLowerCase().includes(q));
  }, [mappings, search]);

  function handleDragStart(e: React.MouseEvent) {
    if (collapsed) return;
    e.preventDefault();
    setDragging(true);
    dragStartY.current = e.clientY;
    dragStartHeight.current = height;
  }

  useEffect(() => {
    if (!dragging) return;

    function handleMouseMove(e: MouseEvent) {
      const delta = dragStartY.current - e.clientY;
      const newHeight = Math.max(100, Math.min(500, dragStartHeight.current + delta));
      onHeightChange(newHeight);
    }

    function handleMouseUp() {
      setDragging(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, onHeightChange]);

  async function handleCopyRow(mapping: RedactionMapping, index: number) {
    await navigator.clipboard.writeText(`${mapping.token} → ${mapping.original}`);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }

  return (
    <div className="shrink-0">
      {/* Drag divider */}
      <div
        className={cn(
          "h-1 transition-colors hover:bg-primary/30",
          collapsed ? "cursor-default" : "cursor-row-resize"
        )}
        onMouseDown={handleDragStart}
      />

      {/* Collapsible header */}
      <button
        onClick={onToggleCollapse}
        className="flex h-9 w-full cursor-pointer select-none items-center gap-2 px-4 transition-colors hover:bg-muted/50"
      >
        <ChevronRight
          className={cn(
            "size-3.5 text-muted-foreground transition-transform",
            !collapsed && "rotate-90"
          )}
        />
        <span className="text-sm font-medium text-muted-foreground">
          Mappings
        </span>
        {mappings.length > 0 && (
          <Badge variant="secondary" className="font-mono text-[10px]">
            {mappings.length}
          </Badge>
        )}
        {mappings.length > 0 && onExportMappings && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => { e.stopPropagation(); onExportMappings(); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Download className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export mappings</TooltipContent>
          </Tooltip>
        )}
      </button>

      {/* Table body */}
      {!collapsed && (
        <div className="mx-4 mb-4 overflow-hidden rounded-lg border bg-card">
          {mappings.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center text-sm italic text-muted-foreground">
              <ArrowRightLeft className="size-4 text-muted-foreground/50" />
              No mappings yet. Redact some text to see token mappings.
            </div>
          ) : (
            <>
              {/* Search filter */}
              <div className="border-b px-3 py-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Filter mappings..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-7 pl-7 text-xs"
                  />
                </div>
              </div>
              <div className="overflow-y-auto" style={{ height }}>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs uppercase tracking-wider">Token</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider">Original</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider">Source</TableHead>
                      <TableHead className="w-16 text-xs uppercase tracking-wider">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMappings.map((mapping) => (
                      <TableRow key={mapping._index}>
                        <TableCell className="font-mono font-medium text-primary">
                          {mapping.token}
                        </TableCell>
                        <TableCell className="font-mono">
                          {mapping.original}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-mono"
                            style={{
                              background: `color-mix(in srgb, ${getSourceColor(mapping.source)} 15%, transparent)`,
                              color: getSourceColor(mapping.source),
                              borderColor: `color-mix(in srgb, ${getSourceColor(mapping.source)} 30%, transparent)`,
                            }}
                          >
                            {getSourceLabel(mapping.source)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-0.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={(e) => { e.stopPropagation(); handleCopyRow(mapping, mapping._index); }}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  {copiedIndex === mapping._index ? <Check className="size-3" /> : <Copy className="size-3" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Copy mapping</TooltipContent>
                            </Tooltip>
                            {onRemoveMapping && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={(e) => { e.stopPropagation(); onRemoveMapping(mapping._index); }}
                                    className="text-muted-foreground hover:text-destructive"
                                  >
                                    <X className="size-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Remove mapping</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
