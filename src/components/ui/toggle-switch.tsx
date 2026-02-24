import { cn } from "@/lib/utils"

interface ToggleSwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

export function ToggleSwitch({ checked, onCheckedChange, className }: ToggleSwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors",
        checked ? "bg-[var(--sr-green)]" : "bg-muted",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none block size-3 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-3.5" : "translate-x-0.5"
        )}
      />
    </button>
  )
}
