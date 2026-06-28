import { useEffect, useRef, useState } from 'react'
import { Bot, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

type AiStatus =
  | { status: 'fixing'; selector: string; platform: string }
  | { status: 'fixed'; selector: string; replacement: string; platform: string }
  | { status: 'failed'; selector: string; platform: string }
  | { status: 'no-key' }

interface AiFixingModalProps {
  data: AiStatus
  onClose: () => void
}

function AiFixingModal({ data, onClose }: AiFixingModalProps): JSX.Element {
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Start timer when fixing, stop and auto-close on resolution
  useEffect(() => {
    if (data.status === 'fixing') {
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      const delay = data.status === 'fixed' ? 2000 : 3500
      const t = setTimeout(onClose, delay)
      return () => clearTimeout(t)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [data.status, onClose])

  const platform = 'platform' in data ? data.platform : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[420px] p-6 flex flex-col items-center gap-4 font-poppins">

        {/* Icon */}
        <div className="relative">
          {data.status === 'fixing' && (
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
              <Bot className="w-8 h-8 text-indigo-600" />
              <span className="absolute -top-1 -right-1">
                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
              </span>
            </div>
          )}
          {data.status === 'fixed' && (
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          )}
          {(data.status === 'failed' || data.status === 'no-key') && (
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          )}
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          {data.status === 'fixing' && (
            <>
              <h2 className="text-lg font-semibold text-gray-900">AI is fixing the issue</h2>
              <p className="text-sm text-gray-500">
                Analyzing {platform} page and generating a fix…
              </p>
            </>
          )}
          {data.status === 'fixed' && (
            <>
              <h2 className="text-lg font-semibold text-green-700">Issue fixed!</h2>
              <p className="text-sm text-gray-500">Retrying with the corrected selector…</p>
            </>
          )}
          {data.status === 'failed' && (
            <>
              <h2 className="text-lg font-semibold text-red-600">AI could not fix this</h2>
              <p className="text-sm text-gray-500">
                The issue persists on {platform}. Check the error report for details.
              </p>
            </>
          )}
          {data.status === 'no-key' && (
            <>
              <h2 className="text-lg font-semibold text-red-600">OpenRouter key not set</h2>
              <p className="text-sm text-gray-500">
                Go to Settings → My Profile and add your OpenRouter API key to enable AI fixing.
              </p>
            </>
          )}
        </div>

        {/* Details */}
        {data.status === 'fixing' && (
          <div className="w-full bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Selector</span>
              <span className="font-mono text-gray-700 truncate max-w-[260px] text-right">
                {'selector' in data ? data.selector : ''}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Elapsed</span>
              <span className="font-mono text-gray-700">{elapsed}s</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Step</span>
              <span className="text-indigo-600">Trying HTML analysis…</span>
            </div>
          </div>
        )}

        {data.status === 'fixed' && (
          <div className="w-full bg-green-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Original</span>
              <span className="font-mono text-gray-600 truncate max-w-[260px] text-right line-through">
                {'selector' in data ? data.selector : ''}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Fixed</span>
              <span className="font-mono text-green-700 truncate max-w-[260px] text-right">
                {'replacement' in data ? data.replacement : ''}
              </span>
            </div>
            <p className="text-xs text-gray-400 text-center pt-1">Saved to Firestore permanently</p>
          </div>
        )}

        {/* Timer bar for fixing state */}
        {data.status === 'fixing' && (
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full animate-pulse"
              style={{ width: `${Math.min((elapsed / 60) * 100, 95)}%`, transition: 'width 1s linear' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Container — mounted in App.tsx, listens for ai-fix-status events ──────────

export interface AiFixEvent {
  status: string
  selector?: string
  replacement?: string
  platform?: string
}

export function AiFixingOverlay(): JSX.Element | null {
  const [current, setCurrent] = useState<AiStatus | null>(null)

  useEffect(() => {
    const handler = (data: Record<string, unknown>) => {
      setCurrent(data as unknown as AiStatus)
    }
    window.aiAPI.onFixStatus(handler)
    return () => {
      window.aiAPI.offFixStatus(handler)
    }
  }, [])

  if (!current) return null

  return <AiFixingModal data={current} onClose={() => setCurrent(null)} />
}

export default AiFixingModal
