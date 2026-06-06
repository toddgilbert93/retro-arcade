import { Badge } from '@/components/ui/8bit/badge'

interface WinnerTickerProps {
  text: string
}

export function WinnerTicker({ text }: WinnerTickerProps) {
  return (
    <div
      className="winner-ticker mb-2 w-full overflow-hidden px-1.5"
      role="status"
      aria-label={text}
    >
      <div className="winner-ticker-track flex w-max items-center">
        {[0, 1].map((copy) => (
          <div key={copy} className="winner-ticker-segment flex shrink-0 items-center">
            <Badge variant="default" aria-hidden={copy === 1}>
              {text}
            </Badge>
            <span className="winner-ticker-gap shrink-0" aria-hidden />
          </div>
        ))}
      </div>
    </div>
  )
}
