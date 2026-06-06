import type { PieceRenderObject } from 'react-chessboard'

import bBSvg from '@/assets/pieces/pixel/bB.svg?raw'
import bKSvg from '@/assets/pieces/pixel/bK.svg?raw'
import bNSvg from '@/assets/pieces/pixel/bN.svg?raw'
import bPSvg from '@/assets/pieces/pixel/bP.svg?raw'
import bQSvg from '@/assets/pieces/pixel/bQ.svg?raw'
import bRSvg from '@/assets/pieces/pixel/bR.svg?raw'
import wBSvg from '@/assets/pieces/pixel/wB.svg?raw'
import wKSvg from '@/assets/pieces/pixel/wK.svg?raw'
import wNSvg from '@/assets/pieces/pixel/wN.svg?raw'
import wPSvg from '@/assets/pieces/pixel/wP.svg?raw'
import wQSvg from '@/assets/pieces/pixel/wQ.svg?raw'
import wRSvg from '@/assets/pieces/pixel/wR.svg?raw'

function PixelPiece({ svg }: { svg: string }) {
  return (
    <span
      className="pixelated block size-full select-none [&_svg]:size-full"
      aria-hidden
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

const PIECE_SVGS: Record<string, string> = {
  wP: wPSvg,
  wR: wRSvg,
  wN: wNSvg,
  wB: wBSvg,
  wQ: wQSvg,
  wK: wKSvg,
  bP: bPSvg,
  bR: bRSvg,
  bN: bNSvg,
  bB: bBSvg,
  bQ: bQSvg,
  bK: bKSvg,
}

export const pixelPieces: PieceRenderObject = Object.fromEntries(
  Object.entries(PIECE_SVGS).map(([type, svg]) => [type, () => <PixelPiece svg={svg} />]),
)
