import React, { useState } from 'react'
import SiALogo from './SiALogo'
import ButtonForCard from './ButtonForCard'
import { CSSTransition } from 'react-transition-group'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setInstanceId } from '@renderer/redux/slices/SelectedInstanceSlice'

interface OnboardCardLayoutProps {
  heading: string
  paragraph: string
  loading?: boolean
  disable?: boolean
  cancelBtn?: boolean
  btnText: string // Add btnText prop
  onClick: () => boolean | void | Promise<boolean | void>
  children?: React.ReactNode
}

const OnboardCardLayout: React.FC<OnboardCardLayoutProps> = ({
  heading,
  paragraph,
  loading,
  disable,
  btnText,
  onClick,
  cancelBtn,
  children
}) => {
  const [show, setShow] = useState(true)
  const navigate=useNavigate();
const dispatch = useDispatch()

  const handleClick = async (): Promise<void> => {
    const result = await onClick()
    if (result === true) {
      setShow(false)
    }
  }
  const handleCancelClick = (): void => {
    dispatch(setInstanceId(''));
      navigate('/instance')
  };
  return (
    <CSSTransition
      in={show}
      timeout={100}
      classNames={{
        enter: 'animate-fade-blur-enter',
        exit: 'animate-fade-blur-exit'
      }}
      unmountOnExit
    >
      <div className=" onboard-card animate-fade-blur-enter transition-all ">
        <SiALogo className="w-[199px] h-[109.91px] left-0 right-0 mx-auto top-[40px] absolute" />
        <h1 className=" font-poppins text-4xl font-bold leading-[40px] tracking-[2px] text-center left-0 right-0 mx-auto top-[185px] absolute">
          {heading}
        </h1>
        <p className="w-[372px] font-poppins text-base text-center left-0 right-0 mx-auto top-[235px] absolute">
          {paragraph}
        </p>
        <div className="w-[382px] h-[160px] left-0 right-0 mx-auto top-[275px] absolute">
          {children}
        </div>
        <div className={`w-[382px] left-0 right-0 mx-auto  ${cancelBtn?' top-[420px] ':' top-[440px] '} absolute cursor-pointer`}>
          <ButtonForCard
            btnText={btnText}
            onClick={handleClick}
            loading={loading}
            variant="secondary"
            disable={disable}
          />
          {
            cancelBtn && 
            
          <ButtonForCard
            btnText='Cancel'
            onClick={handleCancelClick}
            variant="outline"
          />
          }
        </div>
      </div>
    </CSSTransition>
  )
}

export default OnboardCardLayout
