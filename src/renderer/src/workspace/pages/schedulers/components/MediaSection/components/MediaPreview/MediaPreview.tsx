import { useState } from 'react'
import FileDropZone from './components/FileDropZone'
import { Switch } from '@renderer/components/ui/switch'

const MediaPreview = ({
  previewMediaActive,
  setPreviewMediaActive
}: {
  previewMediaActive: boolean
  setPreviewMediaActive: (value: boolean) => void
}): JSX.Element => {
  const [_mediaFilePaths, setMediaFilePaths] = useState<string[]>([])
  const [clearMediaFiles, setClearMediaFiles] = useState(false)
  const [mediaExist, setMediaExist] = useState(false)
  const updateMediaFilePaths = (paths: string[]): void => {
    setMediaFilePaths(paths)
  }

  const clearMediaFilesFunc = (): void => {
    setClearMediaFiles(true)
  }

  return (
    <div>
      <div className="flex justify-between flex-row items-center mb-4">
        <h1 className="font-poppins text-lg text-gray-900 tracking-wide">Preview Media</h1>

        <Switch
          disabled={!mediaExist}
          checked={previewMediaActive}
          onClick={() => setPreviewMediaActive(!previewMediaActive)}
          className="ml-2"
          style={{
            backgroundColor: previewMediaActive ? '#0f172a' : '#e2e8f0' // Change color based on checked state
          }}
        />
      </div>
      <FileDropZone
        previewMedia={previewMediaActive}
        setPreviewMediaActive={setPreviewMediaActive}
        updateMediaFilePaths={updateMediaFilePaths}
        clearMediaFiles={clearMediaFiles}
        clearMediaFilesFunc={clearMediaFilesFunc}
        setMediaExist={setMediaExist}
      />
    </div>
  )
}

export default MediaPreview
