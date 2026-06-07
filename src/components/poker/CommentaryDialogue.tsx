import type { Seat } from '@/poker/types'
import { modelLogoForSeat } from '@/poker/modelLogos'
import { seatTextClass } from '@/poker/seatColors'
import { Alert } from '@/components/ui/8bit/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/8bit/avatar'
import { cn } from '@/lib/utils'

function modelInitial(label: string): string {
  return label.trim().charAt(0).toUpperCase() || '?'
}

export function CommentaryDialogue({
  seat,
  label,
  text,
  thinking = false,
}: {
  seat: Seat
  label: string
  text: string | null
  thinking?: boolean
}) {
  return (
    <div className="flex items-start gap-2">
      <Avatar className="size-11 shrink-0" variant="pixel" font="retro">
        <AvatarImage
          src={modelLogoForSeat(seat)}
          alt={label}
          className="bg-[#f5f3ee] object-contain p-1 pixelated"
        />
        <AvatarFallback className="bg-[#f5f3ee] text-[10px]">{modelInitial(label)}</AvatarFallback>
      </Avatar>
      <Alert className="min-w-0 flex-1 bg-[#121212] px-3 py-2.5">
        <div className="col-start-2 min-w-0">
          <p className={cn('retro mb-1 text-[10px] leading-snug', seatTextClass(seat))}>
            {label}
          </p>
          {thinking ? (
            <p className="retro text-sm leading-snug text-muted-foreground">
              thinking
              <span className="thinking-dots" aria-hidden="true">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </p>
          ) : (
            <p className="retro activity-entry-prominent line-clamp-4 text-sm leading-snug text-foreground">
              {text}
            </p>
          )}
        </div>
      </Alert>
    </div>
  )
}

export function CommentaryDialogueEmpty() {
  return (
    <div className="flex min-h-40 items-center justify-center">
      <p className="retro text-sm text-muted-foreground">No commentary yet.</p>
    </div>
  )
}
