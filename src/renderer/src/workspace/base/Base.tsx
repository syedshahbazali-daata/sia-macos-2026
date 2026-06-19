// *:SIDEBAR COMPONENTS:*
import { useDispatch, useSelector } from 'react-redux'
import { Header } from '../base/Header'
import Sidebar from '../sidebar/Sidebar'
import { getSelectedInstance } from '@renderer/redux/slices/SelectedInstanceSlice'
import { useEffect } from 'react'
import { setInstanceId } from '@renderer/redux/slices/currentSlice'

type WorkSpaceBaseLayoutProps = {
  content: JSX.Element
  activeItem: string
}
export function WorkSpaceBaseLayout({
  content,
  activeItem
}: WorkSpaceBaseLayoutProps): JSX.Element {
  const selectedInstance = useSelector(getSelectedInstance)!
  const dispatch = useDispatch()
  useEffect(() => {
      dispatch(setInstanceId(selectedInstance?.instanceId))
  }, [])

  return (
    <>
      <div className="flex w-full h-screen bg-[rgba(20,38,58,0.8)] p-4 overflow-hidden">
        <Sidebar activeItem={activeItem} />
        <div className="w-full h-full flex flex-col items-center justify-center bg-[rgba(242,242,242)] rounded-[55px_0_0_55px] overflow-hidden ml-[-80px]">
          <Header activeItem={activeItem} />
          <div className='h-full w-full flex items-center justify-center overflow-hidden'> {content}</div>
        </div>
      </div>
    </>
  )
}
