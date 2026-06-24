import { Card } from '@renderer/components/ui/card'
import { Info, Layers } from 'lucide-react'

import twitter from '@renderer/assets/twitter-icon.png'
import facebook from '@renderer/assets/facebook-icon.png'
import instagram from '@renderer/assets/instagram-icon.png'
import tiktok from '@renderer/assets/tiktok-icon.png'
import OF from '@renderer/assets/of-icon.png'
import youtube from '@renderer/assets/youtube-icon.png'

const PLATFORM_ICONS: Record<string, string> = {
  'twitter post': twitter,
  'tik tok post': tiktok,
  'instagram post': instagram,
  'instagram story': instagram,
  'facebook': facebook,
  'of post': OF,
  'of mass messaging': OF,
  'youtube shorts': youtube,
}

const PLATFORM_COLORS: Record<string, string> = {
  'twitter post': '#1DA1F2',
  'tik tok post': '#69C9D0',
  'instagram post': '#E1306C',
  'instagram story': '#C13584',
  'facebook': '#1877F2',
  'of post': '#00AFF0',
  'of mass messaging': '#0099CC',
  'youtube shorts': '#FF0000',
}

export interface PlatformStat {
  key: string
  displayName: string
  count: number
}

interface ShiftCardProps {
  platforms: PlatformStat[]
}

const ShiftCard = ({ platforms }: ShiftCardProps): JSX.Element => {
  const max = platforms[0]?.count || 1

  return (
    <Card className="col-span-3 bg-white">
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="xl:text-lg text-sm font-medium text-gray-900">Platform breakdown</h2>
          <div className="w-[18px] h-[18px] rounded-full bg-gray-100 flex items-center justify-center">
            <Info size={12} className="text-gray-400" />
          </div>
        </div>

        {platforms.length === 0 ? (
          <div className="flex flex-1 items-center justify-center flex-col gap-2 text-gray-400">
            <Layers className="w-8 h-8 text-gray-300" />
            <span className="text-[13px]">No posts yet</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {platforms.map((p) => {
              const icon = PLATFORM_ICONS[p.key]
              const color = PLATFORM_COLORS[p.key] ?? '#6B7280'
              const pct = Math.round((p.count / max) * 100)
              return (
                <div key={p.key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {icon && <img src={icon} alt={p.displayName} className="w-4 h-4 object-contain" />}
                      <span className="text-[12px] text-gray-700 font-medium">{p.displayName}</span>
                    </div>
                    <span className="text-[12px] text-gray-500 font-semibold">{p.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}

export default ShiftCard
