import { Card } from '@renderer/components/ui/card'
import { Info, Calendar, Clock } from 'lucide-react'
import { SchedulerRecord } from '../Dashboard'

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

interface ShiftCardProps {
  upcoming: SchedulerRecord[]
}

const ShiftCard = ({ upcoming }: ShiftCardProps): JSX.Element => {
  const isEmpty = upcoming.length === 0

  return (
    <Card className="col-span-3 bg-white">
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="xl:text-lg text-sm font-medium text-gray-900">Upcoming posts</h2>
          <div className="w-[18px] h-[18px] rounded-full bg-gray-100 flex items-center justify-center">
            <Info size={12} className="text-gray-400" />
          </div>
        </div>

        {isEmpty ? (
          <div className="flex flex-1 items-center justify-center flex-col gap-2 text-gray-400">
            <Calendar className="w-8 h-8 text-gray-300" />
            <span className="text-[13px]">No pending posts</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3 overflow-y-auto">
            {upcoming.map((post) => {
              const icon = PLATFORM_ICONS[(post.platform ?? '').toLowerCase()]
              const caption = post.description_text?.slice(0, 48) || '(no caption)'
              const ellipsis = (post.description_text?.length ?? 0) > 48 ? '…' : ''
              return (
                <div
                  key={post.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {icon && (
                    <img src={icon} alt={post.platform} className="w-7 h-7 object-contain mt-0.5 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-gray-700 leading-snug truncate">
                      {caption}{ellipsis}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>{post.set_date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{post.set_time}</span>
                      </div>
                    </div>
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
