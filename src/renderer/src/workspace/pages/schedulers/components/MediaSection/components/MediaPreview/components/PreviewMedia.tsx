import React, { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCloudArrowUp, faTrash } from '@fortawesome/free-solid-svg-icons'
import DeleteConfirmationModal from './DeleteConfirmationModal'
import { RootState } from '@renderer/redux/store'
import { useSelector } from 'react-redux'
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'

interface MediaItem {
  filePath: string
  previewUrl: string
  isPaid: boolean
}

interface PreviewMediaProps {
  urlsObj: MediaItem[]
  onDelete: (index: number) => void
  onUpload: (newFiles: File[]) => void
  premiumImages: number[]
  setPremiumImages: React.Dispatch<React.SetStateAction<number[]>>
  setUrlsObj: React.Dispatch<React.SetStateAction<MediaItem[]>>
  isDragging: boolean
}

const PreviewMedia: React.FC<PreviewMediaProps> = ({
  urlsObj,
  onDelete,
  onUpload,
  premiumImages: _premiumImages,
  setPremiumImages,
  setUrlsObj,
  isDragging: _isDragging
}) => {
  const scheduler = useSelector((state: RootState) => state.currentScheduler)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  const isOFPost = scheduler.platform.toLowerCase().includes('of ')
  const schedulerPrice = scheduler.set_price || 0

  useEffect(() => {
    if (isOFPost) {
      if (schedulerPrice === 0) {
        // If price is 0, set all images as unpaid
        setPremiumImages([])
        setUrlsObj(prev => prev.map(item => ({ ...item, isPaid: false })))
      } else {
        // If price > 0, set all images as paid by default
        const allIndexes = [...Array(urlsObj.length).keys()]
        setPremiumImages(allIndexes)
        setUrlsObj(prev => prev.map(item => ({ ...item, isPaid: true })))
      }
    } else {
      // Reset states for other platforms
      setPremiumImages([])
      setUrlsObj(prev => prev.map(item => ({ ...item, isPaid: false })))
    }
  }, [isOFPost, schedulerPrice, urlsObj.length])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    const newFiles = selectedFiles.filter(
      file => !urlsObj.some(urlObj => urlObj.filePath === file.path)
    )

    if (newFiles.length > 0) {
      onUpload(newFiles)

      if (isOFPost && schedulerPrice > 0) {
        const newIndexes = [...Array(newFiles.length).keys()].map(i => i + urlsObj.length)
        setPremiumImages(prev => [...prev, ...newIndexes])
      }
    }
  }

  const togglePaidStatus = (index: number) => {
    if (!isOFPost || schedulerPrice === 0) return

    setUrlsObj(prev => {
      const newUrlsObj = [...prev]
      newUrlsObj[index] = {
        ...newUrlsObj[index],
        isPaid: !newUrlsObj[index].isPaid
      }
      return newUrlsObj
    })

    setPremiumImages(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index)
      } else {
        return [...prev, index]
      }
    })
  }

  const handleDelete = (index: number) => {
    setDeleteIndex(index)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    if (deleteIndex !== null) {
      onDelete(deleteIndex)

      if (isOFPost && schedulerPrice > 0) {
        setPremiumImages(prev =>
          prev
            .filter(i => i !== deleteIndex)
            .map(i => (i > deleteIndex ? i - 1 : i))
        )
      }

      setDeleteIndex(null)
    }
    setIsDeleteModalOpen(false)
  }

  return (
    <div>
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      <div className="bg-white p-2.5 rounded-lg overflow-y-auto h-44 max-h-60 w-full">
        <div
          className="grid grid-cols-auto-fill gap-1 h-full"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))',
            gridTemplateRows: 'repeat(auto-fill, minmax(75px, 1fr))',
            cursor: 'context-menu'
          }}
        >
          <SortableContext
            items={urlsObj.map(item => item.filePath)}
            strategy={verticalListSortingStrategy}
          >
            {urlsObj.map((item, index) => (
              <div
                key={item.filePath}
                className={`relative rounded-lg overflow-hidden cursor-pointer
                  ${isOFPost && schedulerPrice > 0 && item.isPaid ? 'filter blur-sm' : ''}`}
                onClick={() => togglePaidStatus(index)}
              >
                <img
                  src={item.previewUrl}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(index)
                  }}
                  className="absolute top-1 right-1 text-red-500 hover:text-red-700"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}
          </SortableContext>

          <div className="border-2 border-gray-400 rounded-lg bg-gray-200 p-2 flex items-center justify-center relative group">
            <FontAwesomeIcon icon={faCloudArrowUp} className="text-gray-600 text-xl" />
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreviewMedia
