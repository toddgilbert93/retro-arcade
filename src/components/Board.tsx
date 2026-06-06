import { Chessboard } from 'react-chessboard'
import { useCallback, useMemo } from 'react'
import type { CSSProperties } from 'react'
import { Card, CardContent } from '@/components/ui/8bit/card'
import { useTheme } from '../hooks/useTheme'
import { pixelPieces } from './pixelPieces'

interface BoardProps {
  fen: string
  /** Most recent move in UCI, for highlighting. */
  lastMove?: string
  orientation: 'white' | 'black'
}

function isLightSquare(square: string, orientation: 'white' | 'black'): boolean {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0)
  const rank = Number(square[1])
  const column = orientation === 'white' ? file : 7 - file
  const row = orientation === 'white' ? 8 - rank : rank - 1
  return (row + column) % 2 === 0
}

export function Board({ fen, lastMove, orientation }: BoardProps) {
  const { theme } = useTheme()
  const boardColors = theme.board

  const highlightedSquares = useMemo(() => {
    if (!lastMove) return new Set<string>()
    return new Set([lastMove.slice(0, 2), lastMove.slice(2, 4)])
  }, [lastMove])

  const squareRenderer = useCallback(
    ({
      square,
      children,
    }: {
      square: string
      children?: React.ReactNode
    }) => {
      const base: CSSProperties = {
        width: '100%',
        height: '100%',
        backgroundColor: isLightSquare(square, orientation)
          ? boardColors.light
          : boardColors.dark,
      }

      if (highlightedSquares.has(square)) {
        base.background = boardColors.highlight
      }

      return <div style={base}>{children}</div>
    },
    [orientation, highlightedSquares, boardColors],
  )

  const boardOptions = useMemo(
    () => ({
      id: 'chess-sim',
      position: fen,
      pieces: pixelPieces,
      boardOrientation: orientation,
      allowDragging: false,
      showNotation: false,
      lightSquareStyle: { backgroundColor: boardColors.light },
      darkSquareStyle: { backgroundColor: boardColors.dark },
      squareRenderer,
      animationDurationInMs: 200,
    }),
    [fen, orientation, squareRenderer, boardColors],
  )

  return (
    <Card>
      <CardContent className="p-2">
        <div className="chess-sim-board">
          <Chessboard options={boardOptions} />
        </div>
      </CardContent>
    </Card>
  )
}
