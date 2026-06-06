// Gen-1 Red/Blue sprites are bundled under public/pokemon (downloaded ahead of
// time from the PokeAPI transparent sprite set), keyed by national dex number.

/** Front sprite (faces the viewer) — used for the foe. */
export function frontSprite(dexNumber: number): string {
  return `/pokemon/front/${dexNumber}.png`
}

/** Back sprite (faces away) — used for the player's active Pokémon. */
export function backSprite(dexNumber: number): string {
  return `/pokemon/back/${dexNumber}.png`
}
