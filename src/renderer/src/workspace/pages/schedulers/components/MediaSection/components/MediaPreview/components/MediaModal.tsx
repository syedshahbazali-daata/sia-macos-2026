// components/MediaModal.tsx

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

interface MediaModalProps {
  isOpen: boolean;
  selectedMedia: { filePath: string; previewUrl: string } | null;
  onClose: () => void;
}

const MediaModal: React.FC<MediaModalProps> = ({ isOpen, selectedMedia, onClose }) => {
  if (!isOpen || !selectedMedia) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div
        className={`relative p-2 bg-white rounded-lg  transition-all duration-300 ease-in-out ${isOpen ? 'scale-100 animate-scale-enter  opacity-100' : 'scale-0 opacity-0 animate-scale-exit'
          }`}
        style={{ width: '30%', height: 'max-content' }}
      >
        <button
          className="absolute px-1 top-3 right-3 bg-white rounded-full text-red-600 shadow-lg hover:bg-white/90 transition-all duration-300 cursor-pointer z-50"
          onClick={onClose}
        >
          <FontAwesomeIcon icon={faTimes} size="lg" />
        </button>
        {selectedMedia.filePath.toLowerCase().match(/\.(mp4|avi|webm|ogg)$/) ? (
          <video
            src={selectedMedia.filePath}
            className="w-full h-full object-cover"
            controls
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <img
            src={selectedMedia.previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>
    </div>
  );
};

export default MediaModal;
