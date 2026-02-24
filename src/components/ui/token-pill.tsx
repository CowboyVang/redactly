import { cn } from "@/lib/utils"

interface TokenPillProps {
  token: string
  color: string
  className?: string
}

export function TokenPill({ token, color, className }: TokenPillProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded px-1 py-0.5 font-mono text-xs font-medium leading-tight",
        className
      )}
      style={{
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        color,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
      }}
    >
      {token}
    </span>
  )
}
