import React from 'react'
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './redux/store'

// Onboarding
import OnboardingLayout from './onboard/OnboardingLayout'
import LicensePage from './onboard/pages/LicensePage'
import InstancePage from './onboard/pages/InstancePage'
import { InstanceCreate } from './onboard/pages/InstanceCreate'
import PasswordScreen from './onboard/pages/PasswordScreen'
import BrowserDownload from './onboard/pages/BrowserDownload'
import SplashScreen from './onboard/pages/SplashScreen'

// Workspace pages
import { WorkSpaceBaseLayout } from './workspace/base/Base'
import Dashboard from './workspace/pages/Dashboard/Dashboard'
import Schedulers from './workspace/pages/schedulers/Schedulers'
import Settings from './workspace/pages/Settings/Settings'
import History from './workspace/pages/History/History'
import LivegateNow from './workspace/pages/Livegate/LivegateNow'
import MasterInbox from './workspace/pages/MasterInbox/MasterInbox'
import Faq from './workspace/pages/Faq/Faq'

// UI
import { Toaster } from './components/ui/toaster'

const App: React.FC = () => {
  const routes = [
    { path: '/', element: <SplashScreen />, layout: OnboardingLayout },
    { path: '/license', element: <LicensePage />, layout: OnboardingLayout },
    { path: '/instance', element: <InstancePage />, layout: OnboardingLayout },
    { path: '/instance/create', element: <InstanceCreate />, layout: OnboardingLayout },
    { path: '/instance/:id', element: <PasswordScreen />, layout: OnboardingLayout },
    { path: '/browser/download', element: <BrowserDownload />, layout: OnboardingLayout },
    {
      path: '/dashboard',
      element: <WorkSpaceBaseLayout activeItem="dashboard" content={<Dashboard />} />,
    },
    {
      path: '/schedulers',
      element: <WorkSpaceBaseLayout activeItem="schedulers" content={<Schedulers />} />,
    },
    {
      path: '/settings',
      element: <WorkSpaceBaseLayout activeItem="settings" content={<Settings />} />,
    },
    {
      path: '/history',
      element: <WorkSpaceBaseLayout activeItem="history" content={<History />} />,
    },
    {
      path: '/livegate',
      element: <WorkSpaceBaseLayout activeItem="livegate" content={<LivegateNow />} />,
    },
    {
      path: '/masterinbox',
      element: <WorkSpaceBaseLayout activeItem="masterinbox" content={<MasterInbox />} />,
    },
    {
      path: '/faq',
      element: <WorkSpaceBaseLayout activeItem="faq" content={<Faq />} />,
    },
  ]

  return (
    <Provider store={store}>
      <Router>
        <Toaster />
        <Routes>
          <Route path="*" element={<Navigate to="/" replace />} />
          {routes.map((route, index) => {
            const Layout = route.layout || React.Fragment
            return (
              <Route
                key={index}
                path={route.path}
                element={<Layout>{route.element}</Layout>}
              />
            )
          })}
        </Routes>
      </Router>
    </Provider>
  )
}

export default App
