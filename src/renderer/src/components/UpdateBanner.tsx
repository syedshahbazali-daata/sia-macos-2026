import { useEffect, useState } from 'react'

type UpdatePhase =
  | { phase: 'idle' }
  | { phase: 'available'; version: string }
  | { phase: 'downloading'; version: string; percent: number }
  | { phase: 'ready'; version: string }

export function UpdateBanner(): JSX.Element | null {
  const [state, setState] = useState<UpdatePhase>({ phase: 'idle' })
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    window.electronAPI.onUpdateAvailable((...args: unknown[]) => {
      const info = args[1] as { version: string }
      setState({ phase: 'available', version: info.version })
      setDismissed(false)
    })

    window.electronAPI.onDownloadProgress((...args: unknown[]) => {
      const progress = args[1] as { percent: number }
      setState((prev) => {
        const version = prev.phase === 'idle' ? '' : (prev as { version: string }).version
        return { phase: 'downloading', version, percent: Math.round(progress.percent) }
      })
    })

    window.electronAPI.onUpdateDownloaded((...args: unknown[]) => {
      const info = args[1] as { version: string }
      setState({ phase: 'ready', version: info.version })
      setDismissed(false)
    })
  }, [])

  if (state.phase === 'idle' || dismissed) return null

  const handleInstall = (): void => {
    window.electronAPI.installUpdate()
  }

  return (
    <div className="fixed bottom-5 right-5 z-[9999] w-80 rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500">
        <div className="flex items-center gap-2">
          <span className="text-white text-base">↑</span>
          <span className="text-white text-sm font-semibold">
            {state.phase === 'ready' ? 'Update Ready' : 'Update Available'}
          </span>
        </div>
        {state.phase !== 'downloading' && (
          <button
            onClick={() => setDismissed(true)}
            className="text-white/70 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        <p className="text-gray-700 text-sm">
          {state.phase === 'available' && (
            <>
              Version <span className="font-semibold text-blue-600">v{state.version}</span> is
              available. Downloading in the background…
            </>
          )}
          {state.phase === 'downloading' && (
            <>
              Downloading v{state.version}…{' '}
              <span className="font-semibold text-blue-600">{state.percent}%</span>
            </>
          )}
          {state.phase === 'ready' && (
            <>
              Version <span className="font-semibold text-blue-600">v{state.version}</span> is
              ready. Restart to apply the update.
            </>
          )}
        </p>

        {/* Progress bar */}
        {(state.phase === 'available' || state.phase === 'downloading') && (
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{
                width:
                  state.phase === 'available'
                    ? '5%'
                    : `${(state as { phase: 'downloading'; percent: number }).percent}%`,
              }}
            />
          </div>
        )}

        {/* Install button */}
        {state.phase === 'ready' && (
          <button
            onClick={handleInstall}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
          >
            Restart &amp; Install
          </button>
        )}
      </div>
    </div>
  )
}
