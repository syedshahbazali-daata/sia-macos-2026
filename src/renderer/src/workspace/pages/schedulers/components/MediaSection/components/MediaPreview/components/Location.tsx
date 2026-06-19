import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@renderer/components/ui/select'
import { setCity } from '@renderer/redux/slices/currentSlice'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

const cityLocations = {
  'Japan/Tokyo': 'Japan/Tokyo (8.209.255.13)',
  'Spain/Madrid': 'Spain/Madrid (85.62.10.89)',
  'India/Delhi': 'India/Delhi (203.122.6.28)',
  'India/Mumbai': 'India/Mumbai (183.87.160.62)',
  'Australia/Sydney': 'Australia/Sydney (159.196.157.188)',
  'Brazil/Rio de Janeiro': 'Brazil/Rio de Janeiro (192.168.0.101)',
  'United Kingdom/London': 'United Kingdom/London (192.168.0.102)',
  'Mexico/Mexico City': 'Mexico/Mexico City (192.168.0.103)',
  'Italy/Rome': 'Italy/Rome (192.168.0.104)',
  'United States/New York City': 'United States/New York City (192.168.0.105)',
  'China/Hong Kong': 'China/Hong Kong (192.168.0.106)'
};

function LocationSwitcher(): JSX.Element {
  const [selectedCityLocation, setSelectCityLocation] = useState('')
  const dispatch = useDispatch()

  useEffect(() => {
    if (selectedCityLocation) {
      dispatch(setCity(selectedCityLocation))
    }
  }, [selectedCityLocation])
  return (
    <div id="set-location-switch">
      <h1 className="font-poppins text-lg text-gray-900 tracking-wide">Switch Location</h1>
      <div className="flex flex-row gap-5 mt-2">
        <Select onValueChange={(value) => setSelectCityLocation(cityLocations[value])}>
          <SelectTrigger className="bg-white p-2 w-full">
            <SelectValue placeholder="SELECT LOCATION" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(cityLocations).map(([city_location], index) => (
              <SelectItem value={city_location} key={index}>
                {city_location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default LocationSwitcher
