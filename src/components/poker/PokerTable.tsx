import type { PokerSnapshot, Seat, SeatView } from '@/poker/types'
import { POKER_PLAYER_LABELS } from '@/poker/pokerRunner'
import { seatColorVar, seatTextClass } from '@/poker/seatColors'
import { PixelFrame } from '@/components/ui/8bit/pixel-frame'
import { PlayingCard } from './PlayingCard'
import { cn } from '@/lib/utils'

interface PokerTableProps {
  snapshot: PokerSnapshot
  thinking: string | null
  pausePending: boolean
  idle?: boolean
}

function idleSeat(seat: Seat): SeatView {
  return {
    seat,
    label: POKER_PLAYER_LABELS[seat]!,
    stack: 1000,
    committedThisStreet: 0,
    holeCards: null,
    folded: false,
    allIn: false,
    out: false,
    isDealer: false,
    isSmallBlind: false,
    isBigBlind: false,
    isTurn: false,
    lastAction: null,
    lastReasoning: null,
    wonThisHand: 0,
    handDescr: null,
  }
}

export const POKER_IDLE_SNAPSHOT: PokerSnapshot = {
  handNumber: 0,
  dealerSeat: 0,
  street: 'preflop',
  board: [],
  pot: 0,
  currentBet: 0,
  toAct: null,
  seats: ([0, 1, 2, 3] as Seat[]).map(idleSeat),
  tournamentWinner: null,
}

function Tag({ children }: { children: string }) {
  return (
    <span className="retro rounded-sm bg-secondary px-1 py-px text-[7px] uppercase leading-none text-secondary-foreground">
      {children}
    </span>
  )
}

function SeatBox({
  seat,
  thinking,
  pausePending,
}: {
  seat: SeatView
  thinking: string | null
  pausePending: boolean
}) {
  const isThinking = thinking === seat.label && !pausePending
  const dimmed = seat.out || seat.folded
  const won = seat.wonThisHand > 0

  let statusLine: string
  if (seat.out) statusLine = 'OUT'
  else if (isThinking) statusLine = ''
  else if (seat.lastAction) statusLine = seat.lastAction
  else statusLine = 'ready'

  const highlightFrame = won || seat.isTurn
  const borderColor = highlightFrame
    ? won
      ? 'var(--color-primary)'
      : seatColorVar(seat.seat)
    : undefined

  return (
    <div className={cn('w-full max-w-[188px] transition-opacity', dimmed && 'opacity-45')}>
      <div className="mb-2 flex items-center justify-between gap-1">
        <div className="flex min-w-0 items-center gap-1">
          <span className={cn('retro min-w-0 truncate text-[11px]', seatTextClass(seat.seat))}>
            {seat.label}
          </span>
          <div className="flex shrink-0 gap-0.5">
            {seat.isDealer && <Tag>D</Tag>}
            {seat.isSmallBlind && <Tag>SB</Tag>}
            {seat.isBigBlind && <Tag>BB</Tag>}
          </div>
        </div>
        <span className="retro shrink-0 text-[10px] leading-tight">{seat.stack}</span>
      </div>

      <PixelFrame className="mb-2" borderColor={borderColor} contentClassName="bg-card/70 px-2.5 py-2">
        <div className="flex justify-center gap-1.5">
          <PlayingCard card={seat.holeCards?.[0] ?? null} size="md" dim={dimmed} />
          <PlayingCard card={seat.holeCards?.[1] ?? null} size="md" dim={dimmed} />
        </div>

        <div className="mt-1.5 flex h-3.5 items-center justify-center">
          {won ? (
            <span className="retro text-center text-[9px] text-primary">+{seat.wonThisHand}</span>
          ) : isThinking ? (
            <span className="retro text-center text-[9px] text-muted-foreground">
              thinking
              <span className="thinking-dots" aria-hidden="true">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </span>
          ) : (
            <span
              className={cn(
                'retro truncate text-center text-[9px]',
                seat.allIn ? 'text-amber-400' : 'text-muted-foreground',
              )}
            >
              {statusLine}
            </span>
          )}
        </div>
      </PixelFrame>
    </div>
  )
}

function handWinnerText(seats: SeatView[]): string | null {
  const winners = seats.filter((s) => s.wonThisHand > 0)
  if (winners.length === 0) return null
  const total = winners.reduce((sum, s) => sum + s.wonThisHand, 0)
  if (winners.length === 1) {
    return `${winners[0]!.label} wins ${total}`
  }
  const names = winners.map((s) => s.label).join(' & ')
  return `${names} split ${total}`
}

function BoardArea({
  snapshot,
  board,
  idle,
  potLine,
}: {
  snapshot: PokerSnapshot
  board: PokerSnapshot['board']
  idle: boolean
  potLine: string
}) {
  return (
    <div className="flex w-full max-w-full flex-col items-center justify-center gap-2 px-2 py-2 sm:min-h-[152px] sm:gap-3 sm:py-3">
      <span className="retro text-[10px] uppercase tracking-wider text-muted-foreground">
        {idle ? 'waiting' : `${snapshot.street} · hand ${snapshot.handNumber}`}
      </span>
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }, (_, i) => (
          <PlayingCard key={i} card={board[i] ?? null} size="lg" />
        ))}
      </div>
      <span
        className={cn(
          'retro max-w-full text-center text-xs sm:text-sm',
          idle ? 'text-muted-foreground' : 'text-primary',
        )}
      >
        {potLine}
      </span>
    </div>
  )
}

export function PokerTable({ snapshot, thinking, pausePending, idle = false }: PokerTableProps) {
  const seats = snapshot.seats
  const board = snapshot.board
  const winnerText = idle ? null : handWinnerText(seats)
  const potLine = idle
    ? 'Press Deal to start the table.'
    : (winnerText ?? `Pot ${snapshot.pot}`)

  const seatProps = { thinking, pausePending }

  return (
    <>
      {/* Narrow: stack seats vertically around the board */}
      <div className="flex w-full min-w-0 flex-col items-center gap-4 sm:hidden">
        <SeatBox seat={seats[2]!} {...seatProps} />
        <SeatBox seat={seats[3]!} {...seatProps} />
        <BoardArea snapshot={snapshot} board={board} idle={idle} potLine={potLine} />
        <SeatBox seat={seats[1]!} {...seatProps} />
        <SeatBox seat={seats[0]!} {...seatProps} />
      </div>

      {/* Desktop: four corners around the board */}
      <div className="hidden w-full grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr_auto] items-center justify-items-center gap-x-4 gap-y-4 overflow-visible sm:grid">
        <SeatBox seat={seats[2]!} {...seatProps} />
        <div />
        <SeatBox seat={seats[3]!} {...seatProps} />

        <div className="col-span-3">
          <BoardArea snapshot={snapshot} board={board} idle={idle} potLine={potLine} />
        </div>

        <SeatBox seat={seats[1]!} {...seatProps} />
        <div />
        <SeatBox seat={seats[0]!} {...seatProps} />
      </div>
    </>
  )
}
