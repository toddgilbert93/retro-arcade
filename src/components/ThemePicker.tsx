import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/8bit/select'
import { cn } from '@/lib/utils'
import { useTheme } from '../hooks/useTheme'
import { THEMES, type ThemeId } from '../themes/themes'

function ThemeSwatch({ colors }: { colors: [string, string, string] }) {
  return (
    <span className="flex shrink-0 gap-0.5">
      {colors.map((color) => (
        <span
          key={color}
          className="h-2.5 w-2.5"
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  )
}

export function ThemePicker({ className }: { className?: string }) {
  const { themeId, setThemeId } = useTheme()

  return (
    <div className={cn('w-fit shrink-0', className)}>
      <Select
        value={themeId}
        onValueChange={(value) => setThemeId(value as ThemeId)}
      >
        <SelectTrigger className="w-[11.25rem]" aria-label="Theme">
          <SelectValue placeholder="Theme" />
        </SelectTrigger>
        <SelectContent
          align="end"
          className="[&_[data-slot=select-scroll-up-button]]:hidden [&_[data-slot=select-scroll-down-button]]:hidden"
        >
          {THEMES.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              <ThemeSwatch colors={t.swatch} />
              <span>{t.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
