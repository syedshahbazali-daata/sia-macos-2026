import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse,
  faCalendar,
  faClockRotateLeft,
  faGear,
  faUsers,
  faLock,
  faQuestionCircle,
  faGlobe
} from '@fortawesome/free-solid-svg-icons'
import SiALogo from '@renderer/onboard/components/SiALogo'
import { useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/ui/button'
import './sidebar.css'
import { useDispatch, useSelector } from 'react-redux'
import { getSelectedInstance, setInstanceId } from '@renderer/redux/slices/SelectedInstanceSlice'
type SideBarProps = {
  activeItem: string
}
const Sidebar = ({ activeItem }: SideBarProps): JSX.Element => {
  // get the selected instance based on the id using getSelectedInstance method from slectedInstanceSlice
  const selectedInstance = useSelector(getSelectedInstance)!
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleLogout=()=>{
    dispatch(setInstanceId(''));
    navigate('/instance')
  }
  return (
    <div className="flex flex-col gap-2 w-[300px] h-full items-center justify-center">
      <div className="flex flex-col gap-2 w-[280px] h-[96%] bg-[#14263A] rounded-[25px_0_0_25px] overflow-y-auto">
        <div className="flex items-center justify-center h-[20%] w-[75%]">
          <div className="w-1/2">
            <SiALogo />
          </div>
        </div>
        <div className="flex flex-col items-center h-[25%] w-[75%] ">
          <img
            className="w-[80px] h-[80px] rounded-full border-2 border-white hover:transform hover:scale-110 transition-transform cursor-pointer"
            src={selectedInstance.instanceAvatar}
            alt="avatar"
          />
          <h6 className="mt-2 text-white text-sm font-semibold font-poppins">
            {selectedInstance.instanceName.charAt(0).toUpperCase() +
              selectedInstance.instanceName.slice(1)}
          </h6>
        </div>
        {/* Sidebar Items */}
        <div className="flex flex-col items-center mt-5  w-[75%]">
          <button
            className={`sidebar-button ${activeItem === 'dashboard' ? 'sidebar-button-active' : ''}`}
            onClick={() => {
              navigate('/dashboard')
            }}
          >
            <FontAwesomeIcon icon={faHouse}/>
            <div className="font-poppins">Dashboard</div>
          </button>
          <button
            className={`sidebar-button ${activeItem === 'schedulers' ? 'sidebar-button-active' : ''}`}
            onClick={() => {
              navigate('/schedulers')
            }}
          >
            <FontAwesomeIcon icon={faCalendar}/>
            <div className="font-poppins">Schedulers</div>
          </button>
          <button
            className={`sidebar-button ${activeItem === 'livegate' ? 'sidebar-button-active' : ''}`}
            onClick={() => navigate('/livegate')}
          >
            <FontAwesomeIcon icon={faUsers}/>
            <div className="font-poppins">LiveGate</div>
          </button>


          <button
            className={`sidebar-button ${activeItem === 'browser' ? 'sidebar-button-active' : ''}`}
            onClick={() => {
              window.electron.ipcRenderer.send('run-browser', selectedInstance.instanceId)

            }}
          >
            <FontAwesomeIcon icon={faGlobe}/>
            <div className="font-poppins">Browser</div>
          </button>
          <button
            className={`sidebar-button ${activeItem === 'history' ? 'sidebar-button-active' : ''}`}
            onClick={() => navigate('/history')}
          >
            <FontAwesomeIcon icon={faClockRotateLeft}/>
            <div className="font-poppins">History</div>
          </button>

          <button
            className={`sidebar-button ${activeItem === 'settings' ? 'sidebar-button-active' : ''}`}
            onClick={() => navigate('/settings')}
          >
            <FontAwesomeIcon icon={faGear}/>
            <div className="font-poppins">Settings</div>
          </button>
          <button
            className={`sidebar-button ${activeItem === 'faq' ? 'sidebar-button-active' : ''}`}
            onClick={() => navigate('/faq')}
          >
            <FontAwesomeIcon icon={faQuestionCircle}/>
            <div className="font-poppins">FAQ</div>
          </button>
        </div>
        <div className="flex flex-col items-center h-[20%] w-[75%] justify-end mb-8 gap-2">
          <Button variant="link" className="text-white">
            <FontAwesomeIcon icon={faLock}/>
            <span
              onClick={handleLogout}
              className="ml-2  text-red-500 font-poppins tracking-wide"
            >
              Logout
            </span>
          </Button>
          <span className="text-gray-500 text-[11px] font-poppins">v{__APP_VERSION__}</span>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
