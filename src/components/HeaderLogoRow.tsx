import { cn } from '@/lib/utils'
import { AALogo } from './AALogo'
import { ThemePicker } from './ThemePicker'

export function HeaderLogoRow({ showThemePicker }: { showThemePicker: boolean }) {
  return (
    <div className="relative w-full min-w-0">
      <div
        className={cn(
          'flex h-12 flex-nowrap items-center gap-x-4',
          showThemePicker && 'justify-between',
        )}
      >
        <h1 className={cn(showThemePicker ? 'shrink-0' : 'min-w-0')}>
          <AALogo />
        </h1>
        {showThemePicker ? <ThemePicker /> : null}
      </div>
    </div>
  )
}
