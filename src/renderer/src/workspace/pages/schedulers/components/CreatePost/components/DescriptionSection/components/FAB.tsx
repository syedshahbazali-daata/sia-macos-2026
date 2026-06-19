import {Grid2x2Plus, PenTool, SmilePlus} from 'lucide-react'
import {useEffect, useState} from 'react'
import SignatureList from './Signature'
import {RootState} from '@renderer/redux/store'
import {useSelector} from 'react-redux'
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

const Fab = ({onEmojiSelect}: { onEmojiSelect: (emoji: string) => void }): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false)
  const [showSignatureList, setShowSignatureList] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPosition, setEmojiPosition] = useState('bottom');
  const scheduler = useSelector((state: RootState) => state.currentScheduler)

  const toggleFab = (): void => {
    setIsOpen(!isOpen)
    setShowSignatureList(false);
    setShowEmojiPicker(false);
  }

  const toggleSignatureList = (): void => {
    setShowSignatureList(true)
    setIsOpen(false)
  }

  const toggleEmoji = () => {
    // Check position before opening
    const button = document.querySelector('.emoji-button');
    if (button) {
      const rect = button.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setEmojiPosition(spaceBelow < 400 ? 'top' : 'bottom');
    }
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleEmojiSelect = (emoji: any) => {
    onEmojiSelect(emoji.native);
    setShowEmojiPicker(!showEmojiPicker);
  };

  useEffect(() => {
    if (scheduler.description_text.length === 0) setIsOpen(false)
  }, [scheduler])

  return (
    <div className="absolute bottom-2 right-2 w-7 h-18 flex flex-col items-end space-y-3">
      {isOpen && (
        <div className="space-y-3 transition-all duration-300">
          <div className="relative group">
            <button
              disabled={!scheduler.platform}
              onClick={toggleEmoji}
              className="emoji-button flex items-center justify-center w-7 h-7 bg-green-700 text-white rounded-full shadow-lg hover:bg-green-800"
            >
              <SmilePlus className="w-[18px] h-[18px]"/>
            </button>
            <span
              className="absolute right-8 bottom-1/2 transform translate-y-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Add Emoji
            </span>

            {showEmojiPicker && (
              <div className={`absolute z-10 ${emojiPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} right-0`}>
                <Picker data={data} onEmojiSelect={handleEmojiSelect}/>
              </div>
            )}
          </div>

          <div className="relative group">
            <button
              disabled={!scheduler.platform}
              onClick={toggleSignatureList}
              className="flex items-center justify-center w-7 h-7 bg-green-700 text-white rounded-full shadow-lg hover:bg-green-800"
            >
              <PenTool className="w-[18px] h-[18px]"/>
            </button>
            <span
              className="absolute right-8 bottom-1/2 transform translate-y-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Add Signature
            </span>
          </div>
        </div>
      )}
      <button
        disabled={!scheduler.platform}
        onClick={toggleFab}
        className={`flex items-center justify-center w-7 h-7 ${!scheduler.platform ? 'opacity-50' : 'opacity-100'} bg-[#b84d23]  text-white rounded-full shadow-lg hover:bg-[#b84d23]/90 transition-all duration-300`}
      >
        <Grid2x2Plus className={`w-[18px] h-[18px] transform transition-transform rotate-180 scale-x-[-1]`}/>
      </button>
      <div
        className={`absolute right-8 z-5 transition-all duration-300 ${
          showSignatureList ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
        }`}
      >
        {showSignatureList && <SignatureList onClose={() => setShowSignatureList(false)}/>}
      </div>
    </div>
  )
}

export default Fab
