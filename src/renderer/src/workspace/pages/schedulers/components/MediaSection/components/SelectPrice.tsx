import { Switch } from '@renderer/components/ui/switch' // Adjust import path as needed
import { Input } from '@renderer/components/ui/input'
import { useEffect, useState } from 'react'
import { RootState } from '@renderer/redux/store'
import { setPrice } from '@renderer/redux/slices/currentSlice'
import { useDispatch, useSelector } from 'react-redux'

const SelectPrice = (): JSX.Element => {
  const scheduler = useSelector((state: RootState) => state.currentScheduler)
  const dispatch = useDispatch()
  const [priceSelect, setPriceSelect] = useState(false) // Switch state
  const [inputPrice, setInputPrice] = useState(0) // Price, default is 0


  // When platform changes, reset switch and price
  useEffect(() => {
    if (!scheduler.platform.toLowerCase().includes('of')) {
      setPriceSelect(false)
      setInputPrice(0) // Reset price to 0 for non-OF platforms
    }
  }, [scheduler])

  // Dispatch price to Redux when inputPrice changes
  useEffect(() => {
    dispatch(setPrice(inputPrice))
  }, [inputPrice, dispatch])

  const handleSwitchClick = () => {
    if (scheduler.platform.toLowerCase().includes('of')) {
      const newPriceSelect = !priceSelect
      setPriceSelect(newPriceSelect)

      if (newPriceSelect) {
        setInputPrice(0) // Set price to 3 when switch is enabled
      } else {
        setInputPrice(0) // Set price to 0 when switch is disabled
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Number(e.target.value)) // Ensure min value is 3
    setInputPrice(value)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-poppins text-lg text-gray-900 tracking-wide">Set Price</h1>
        <Switch
          disabled={!scheduler.platform.toLowerCase().includes('of')} // Disable switch if platform is not OF
          checked={priceSelect} // Bind switch to priceSelect state
          onClick={handleSwitchClick} // Handle switch click
          className="ml-2 "
          style={{
            backgroundColor: priceSelect ? '#0f172a' : '#e2e8f0', // Change color based on checked state
          }}
        />
      </div>
      <Input
        type="number"
        placeholder={priceSelect ? 'Enter price' : 'Free'}
        value={inputPrice} // Use inputPrice as the value
        onChange={handleInputChange} // Handle input changes
        min={0}
        max={50}
        disabled={!priceSelect} // Disable input if switch is off
        className={`w-full bg-white h-10 px-3 py-2 text-sm tracking-wide rounded-lg border ${
          priceSelect ? 'border-gray-300' : 'border-gray-200 bg-gray-100'
        } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
      />
    </div>
  )
}

export default SelectPrice
