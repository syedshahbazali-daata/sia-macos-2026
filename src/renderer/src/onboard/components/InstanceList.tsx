import { Button } from '@renderer/components/ui/button'
import AddInstance from './AddInstance'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { useState } from 'react'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { useNavigate } from 'react-router-dom'
import AlertDialog from './AlertDialog'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@renderer/redux/store'
import { Instance } from '@renderer/types/Instance'
import { setInstanceId } from '@renderer/redux/slices/SelectedInstanceSlice'

// InstanceList component
const InstanceList = (): JSX.Element => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const instances = useSelector((state: RootState) => state.instance.instances)
  const [openModal, setOpenModal] = useState(false)
  const [deleteId, setDeleteId] = useState('')
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null)

  // Handle instance selection
  const handleInstanceSelect = (instance: Instance): void => {
    setSelectedInstance(instance)
    dispatch(setInstanceId(instance.instanceId))
  }

  // Handle deletion confirmation
  const handleDeleteInstance = (instanceId: string) => {
    // Check if the selected instance is being deleted
    if (selectedInstance?.instanceId === instanceId) {
      setSelectedInstance(null) // Clear selected instance
      dispatch(setInstanceId('')); // Clear selected ID in Redux
      localStorage.removeItem('selectedInstanceId'); // Clear selected ID from local storage
    }
  }

  return (
    <div className="w-full h-[162px] ">
      <ScrollArea className="card-child-wrapper w-full h-full rounded-md">
        <div className="px-4 flex flex-col gap-[14px] items-center justify-center pb-[2px]">
          {instances.length > 0 ? (
            <div className="flex flex-col gap-[14px] w-full h-full pt-[2px]">
              {instances.map((instance: Instance) => (
                <div
                  key={instance.instanceId} // Use instanceId as the key
                  className={`p-2 bg-opacity-50 rounded-[5px] border flex items-center w-full cursor-pointer transition-all transform ${
                    selectedInstance?.instanceId === instance.instanceId ? 'border-green-500 scale-[101.5%]' : 'border-white scale-[100%]'
                  } hover:border-green-500 hover:scale-[101.5%]`}
                  onClick={() => handleInstanceSelect(instance)}
                >
                  <div className="flex items-center justify-center w-[52px] h-[52px]">
                    <Avatar className="w-full h-full">
                      <AvatarImage
                        className="hover:cursor-pointer w-full h-full"
                        src={instance.instanceAvatar}
                        alt="avatar"
                        onClick={() => navigate('/instance/' + instance.instanceId)}
                      />
                      <AvatarFallback>Avatar</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-poppins text-xl font-medium leading-9 text-left cursor-pointer">
                      {instance.instanceName}
                    </h3>
                    <Button
                      onClick={() => {
                        setOpenModal(true)
                        setDeleteId(instance.instanceId)
                      }}
                      variant="destructive"
                      className="w-[60px] h-[19px] bg-destructive font-normal text-white rounded-full text-[12px] text-center flex items-center justify-center"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full m-11">
              <AddInstance />
            </div>
          )}
          {instances.length < 5 && (
            <div className="w-full">
              <AddInstance />
            </div>
          )}
        </div>
      </ScrollArea>

      {openModal && (
        <AlertDialog 
          deleteId={deleteId} 
          setOpenModal={setOpenModal} 
          onDeleteSuccess={() => {
            handleDeleteInstance(deleteId) // Handle deletion logic
            // Dispatch delete action here if needed
          }} 
        />
      )}
    </div>
  )
}

export default InstanceList

