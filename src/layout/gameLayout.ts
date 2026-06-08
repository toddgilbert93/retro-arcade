/** Primary column (board / battle) capped left; wider sidebar (controls + panels). */
export const gameLayoutGrid =
  'grid w-full items-start gap-4 overflow-visible lg:grid-cols-[minmax(320px,480px)_minmax(380px,1fr)] lg:gap-6'

export const gameLayoutPrimary = 'flex w-full min-w-0 flex-col gap-4 overflow-visible'

export const gameLayoutSidebar = 'flex min-w-0 flex-col gap-4 overflow-visible'

/**
 * On mobile, `contents` lifts children into the parent grid for cross-column ordering.
 * At lg, revert to a normal flex column for the two-column layout.
 */
export const gameLayoutPrimaryCol =
  'contents lg:flex lg:w-full lg:min-w-0 lg:flex-col lg:gap-4 lg:overflow-visible'

export const gameLayoutSidebarCol =
  'contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4 lg:overflow-visible'

/** Reset mobile ordering inside lg flex columns. */
export const gameLayoutLgOrder = 'lg:order-none'

/** Play-area cards — content height on mobile; no default card padding. */
export const gameLayoutPanelCard = '!h-auto !gap-0 !py-0'

/** Card body for panels that stretch on lg; stays content-sized on mobile. */
export const gameLayoutPanelContent = '!flex-none min-h-0 lg:!flex-1'

/** Bottom panel in the primary column; fills leftover height on lg only. */
export const gameLayoutPanelStretch =
  'flex min-w-0 shrink-0 flex-col lg:min-h-0 lg:shrink lg:flex-1'

/** Battle arena — content-sized on mobile; fixed height from sm up (includes 8bit border-y). */
export const pokemonBattleCardH = '!h-auto sm:!h-[18.25rem]'
