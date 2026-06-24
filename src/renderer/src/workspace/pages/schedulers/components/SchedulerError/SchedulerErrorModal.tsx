import { useState } from 'react'
import { AlertTriangle, Send, X, CheckCircle } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@renderer/firebase-config'
import { storage, enums } from '@renderer/helpers/storageHelper'

export interface SchedulerErrorData {
  platform: string
  errorMessage: string
  screenshotBase64: string
  timestamp: number
}

interface Props {
  error: SchedulerErrorData
  onClose: () => void
}

const SchedulerErrorModal = ({ error, onClose }: Props): JSX.Element => {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSendToSupport = async (): Promise<void> => {
    setSending(true)
    try {
      const license = storage.getParsed(enums.LICENSE, null) as { license?: string } | null
      const instanceId = localStorage.getItem('selectedInstanceId') ?? 'unknown'

      await addDoc(collection(db, 'error_reports'), {
        platform: error.platform,
        errorMessage: error.errorMessage,
        licenseCode: license?.license ?? 'unknown',
        instanceId,
        timestamp: serverTimestamp(),
        appVersion: '1.0.0',
      })

      setSent(true)
    } catch {
      // Firestore write failed — fail silently, user can still dismiss
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-red-50 border-b border-red-100">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <h2 className="text-base font-semibold text-gray-900 font-poppins">
                Scheduler Failed
              </h2>
              <p className="text-xs text-gray-500 font-poppins capitalize">{error.platform}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Error message */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 font-poppins">
              Error
            </p>
            <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2 font-mono break-words">
              {error.errorMessage}
            </p>
          </div>

          {/* Screenshot */}
          {error.screenshotBase64 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 font-poppins">
                Screenshot at time of failure
              </p>
              <div className="rounded-lg overflow-hidden border border-gray-200 max-h-48">
                <img
                  src={`data:image/png;base64,${error.screenshotBase64}`}
                  alt="Error screenshot"
                  className="w-full object-cover object-top"
                />
              </div>
            </div>
          )}

          {sent && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-3 py-2 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span className="font-poppins">Report sent to support. We'll look into it.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-900"
          >
            Dismiss
          </Button>
          {!sent && (
            <Button
              size="sm"
              onClick={handleSendToSupport}
              disabled={sending}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending…' : 'Send to Support'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SchedulerErrorModal
