import React, { useEffect } from 'react'
import { HashRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './redux/store'

// Onboarding Imports
import OnboardingLayout from './onboard/OnboardingLayout'
import LicensePage from './onboard/pages/LicensePage'
import InstancePage from './onboard/pages/InstancePage'
import { InstanceCreate } from './onboard/pages/InstanceCreate'
import PasswordScreen from './onboard/pages/PasswordScreen'
import BrowserDownload from './onboard/pages/BrowserDownload'
import SplashScreen from './onboard/pages/SplashScreen'

// Workspace Imports
import { WorkSpaceBaseLayout } from './workspace/base/Base'
import Dashboard from './workspace/pages/Dashboard/Dashboard'
import Schedulers from './workspace/pages/Schedulers'
import Settings from './workspace/pages/Settings/Settings'
import History from './workspace/pages/History'
import Livegate from './workspace/pages/Livegate/Livegate'
import LivegateNow  from "./workspace/pages/Livegate/LivegateNow";

import MasterInbox from "./workspace/pages/MasterInbox/MasterInbox";
import Faq from './workspace/pages/Faq/Faq'

// UI Components
import { Toaster } from './components/ui/toaster'

// Debugging Component to log route changes
const RouteLogger: React.FC = () => {
  const location = useLocation()

  useEffect(() => {
    console.log('Current Route:', location.pathname)
  }, [location])

  return null
}

// Importing Redux

const App: React.FC = () => {
  console.log('App.tsx Rendering')






  // Define routes with their respective components and layouts
  const routes = [
    {
      path: '/',
      element: <SplashScreen />,
      layout: OnboardingLayout
    },
    {
      path: '/license',
      element: <LicensePage />,
      layout: OnboardingLayout
    },
    {
      path: '/instance',
      element: <InstancePage />,
      layout: OnboardingLayout
    },
    {
      path: '/instance/create',
      element: <InstanceCreate />,
      layout: OnboardingLayout
    },
    {
      path: '/instance/:id',
      element: <PasswordScreen />,
      layout: OnboardingLayout
    },
    {
      path: '/browser/download',
      element: <BrowserDownload />,
      layout: OnboardingLayout
    },
    {
      path: '/dashboard',
      element: <WorkSpaceBaseLayout activeItem="dashboard" content={<Dashboard />} />
    },
    {
      path: '/schedulers',
      element: <WorkSpaceBaseLayout activeItem="schedulers" content={<Schedulers />} />
    },
    {
      path: '/settings',
      element: <WorkSpaceBaseLayout activeItem="settings" content={<Settings />} />
    },
    {
      path: '/history',
      element: <WorkSpaceBaseLayout activeItem="history" content={<History />} />
    },
    // {
    //   path: '/livegate',
    //   element: <WorkSpaceBaseLayout activeItem="livegate" content={<Livegate />} />
    // },

    {
      path: '/livegate',
      element: <WorkSpaceBaseLayout activeItem="livegate" content={<LivegateNow />} />
    },




    {
      path: '/masterinbox',
      element: <WorkSpaceBaseLayout activeItem="masterinbox" content={<MasterInbox />} />
    },
    {
      path: '/faq',
      element: <WorkSpaceBaseLayout activeItem="faq" content={<Faq />} />
    }
  ]

  return (
    <Provider store={store}>
      <Router>
        {/* Add RouteLogger for debugging */}
        <RouteLogger />

        {/* Global Toaster for notifications */}
        <Toaster />

        <Routes>
          {/* Add a catch-all redirect to ensure initial navigation */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

          {/* Map through routes and apply layouts */}
          {routes.map((route, index) => {
            const Layout = route.layout || React.Fragment
            return (
              <Route
                key={index}
                path={route.path}
                element={
                  <Layout>
                    {route.element}
                  </Layout>
                }
              />
            )
          })}
        </Routes>
      </Router>
    </Provider>
  )
}

export default App
