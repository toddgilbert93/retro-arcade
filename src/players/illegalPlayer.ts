import type { MoveContext, MoveDecision, Player } from '../engine/types'

/**
 * A deliberately broken player that always returns an illegal move. Used only
 * to exercise the controller's retry → forfeit path during verification.
 */
export class IllegalPlayer implements Player {
  readonly name = 'Illegal (test)'

  async getMove(_ctx: MoveContext): Promise<MoveDecision> {
    return { uci: 'z9z9', reasoning: 'This is intentionally not a legal move.' }
  }
}
