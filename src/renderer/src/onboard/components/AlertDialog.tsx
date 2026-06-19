import { useDispatch, useSelector } from 'react-redux'
import { deleteInstance } from '../../redux/slices/instanceSlice'
import { RootState } from '../../redux/store'

// Define the props type for AlertDialog
type AlertDialogProps = {
  deleteId: string
  setOpenModal: (isOpen: boolean) => void
  onDeleteSuccess: () => void; // Callback to handle post-deletion actions
}

const AlertDialog = ({ deleteId, setOpenModal, onDeleteSuccess }: AlertDialogProps): JSX.Element => {
  const dispatch = useDispatch()
  const instanceData = useSelector((state: RootState) => state.instance.instances)
  // Find the instance to be deleted
  const instanceToDelete = instanceData.find((instance) => instance.instanceId === deleteId)

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-90 flex justify-center items-center z-50 transition-all 2s rounded-[16px]">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4 fixed">
        <button
          className="absolute top-2 right-3 text-gray-600 hover:text-gray-800 font-poppins text-2xl rounded-[16px]"
          onClick={() => setOpenModal(false)} // Close modal when clicking the button
        >
          &times;
        </button>
        <div className="flex items-start justify-center mb-4">
          <img
            src={instanceToDelete?.instanceAvatar}
            alt="avatar"
            className="w-16 h-16 rounded-full border border-gray-300"
          />
          <div className="ml-4 ">
            <h2 className="text-xl font-bold text-gray-900 text-left">
              {instanceToDelete?.instanceName}
            </h2>
            <p className="text-gray-700 text-left font-medium">
              Are you sure you want to delete this instance?
            </p>
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            className="bg-red-500 text-white py-2 px-4 rounded"
            onClick={() => {
              dispatch(deleteInstance(deleteId)) // Dispatch delete action
              console.log('Instance deleted', deleteId)

              window.electron.ipcRenderer.send('delete-instance', deleteId) // Send delete request to main process

              onDeleteSuccess(); // Call the callback for post-deletion actions
              setOpenModal(false); // Close the modal after deletion
            }}
          >
            Delete
          </button>
          <button
            className="bg-gray-300 text-gray-800 py-2 px-4 rounded"
            onClick={() => setOpenModal(false)} // Close the modal when cancelling
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default AlertDialog
