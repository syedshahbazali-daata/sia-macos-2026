import { setSignature } from '@renderer/redux/slices/currentSlice'
import { LucideXCircle } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@renderer/redux/store'
import {useEffect, useState} from "react";

const SignatureList = ({ onClose }: { onClose: () => void }): JSX.Element => {
  const dispatch = useDispatch()
  const scheduler = useSelector((state: RootState) => state.currentScheduler);
  const [signatures, setSignatures] = useState([]);
  const currentInstanceId = scheduler.Instance_id

  useEffect(() => {
    const fetchSignatures = async () => {
      const instanceId = localStorage.getItem('selectedInstanceId');
      const currentSignatures = await window.electron.ipcRenderer.invoke('read-json-file', 'SIGNATURES') || [];

      let updatedSignatures = [...currentSignatures];
      const instanceIndex = updatedSignatures.findIndex(
        (item: Instance) => Object.keys(item)[0] === instanceId
      );

      if (instanceIndex !== -1) {
        const platformSignatures = updatedSignatures[instanceIndex][instanceId][scheduler.platform];
        let signatures_renew = []
        for (const sign in platformSignatures) {
          if (platformSignatures[sign] !== '') {
            signatures_renew.push({name: "Signature " + (signatures_renew.length + 1), signature: platformSignatures[sign]})
          }
        }
        if (signatures_renew.length > 0) {
          signatures_renew.push({name: "None", signature: ""})
        }
        setSignatures(signatures_renew);
      }
    };

    fetchSignatures();
  }, []);

  return (
    <div className="absolute bottom-2 right-0 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-sm font-semibold text-gray-700">Choose Signature</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-red-500 transition-colors duration-200"
        >
          <LucideXCircle className="w-5 h-5" />
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {signatures.map((signature, index) => (
          <div
            key={index}
            onClick={() => {
              dispatch(setSignature(signature.signature))
              onClose()
            }}
            className={`
              px-4 py-3 transition-all duration-200 cursor-pointer
              hover:bg-blue-50 group relative
              ${index !== signatures.length - 1 ? 'border-b border-gray-100' : ''}
              ${signature.name === 'None' ? 'text-gray-500 italic' : 'text-gray-700'}
            `}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{signature.name}</span>
              {signature.signature && (
                <span className="text-xs text-gray-400 truncate max-w-[120px] group-hover:text-gray-600">
                  {signature.signature}
                </span>
              )}
            </div>
            <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-5 transition-opacity duration-200"/>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SignatureList
