import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import addAvatar from '../../assets/addAvatar.svg'
import { Button } from '@renderer/components/ui/button'
// import { toast } from '@renderer/hooks/use-toast'
// import { useSelector } from 'react-redux'
// import { RootState } from '@renderer/redux/store'

const AddInstance = (): JSX.Element => {
  const navigate = useNavigate()
  // const instances = useSelector((state: RootState) => state.instance.instances) // Get instances from Redux state

  const handleAddInstance = (): void => {
    // if (instances.length >= 5) {
    //   toast({
    //     title: 'Instance Limit Reached',
    //     description: 'You can only add up to 5 instances',
    //     variant: 'destructive'
    //   })
    // } else
    navigate('/instance/create')
  }

  return (
    <div className=" card-child-wrapper w-full h-[72px] ">
      <div className="flex flex-col gap-4  w-full h-full">
        <div
          className="p-2 bg-opacity-50 rounded-[5px] border border-white flex items-center w-full hover:border-green-500 cursor-pointer transition-all transform hover:scale-[101.5%] 2s ease-in-out "
          onClick={handleAddInstance}
        >
          <div className="flex items-center justify-center w-[52px] h-[52px]">
            <Avatar className="w-full h-full">
              <AvatarImage
                className="hover:cursor-pointer w-full h-full"
                src={addAvatar}
                alt="avatar"
              />
              <AvatarFallback>Avatar</AvatarFallback>
            </Avatar>
          </div>
          <div className="ml-4">
            <h3 className="font-poppins text-xl font-medium leading-9 text-left">Add Instance</h3>
            <Button
              onClick={handleAddInstance}
              className="w-[148px] h-[19px] bg-[#FDF902] font-semibold text-black rounded-full text-[12px] text-center flex items-center justify-center shadow hover:bg-[#FDF902]/90"
            >
              Setup new instance
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddInstance
