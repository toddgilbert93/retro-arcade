import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/8bit/alert'
import { Card, CardContent } from '@/components/ui/8bit/card'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from '@/components/ui/8bit/item'

const rarityVariants = cva('', {
  variants: {
    status: {
      common: 'text-muted-foreground',
      rare: 'text-blue-400',
      epic: 'text-purple-400',
      legendary: 'text-primary',
      mythic: 'text-rose-400',
    },
  },
  defaultVariants: {
    status: 'common',
  },
})

export interface VictoryScreenItems {
  id: number
  name: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
  icon?: string
  /** When set, shown instead of the rarity label (e.g. "1st"). */
  rankLabel?: string
  iconClassName?: string
}

export interface VictoryScreenStats {
  id: number
  title: string
  stats: number | string
}

export interface VictoryScreenProps extends React.ComponentPropsWithoutRef<'div'> {
  title?: string
  itemsSectionTitle?: string
  itemsObtained?: VictoryScreenItems[]
  stats?: VictoryScreenStats[]
  className?: string
  showItemIcon?: boolean
  footerText?: string
}

export function VictoryScreen({
  className,
  title = 'VICTORY!',
  itemsSectionTitle = 'Items Obtained',
  itemsObtained,
  stats,
  showItemIcon = true,
  footerText,
  ...props
}: VictoryScreenProps) {
  return (
    <Card
      data-slot="victoryscreen"
      className={cn('h-full w-full', className)}
      {...props}
    >
      <CardContent className="py-6">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-center text-lg leading-relaxed text-primary sm:text-2xl">
            {title}
          </h1>
        </div>

        {stats && stats.length > 0 && (
          <div className="relative mt-6 flex flex-col flex-wrap items-center justify-around gap-y-6 md:flex-row">
            {stats.map((stat) => (
              <Alert
                key={stat.id}
                className="min-w-3/4 max-w-full p-2 md:min-w-auto md:flex-1"
              >
                <AlertTitle className="text-center text-[9px] font-bold sm:text-[10px]">
                  {stat.title}
                </AlertTitle>
                <AlertDescription className="mt-2 flex items-center justify-center text-xl font-bold md:text-2xl">
                  {stat.stats}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {itemsObtained && itemsObtained.length > 0 && (
          <div className="mt-6 flex flex-col items-center justify-center">
            <h2 className="text-center text-[10px] font-bold sm:text-xs">
              {itemsSectionTitle}
            </h2>

            <ItemGroup className="mt-2 w-full max-w-lg">
              {itemsObtained.map((item, index) => (
                <div key={item.id}>
                  <Item variant="outline" className="rounded-none p-1">
                    <ItemContent className="flex flex-col items-center justify-between gap-2 truncate md:flex-row">
                      <div className="flex w-full flex-row items-center justify-center gap-2 truncate md:max-w-[65%] md:justify-start">
                        {showItemIcon && item.icon && (
                          <span className="flex size-8 shrink-0 items-center justify-center">
                            <img
                              src={item.icon}
                              alt=""
                              className={cn(
                                'pixelated size-full object-contain',
                                item.iconClassName,
                              )}
                            />
                          </span>
                        )}
                        <ItemTitle className="retro leading-normal">
                          {item.name}
                        </ItemTitle>
                      </div>
                      <ItemDescription
                        className={cn(
                          'shrink-0 font-bold uppercase',
                          rarityVariants({ status: item.rarity }),
                        )}
                      >
                        {item.rankLabel ?? item.rarity}
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                  {index < itemsObtained.length - 1 && <ItemSeparator />}
                </div>
              ))}
            </ItemGroup>
            {footerText && (
              <p className="mt-4 max-w-lg text-center text-[8px] leading-relaxed text-muted-foreground sm:text-[9px]">
                {footerText}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
