import React, { useState, useRef, useEffect } from 'react'
import { X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

const ViewScheduleModal = ({ scheduler, showModal, setShowModal }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const modalRef = useRef(null)

  // Handle outside click to close modal
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowModal(false)
      }
    }

    if (showModal) {
      document.addEventListener('mousedown', handleOutsideClick)
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick)
      }
    }
  }, [showModal, setShowModal])

  // Image/Video navigation handlers
  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      (prev + 1) % (scheduler.media_path?.length || 0)
    )
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? (scheduler.media_path?.length || 0) - 1 : prev - 1
    )
  }

  // Delete confirmation handler
  const handleDelete = async () => {
    try {
      const message = await window.electron.scheduler.deleteScheduler(scheduler.id)
      if (message === 'success') {
        // Dispatch delete action or close modal
        setShowModal(false)
      }
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  // Render media (image or video)
  const renderMedia = () => {
    if (!scheduler.media_path?.length) return null

    const currentMedia = scheduler.media_path[currentImageIndex]
    const isVideo = currentMedia.filePath.toLowerCase().match(/\.(mp4|avi|webm|ogg|mov|flv|wmv|mkv)$/)

    return (
      <div className="relative w-full h-64 flex items-center justify-center overflow-hidden">
        {scheduler.media_path.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 z-10 bg-white/50 hover:bg-white/75 p-2 rounded-full transition-all"
            >
              <ChevronLeft className="text-gray-800" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 z-10 bg-white/50 hover:bg-white/75 p-2 rounded-full transition-all"
            >
              <ChevronRight className="text-gray-800" />
            </button>
          </>
        )}

        {isVideo ? (
          <video
            key={currentMedia.filePath}
            src={`file://${currentMedia.filePath}`}
            controls={!currentMedia.isPaid}
            className={`max-w-full max-h-full object-contain ${currentMedia.isPaid ? 'filter blur-sm' : ''}`}
            style={{ pointerEvents: currentMedia.isPaid ? 'none' : 'auto' }}
          />
        ) : (
          <img
            key={currentMedia.filePath}
            src={`file://${currentMedia.filePath}`}
            alt="Schedule Media"
            className={`max-w-full max-h-full object-contain ${currentMedia.isPaid ? 'filter blur-sm' : ''}`}
          />
        )}
      </div>
    )
  }

  // Don't render if modal is not shown
  if (!showModal) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-fade-in">
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-auto animate-slide-up"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Schedule Details</h2>
          <div className="flex items-center space-x-2">
            {/*<button*/}
            {/*  onClick={() => setIsDeleteConfirmOpen(true)}*/}
            {/*  className="text-red-500 hover:text-red-600 transition-colors"*/}
            {/*>*/}
            {/*  <Trash2 />*/}
            {/*</button>*/}
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Media Slider */}
          {renderMedia()}

          {/* Schedule Details */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Platform</span>
              <span className="text-gray-800">{scheduler.platform}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Time</span>
              <span className="text-gray-800">{scheduler.set_time}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Price</span>
              <span className="text-gray-800">${scheduler.set_price}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600 block mb-1">Description</span>
              <p className="text-gray-800 bg-gray-100 p-2 rounded">{scheduler.description_text}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full animate-slide-up">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this schedule?</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ViewScheduleModal
