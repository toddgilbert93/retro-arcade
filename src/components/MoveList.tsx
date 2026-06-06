import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/8bit/card'
import { ScrollArea } from '@/components/ui/8bit/scroll-area'

interface MoveListProps {
  history: string[]
}

/** SAN move history, grouped into numbered full-move rows. */
export function MoveList({ history }: MoveListProps) {
  const rows: { n: number; white: string; black?: string }[] = []
  for (let i = 0; i < history.length; i += 2) {
    rows.push({ n: i / 2 + 1, white: history[i], black: history[i + 1] })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
          Moves
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="retro text-sm text-muted-foreground">No moves yet.</p>
        ) : (
          <ScrollArea className="h-[280px] pr-3">
            <ol className="space-y-0.5">
              {rows.map((r) => (
                <li
                  key={r.n}
                  className="retro grid grid-cols-[36px_1fr_1fr] gap-1.5 rounded-none px-1 py-0.5 text-sm tabular-nums odd:bg-secondary/40"
                >
                  <span className="text-muted-foreground">{r.n}.</span>
                  <span className="font-medium">{r.white}</span>
                  <span className="font-medium">{r.black ?? ''}</span>
                </li>
              ))}
            </ol>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
