import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@renderer/components/ui/select'
import { SocialMediaPlatform } from '@renderer/types/social-media'
import MediaSection from '../MediaSection/MediaSection'
import DescriptionSection from './components/DescriptionSection/DescriptionSection'
import { useEffect, useState } from 'react'
import { RootState } from '@renderer/redux/store'
import { useDispatch, useSelector } from 'react-redux'
import { setPlatform } from '@renderer/redux/slices/currentSlice'

// Import platform icons
import twitter from '@renderer/assets/twitter-icon.png'
import facebook from '@renderer/assets/facebook-icon.png'
import instagram from '@renderer/assets/instagram-icon.png'
import tiktok from '@renderer/assets/tiktok-icon.png'
import twitch from '@renderer/assets/twitch-icon.png'
import OF from '@renderer/assets/of-icon.png'
import youtube from '@renderer/assets/youtube-icon.png'

const platformIcons = {
  'Twitter Post': twitter,
  'Facebook': facebook,
  'Instagram post': instagram,
  'Instagram story': instagram,
  'Tik Tok Post': tiktok,
  'OF Mass Messaging': OF,
  'OF Post': OF,
  'YouTube Shorts': youtube
};

const CreatePost = (): JSX.Element => {
  const scheduler = useSelector((state: RootState) => state.currentScheduler);
  const [selectType, setSelectType] = useState<string | undefined>('')
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(setPlatform(selectType!))
  }, [selectType])
  useEffect(() => {
    if (scheduler.platform === '') {
      setSelectType('')
    }
  }, [scheduler.platform])

  return (
    <div className="flex flex-col gap-5 w-full h-full p-5 mx-5 bg-gray-300 rounded-2xl">
      <div className="flex flex-row justify-between w-full gap-5">
        <h1 className="font-poppins text-2xl font-bold text-gray-900">Create Your Post</h1>
        <Select value={scheduler.platform} onValueChange={(value) => setSelectType(value)}>
          <SelectTrigger className="h-full bg-white p-2" style={{ width: 'max-content' }}>
            <SelectValue placeholder="SELECT PLATFORM" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SocialMediaPlatform.TwitterPost}>
              <span className="flex items-center gap-2">
                <img src={twitter} alt="Twitter" className="w-4 h-4 object-contain" />
                Twitter Post
              </span>
            </SelectItem>
            <SelectItem value={SocialMediaPlatform.InstagramPost}>
              <span className="flex items-center gap-2">
                <img src={instagram} alt="Instagram" className="w-4 h-4 object-contain" />
                Instagram Post
              </span>
            </SelectItem>
            <SelectItem value={SocialMediaPlatform.InstagramStory}>
              <span className="flex items-center gap-2">
                <img src={instagram} alt="Instagram" className="w-4 h-4 object-contain" />
                Instagram Story
              </span>
            </SelectItem>
            <SelectItem value={SocialMediaPlatform.Facebook}>
              <span className="flex items-center gap-2">
                <img src={facebook} alt="Facebook" className="w-4 h-4 object-contain" />
                Facebook Post
              </span>
            </SelectItem>
            <SelectItem value={SocialMediaPlatform.OFMassMessaging}>
              <span className="flex items-center gap-2">
                <img src={OF} alt="OF" className="w-4 h-4 object-contain" />
                OF Messaging Post
              </span>
            </SelectItem>
            <SelectItem value={SocialMediaPlatform.OFPost}>
              <span className="flex items-center gap-2">
                <img src={OF} alt="OF" className="w-4 h-4 object-contain" />
                OF Post
              </span>
            </SelectItem>
            <SelectItem value={SocialMediaPlatform.TikTokPost}>
              <span className="flex items-center gap-2">
                <img src={tiktok} alt="TikTok" className="w-4 h-4 object-contain" />
                Tik Tok
              </span>
            </SelectItem>
            <SelectItem value={SocialMediaPlatform.YouTubeShorts}>
              <span className="flex items-center gap-2">
                <img src={youtube} alt="YouTube" className="w-4 h-4 object-contain" />
                YouTube Shorts
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <hr className="w-full h-0.3 bg-black opacity-40 -mt-4" />
      <div className="flex justify-between w-full h-full gap-5">
        <DescriptionSection />
        <div className="w-0.5 h-4/5 bg-black opacity-40 self-center" />
        {/* @ts-ignore props for schedulers and set schedulers that are coming from parent*/}
        <MediaSection />
      </div>
    </div>
  )
}

export default CreatePost
