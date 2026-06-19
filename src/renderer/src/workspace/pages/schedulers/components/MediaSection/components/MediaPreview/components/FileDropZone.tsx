// components/FileDropZone.tsx
import React, { useEffect, useState } from 'react'
import { faPhotoFilm } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import PreviewMedia from './PreviewMedia'
import { useDispatch, useSelector } from 'react-redux'
import { setMediaPath } from '@renderer/redux/slices/currentSlice'
import { RootState } from '@renderer/redux/store'
import platformLimits from '@renderer/workspace/pages/schedulers/SchedulerHelper'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
// import { SortableItem } from './SortableItem';


export  const generateVideoThumbnail = async (file: File): Promise<string> => {
  const video = document.createElement('video')
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  return new Promise((resolve, reject) => {
    video.src = URL.createObjectURL(file)
    video.muted = true
    video.playsInline = true

    video.addEventListener('loadeddata', () => {
      video.currentTime = 0.1
    })

    video.addEventListener('seeked', () => {
      if (ctx) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
        const dataUrl = canvas.toDataURL('image/jpeg')
        URL.revokeObjectURL(video.src) // Clean up the object URL
        resolve(dataUrl) // Return the thumbnail as a data URL
      } else {
        reject('Failed to get canvas context')
      }
    })

    video.onerror = (): void => reject('Failed to generate video thumbnail')
  })
}

const FileDropZone = ({
  previewMedia,
  updateMediaFilePaths,
  clearMediaFiles,
  clearMediaFilesFunc,
  setPreviewMediaActive,
  setMediaExist
}: {
  previewMedia: boolean
  updateMediaFilePaths: (paths: string[]) => void
  clearMediaFiles: boolean
  clearMediaFilesFunc: () => void
  setPreviewMediaActive: (value: boolean) => void
  setMediaExist: (value: boolean) => void
}): JSX.Element => {
  const scheduler = useSelector((state: RootState) => state.currentScheduler)
  const dispatch = useDispatch()
  const [borderColor, setBorderColor] = useState('border-black')
  const [dropText, setDropText] = useState('Drag & drop files here or click to select files')
  const [isDragActive, setIsDragActive] = useState(false)
  const [filePaths, setFilePaths] = useState<string[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [isPaid, setIsPaid] = useState<boolean[]>([])
  const [urlsObj, setUrlsObj] = useState<
    { filePath: string; previewUrl: string; isPaid: boolean }[]
  >([])
  const [premiumImages, setPremiumImages] = useState<number[]>([]) // Store indexes of premium images
  const [isDragging, setIsDragging] = useState(false)



  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    await processFiles(selectedFiles)
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const droppedFiles = Array.from(event.dataTransfer.files)
    if (droppedFiles.length > 0) {
      await processFiles(droppedFiles)
      resetDropZone()
    }
  }

  const processFiles = async (files: File[]) => {
    // Get platform limits for image and video uploads
    const currentLimit = platformLimits[scheduler.platform] || 1

    if (filePaths.length + files.length > currentLimit) {

      alert(`You can only upload up to ${currentLimit} files for ${scheduler.platform}.`)
      return
    }
    // Filter new files to avoid duplicates
    const newFiles = files.filter((file) => !filePaths.includes(file.path))

    const previews = await Promise.all(
      newFiles.map(async (file) => {
        return file.type.startsWith('video/')
          ? await generateVideoThumbnail(file)
          : URL.createObjectURL(file)
      })
    )

    const uniquePaths = [...filePaths, ...newFiles.map((file) => file.path)]
    const uniquePreviews = [...previewUrls, ...previews]

    // Check if the platform is 'OF Post' to determine isPaid status
    const isPaidStatus =
      scheduler.platform === 'OF Post'
        ? Array(newFiles.length).fill(true)
        : Array(newFiles.length).fill(false)
    const updatedUrlsObj = [
      ...urlsObj,
      ...newFiles.map((_, index) => ({
        filePath: uniquePaths[uniquePaths.length - newFiles.length + index], // Ensures filePath is a string
        previewUrl: uniquePreviews[uniquePreviews.length - newFiles.length + index],
        isPaid: isPaidStatus[index]
      }))
    ]

    setUrlsObj(updatedUrlsObj)
    setFilePaths(uniquePaths)
    setPreviewUrls(uniquePreviews)
    updateMediaFilePaths(uniquePaths)
    if (uniquePaths.length > 0) {
      setMediaExist(true)
      setPreviewMediaActive(true)
    } else { setMediaExist(false) }

    // If the platform is OF Post, ensure new files are added to the premium images
    if (scheduler.platform === 'OF Post') {
      const newIndexes = [...Array(newFiles.length).keys()].map((i) => i + urlsObj.length) // Calculate indexes of new files
      setPremiumImages((prevPremiumImages) => [...prevPremiumImages, ...newIndexes])
    }
  }

  const resetDropZone = (): void => {
    setBorderColor('border-black')
    setDropText('Drag & drop files here or click to select files')
    setIsDragActive(false)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setBorderColor('border-red-500')
    setDropText('Drop the files here...')
    setIsDragActive(true)
  }

  const handleDragLeave = () => {
    resetDropZone()
  }

  const handleClick = () => {
    document.getElementById('file')?.click()
  }

  const handleDelete = (index: number) => {

    const updatedUrlsObj = urlsObj.filter((_, i) => i !== index)
    setUrlsObj(updatedUrlsObj)

    const updatedPremiumImages = premiumImages.filter((i) => i !== index)
    setPremiumImages(updatedPremiumImages)

    // Update the filePaths and previewUrls based on the new urlsObj
    const updatedPaths = updatedUrlsObj.map((obj) => obj.filePath)
    const updatedPreviews = updatedUrlsObj.map((obj) => obj.previewUrl)

    setFilePaths(updatedPaths)
    setPreviewUrls(updatedPreviews)
    updateMediaFilePaths(updatedPaths)

    if (updatedPaths.length > 0) {
      setPreviewMediaActive(true)
      setMediaExist(true)
    } else {
      setPreviewMediaActive(false)
      setMediaExist(false)
    }
  }

  const handleUpload = async (newFiles: File[]) => {
    const selectedFiles = Array.from(newFiles || [])
    await processFiles(selectedFiles)
  }

  useEffect(() => {
    if (filePaths) {
      dispatch(setMediaPath(urlsObj))
    }
  }, [urlsObj, isPaid, premiumImages])

  useEffect(() => {
    if (scheduler.media_path.length === 0) {
      if (filePaths.length > 0 || previewUrls.length > 0 || isPaid.length > 0) {
      setFilePaths([])
      setPreviewUrls([])
      setIsPaid([])
      setPremiumImages([])
      setUrlsObj([])
      setPreviewMediaActive(false)
      setMediaExist(false)
    }
    }
  }, [scheduler.media_path])

  const sensors = useSensors(
    useSensor(PointerSensor,
      {
        activationConstraint: {
          delay: 200,
          tolerance: 5,
        },
        // onStart: () => setIsDragging(true),  // When dragging starts
        // onEnd: () => setIsDragging(false),   // When dragging ends
      }),
    // useSensor(TouchSensor, {
    //   activationConstraint: {
    //     delay: 200,
    //     tolerance: 5,
    //   }}),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: any) => {
    // if(!isDragging)
    // {
      const { active, over } = event;
      if (active.id !== over.id) {
        setUrlsObj((prevUrlsObj) => {
          const oldIndex = prevUrlsObj.findIndex(item => item.filePath === active.id);
          const newIndex = prevUrlsObj.findIndex(item => item.filePath === over.id);

          // Reorder urlsObj
          const newUrlsObj = arrayMove(prevUrlsObj, oldIndex, newIndex);

          // Reorder isPaid array to keep premium/free status consistent with the new order
          const newIsPaid = arrayMove(isPaid, oldIndex, newIndex);
          setIsPaid(newIsPaid);

          // Update premiumImages to reflect new indexes of premium images
          const updatedPremiumImages = newUrlsObj
            .map((item, index) => (item.isPaid ? index : null))
            .filter((index) => index !== null) as number[];
          setPremiumImages(updatedPremiumImages);

          return newUrlsObj;
        });
      }
      setIsDragging(false)
    // }
  };


const handleDragStart=()=>{
setIsDragging(true)
}

  return (
    <>
      {!previewMedia && (
        <div
          className={`border-2 border-dashed ${!scheduler.platform ? 'opacity-50' : 'opacity-100'} ${borderColor} ${isDragActive ? 'bg-red-100' : 'bg-gray-100'}  rounded-md p-5 text-center cursor-pointer flex justify-center items-center flex-col h-44 max-h-60 w-full`}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >
          {!previewMedia && (
            <FontAwesomeIcon
              icon={faPhotoFilm}
              size="4x"
              className={`${isDragActive ? 'text-black' : 'text-gray-300'} `}
            />
          )}

          <input
            disabled={!scheduler.platform}
            id="file"
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden w-full h-full"
          />
          {!previewMedia && <p className="text-center">{dropText}</p>}
        </div>
      )}

      {previewMedia && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragOver={handleDragStart}  onDragEnd={handleDragEnd}>
          <SortableContext items={urlsObj.map((item) => item.filePath)} strategy={verticalListSortingStrategy}>

            <PreviewMedia
              urlsObj={urlsObj}
              onDelete={handleDelete}
              isDragging={isDragging}
              // setIsDragging={setIsDragging}
              onUpload={handleUpload}
              premiumImages={premiumImages} // Make sure you pass this as well
              setPremiumImages={setPremiumImages} // Pass the setPremiumImages function
              setUrlsObj={setUrlsObj} // Pass the setUrlsObj function
            />
          </SortableContext>
        </DndContext>
      )}
      {clearMediaFiles && (
        <>
          {filePaths.length > 0 && clearMediaFilesFunc()}
          {setFilePaths([])}
        </>
      )}
    </>
  )
}

export default FileDropZone
