import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@renderer/components/ui/select'
import { Button } from '@renderer/components/ui/button'
import { Textarea } from '@renderer/components/ui/textarea'
import { useEffect, useState } from 'react'
import { generateDescription } from '@renderer/lib/schedulers'
import Fab from './components/FAB'
import Interval from './components/Interval'
import { addScheduler as schedulerToRedux } from '@renderer/redux/slices/SchedulerSlice'
import { useDispatch, useSelector } from 'react-redux'
import { v4 as uuidv4 } from 'uuid'
import { toast } from '@renderer/hooks/use-toast'
import { RootState } from '@renderer/redux/store'

import {
  setDescriptionType,
  setCity,
  setIsScheduled,
  setDescriptionText,
  setSignature,
  setPrice,
  setDate,
  setTime,
  setMediaPath,
  setSchedulerId
} from '@renderer/redux/slices/currentSlice'
import { SocialMediaPlatform } from '@renderer/types/social-media'


const DescriptionSection = (): JSX.Element => {
  const scheduler = useSelector((state: RootState) => state.currentScheduler)
  const dispatch = useDispatch()
  const [selectType, setSelectType] = useState<string>('description')  // Changed to have 'description' as default
  const [description, setDescription] = useState(scheduler.description_text || '')
  const [selectDescriptionCategory, setSelectDescriptionCategory] = useState<string>('funny')  // Changed to have 'funny' as default

  const addScheduler = (): void => {
    if (scheduler.platform === '') {
      toast({
        title: 'Error',
        description: 'Please select platform first',
        variant: 'destructive'
      })
      return
    }
    if (
      scheduler.platform === SocialMediaPlatform.InstagramPost &&
      scheduler.media_path.length === 0
    ) {
      toast({
        title: 'Error',
        description: 'Please select media first',
        variant: 'destructive'
      })
      return
    }
    if (
      scheduler.platform === SocialMediaPlatform.InstagramStory &&
      scheduler.media_path.length === 0
    ) {
      toast({
        title: 'Error',
        description: 'Please select media first',
        variant: 'destructive'
      })
      return
    }
    if (
      scheduler.platform === SocialMediaPlatform.OFPost &&
      scheduler.set_price === 3 &&
      scheduler.media_path.length === 0
    ) {
      toast({
        title: 'Error',
        description: 'Please select media first',
        variant: 'destructive'
      })
      return
    }
    if (
      scheduler.platform === SocialMediaPlatform.OFPost &&
      scheduler.set_price === 0 &&
      scheduler.media_path.length !== 0
    ) {
      toast({
        title: 'Error',
        description: 'Please select price first',
        variant: 'destructive'
      })
      return
    }
    if (scheduler.description_text === '') {
      toast({
        title: 'Error',
        description: 'Please enter description first',
        variant: 'destructive'
      })
      return
    }
    if (scheduler.set_date === '') {
      toast({
        title: 'Error',
        description: 'Please select date first',
        variant: 'destructive'
      })
      return
    }
    if (scheduler.set_time === '') {
      toast({
        title: 'Error',
        description: 'Please select time first',
        variant: 'destructive'
      })
      return
    }

    const newId = uuidv4()
    dispatch(setSchedulerId(newId))
    dispatch(schedulerToRedux(scheduler))

    // make a new scheduler object and remove previewUrl from each media_paths
    const newMediaPath = scheduler.media_path.map((media) => {
      const { previewUrl, ...rest } = media
      return rest
    })
    const newScheduler = {
      ...scheduler,

      media_path: newMediaPath
    }




    window.electron.ipcRenderer.send('add-scheduler', newScheduler)

    // Reset form after successful submission
    dispatch(setSchedulerId(newId))
    dispatch(setDescriptionType(selectType))
    dispatch(setCity(scheduler.city))
    dispatch(setIsScheduled(0))
    dispatch(setDescriptionText(''))
    dispatch(setSignature(''))
    dispatch(setPrice(scheduler.set_price))
    dispatch(setDate(scheduler.set_date))
    dispatch(setTime(scheduler.set_time))
    dispatch(setMediaPath([]))
    setDescription('')
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (newValue.length <= 280) {
      setDescription(newValue)
      dispatch(setDescriptionText(newValue))
    }
  }

  useEffect(() => {
    if (!scheduler.platform) {
      setSelectType('description')  // Changed to reset to 'description' instead of empty string
      setDescription('')
      dispatch(setDescriptionText(''))
    }
  }, [scheduler.platform])

  const handleClick = (): void => {
    if (selectType && selectDescriptionCategory) {
      const generatedDescription = generateDescription(selectType, selectDescriptionCategory)
      setDescription(generatedDescription)
      dispatch(setDescriptionText(generatedDescription))
    } else {
      toast({
        title: 'Error',
        description: 'Please select both type and category',
        variant: 'destructive'
      })
    }
  }

  const handleEmojiAdd = (emoji: string) => {
    const newDescription = description + emoji
    setDescription(newDescription)
    dispatch(setDescriptionText(newDescription))
  }

  return (
    <div className="flex flex-col gap-3 w-1/2 h-full">
      <h1 className="font-poppins text-lg text-gray-900 tracking-wide">Description Type</h1>
      <div className="flex flex-row gap-5">
        <Select disabled={!scheduler.platform} value={selectType} onValueChange={setSelectType}>
          <SelectTrigger className="w-1/2 bg-white">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="description">Description</SelectItem>
            <SelectItem value="scenarios">Scenarios</SelectItem>
            <SelectItem value="hashtags">Hashtags</SelectItem>
          </SelectContent>
        </Select>
        <Select
          disabled={!scheduler.platform}
          value={selectDescriptionCategory}
          onValueChange={setSelectDescriptionCategory}
        >
          <SelectTrigger className="w-1/2 bg-white">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="funny">Funny</SelectItem>
            <SelectItem value="motivational">Motivational</SelectItem>
            <SelectItem value="adult">Adult</SelectItem>
            <SelectItem value="educational">Educational</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        disabled={!scheduler.platform}
        onClick={handleClick}
        className="w-full h-10 text-xs tracking-wide rounded-lg bg-[#b84d23] text-white hover:bg-orange-800"
      >
        Generate
      </Button>
      <h1 className="font-poppins text-lg text-gray-900 tracking-wide">Description</h1>
      <div className="relative h-[100%]">
        <div className={`h-full rounded-md`}>
          <Textarea
            disabled={!scheduler.platform}
            className="w-full h-full pr-12"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Write your thoughts"
          />
          {scheduler.signature !== '' &&
            scheduler.signature !== null &&
            scheduler.signature !== undefined && (
              <div className="absolute bottom-3 left-4 text-xs text-gray-500">
                Signature: {scheduler.signature}
              </div>
            )}
          <Fab onEmojiSelect={handleEmojiAdd} />
        </div>
      </div>
      <Interval />
      <Button
        disabled={!scheduler.platform}
        onClick={addScheduler}
        className="w-full h-11 text-xs tracking-wide rounded-lg bg-[#0f172a] text-white hover:bg-[#0f172a]/90"
      >
        Add to Schedule
      </Button>
    </div>
  )
}

export default DescriptionSection
