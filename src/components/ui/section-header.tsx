import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

interface SectionHeaderProps {
  children: React.ReactNode
  bordered?: boolean
  className?: string
}

export function SectionHeader({ children, bordered, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-2", className)}>
      <h3 className="text-[10px] font-medium uppercase leading-relaxed tracking-[0.1em] text-muted-foreground">
        {children}
      </h3>
      {bordered && <Separator className="mt-1.5" />}
    </div>
  )
}
