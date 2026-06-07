import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/8bit/select'
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

export function ThemePicker() {
  const { themeId, setThemeId } = useTheme()

  return (
    <Select
      value={themeId}
      onValueChange={(value) => setThemeId(value as ThemeId)}
    >
      <SelectTrigger className="w-[180px]" aria-label="Theme">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent align="end">
        {THEMES.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            <ThemeSwatch colors={t.swatch} />
            <span>{t.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
