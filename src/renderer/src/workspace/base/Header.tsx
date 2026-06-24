import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faBell, faEnvelope, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { getSelectedInstance } from '@renderer/redux/slices/SelectedInstanceSlice'
import { Button } from '@renderer/components/ui/button'
import { usePlan } from '@renderer/hooks/usePlan'

const PLAN_BADGE: Record<string, { label: string; variant: 'free' | 'pro' | 'enterprise' }> = {
  free: { label: 'Free Plan', variant: 'free' },
  pro: { label: 'Pro Plan', variant: 'free' },
  enterprise: { label: 'Enterprise', variant: 'free' },
}

export function Header({ activeItem }: { activeItem: string }): JSX.Element {
  const navigate = useNavigate()
  const selectedInstance = useSelector(getSelectedInstance)
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const { plan } = usePlan()
  const planBadge = PLAN_BADGE[plan] ?? PLAN_BADGE.free

  const handleMessageClick = () => {
    navigate('/masterinbox')
  }

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
  }

  // Close notifications if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="flex items-center p-5 gap-2.5 border-b border-gray-300 bg-gray-200 rounded-tl-[55px] w-full relative">
      <div className="flex items-center gap-1.5">
        <FontAwesomeIcon icon={faBars} className="text-black text-sm" />
        <h1 className="text-black font-poppins tracking-wide text-lg">
          {activeItem.charAt(0).toUpperCase() + activeItem.slice(1)}
        </h1>
        <p className="text-blue-500 font-poppins tracking-wide text-xs font-bold ml-[-1px] cursor-pointer flex items-center mt-[5px]">
          LiveChat
        </p>
      </div>
      <div className="flex gap-2.5 ml-auto items-center">
        <Button className="rounded-full font-medium py-0" variant={planBadge.variant}>
          {planBadge.label}
        </Button>
        <FontAwesomeIcon icon={faMagnifyingGlass} className="text-black md:text-lg text-sm" />
        <input
          type="text"
          placeholder="Try to Searching"
          className="p-2.5 bg-white rounded-lg border border-gray-300 text-xs w-full md:w-[250px]"
        />
        <div
          onClick={handleMessageClick}
          className="cursor-pointer hover:bg-gray-100 rounded-full p-2"
        >
          <FontAwesomeIcon icon={faEnvelope} className="text-black md:text-lg text-sm" />
        </div>
        <div
          onClick={toggleNotifications}
          className="cursor-pointer hover:bg-gray-100 rounded-full p-2 relative"
        >
          <FontAwesomeIcon icon={faBell} className="text-black md:text-lg text-sm" />
          {showNotifications && (
            <div
              ref={notificationRef}
              className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
            >
              <div className="p-4">
                <h3 className="text-sm font-semibold mb-2">Notifications</h3>
                <p className="text-xs text-gray-500">No new notifications</p>
              </div>
            </div>
          )}
        </div>
        <img
          src={selectedInstance?.instanceAvatar}
          alt="avatar"
          className="ml-5 w-12 h-12 rounded-full border border-black md:block hidden"
        />
      </div>
    </div>
  )
}

export default Header
