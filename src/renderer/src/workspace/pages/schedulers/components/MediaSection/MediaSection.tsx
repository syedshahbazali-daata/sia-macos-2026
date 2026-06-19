import { useState } from 'react'
import SetTime from './components/SetTime'
import SelectPrice from './components/SelectPrice' // Adjust the import path as needed
import MediaPreview from './components/MediaPreview/MediaPreview'
import { useSelector } from 'react-redux'
import { RootState } from '@renderer/redux/store'
import { SocialMediaPlatform } from '@renderer/types/social-media'
import LocationSwitcher from './components/MediaPreview/components/Location'

// import MediaPreview from './components/MediaPreview/MediaPreview'

const MediaSection = (): JSX.Element => {
  const scheduler = useSelector((state: RootState) => state.currentScheduler)
  const [date, setDate] = useState('')

  const [time, setTime] = useState(scheduler.set_time)

  const [previewMediaActive, setPreviewMediaActive] = useState(false)

  return (
    <div className="flex flex-col gap-3 w-1/2 h-full">
      {scheduler.platform !== SocialMediaPlatform.TikTokPost ? (
        <SelectPrice />
      ) : (
        <LocationSwitcher />
      )}
      <SetTime date={date} setDate={setDate} time={time} setTime={setTime} />
      <MediaPreview
        previewMediaActive={previewMediaActive}
        setPreviewMediaActive={setPreviewMediaActive}
      />
      {/* Add other sections of MediaSection here */}
    </div>
  )
}

export default MediaSection
