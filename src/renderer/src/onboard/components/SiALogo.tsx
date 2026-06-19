import React from 'react'
import SiAlogo from '../../assets/logo.svg'
type SiALogoProps = {
  className?: string
}

const SiALogo: React.FC<SiALogoProps> = ({ className }: SiALogoProps) => {
  return (
    <div className={`flex justify-center items-center  ${className}`}>
      <img src={SiAlogo} alt="Logo" className={`w-full h-full`} />
    </div>
  )
}

export default SiALogo
