// Minimal ambient types for the (untyped, CommonJS) `pokersolver` package. We
// only use Hand.solve / Hand.winners for 7-card showdown ranking.
declare module 'pokersolver' {
  export interface SolvedHand {
    /** Human-readable description, e.g. "Two Pair, A's & K's". */
    descr: string
    name: string
    rank: number
  }
  export interface HandStatic {
    solve(cards: string[], game?: string, canDisqualify?: boolean): SolvedHand
    winners(hands: SolvedHand[]): SolvedHand[]
  }
  const pokersolver: { Hand: HandStatic }
  export default pokersolver
}
