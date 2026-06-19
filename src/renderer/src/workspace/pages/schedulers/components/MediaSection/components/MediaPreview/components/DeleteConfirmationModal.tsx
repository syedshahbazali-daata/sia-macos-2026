// components/DeleteConfirmationModal.tsx

import React from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[999] ">
      <div className={`bg-white p-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out  ${isOpen ? 'scale-100 animate-scale-enter  opacity-100' : 'scale-0 opacity-0 animate-scale-exit'
          }`}>
        <h2 className="text-lg font-bold mb-2">Confirm Deletion</h2>
        <p>Are you sure you want to delete this media item?</p>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onCancel}
            className="mr-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
