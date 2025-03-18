'use client'

import { useMediaQuery } from '@/utils/useMediaQuery'
import { Tiles } from '../ui/tiles'

export function TilesBackground() {
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div className="absolute top-24 z-0 w-full max-w-screen-2xl">
      <div className="relative h-[400px] w-full overflow-hidden lg:h-[800px]">
        <>
          <Tiles
            rows={80}
            cols={isMobile ? 14 : 30}
            tileSize="md"
            className="h-full w-full"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `
                  linear-gradient(90deg, 
                    hsl(220, 13%, 95%) 0%,
                    transparent 20%,
                    transparent 80%,
                    hsl(220, 13%, 95%) 100%),
                  linear-gradient(180deg,
                    hsl(220, 13%, 95%) 0%,
                    transparent 20%,
                    transparent 80%,
                    hsl(220, 13%, 95%) 100%)
                `,
              opacity: 1,
            }}
          />
        </>
      </div>
    </div>
  )
}
