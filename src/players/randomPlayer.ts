import type { MoveContext, MoveDecision, Player } from '../engine/types'

/**
 * The simplest possible participant: pick a uniformly random legal move.
 * Serves as the default opponent so two "players" can play a full game on load,
 * and as a reference implementation of the {@link Player} contract.
 */
export class RandomPlayer implements Player {
  readonly name: string

  constructor(name = 'Random') {
    this.name = name
  }

  async getMove(ctx: MoveContext): Promise<MoveDecision> {
    const i = Math.floor(Math.random() * ctx.legalMoves.length)
    return { uci: ctx.legalMoves[i] }
  }
}
