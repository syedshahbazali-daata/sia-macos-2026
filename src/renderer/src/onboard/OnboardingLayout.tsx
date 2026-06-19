import React, { useRef } from 'react'
import { CSSTransition, SwitchTransition } from 'react-transition-group'
import './onboardinglayout.css'

interface OnboardingLayoutProps {
  children?: React.ReactNode
  className?: string
}

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ children, className }) => {
  const nodeRef = useRef<HTMLDivElement>(null)
  return (
    <div className={`wrapper ${className}`}>
      <div id="stars"></div>
      <div id="stars2"></div>
      <div id="stars3"></div>
      <SwitchTransition>
        <CSSTransition nodeRef={nodeRef} classNames="fade" timeout={300}>
          <div className="flex justify-center items-center w-full h-screen ">{children}</div>
        </CSSTransition>
      </SwitchTransition>
    </div>
  )
}

export default OnboardingLayout
