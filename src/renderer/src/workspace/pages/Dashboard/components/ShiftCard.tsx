import { Card } from "@renderer/components/ui/card";
import { Info } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';


const ShiftCard = () => {
  return (
    <Card className="col-span-3 bg-white">
            <div className="p-4 h-full">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="xl:text-lg text-sm font-medium text-gray-900">My shifts</h2>
                <div className="w-[18px] h-[18px] rounded-full bg-gray-100 flex items-center justify-center">
                  <Info size={12} className="text-gray-400" />
                </div>
              </div>

              <div className="flex items-center justify-center rounded-lg h-full">
                <div className="text-center flex items-center justify-center flex-col">
                  <FontAwesomeIcon
                    icon={faFileLines}
                    size="3x"
                    className={`text-gray-400 mb-2`}
                  />
                  <span className="text-[13px] text-gray-400">No data</span>
                </div>
              </div>
            </div>
          </Card>
  )
}

export default ShiftCard