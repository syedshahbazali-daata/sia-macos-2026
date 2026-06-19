import React from 'react'
import type { PlanFeature } from '@renderer/types/license'
import { usePlan } from '@renderer/hooks/usePlan'

interface PlanGateProps {
  feature: PlanFeature
  children: React.ReactNode
  fallback?: React.ReactNode
}

const DefaultUpgradePrompt: React.FC<{ feature: PlanFeature }> = ({ feature }) => (
  <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
    <div className="text-4xl">🔒</div>
    <h2 className="text-xl font-semibold text-white">Pro Feature</h2>
    <p className="text-gray-400 max-w-sm">
      <span className="capitalize">{feature.replace(/-/g, ' ')}</span> is available on the Pro
      plan. Upgrade your license to unlock this feature.
    </p>
    <a
      href="https://sia.app/upgrade"
      target="_blank"
      rel="noreferrer"
      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
    >
      Upgrade to Pro
    </a>
  </div>
)

/**
 * Renders children only if the active license plan includes the given feature.
 * Shows an upgrade prompt (or a custom fallback) for free users.
 */
const PlanGate: React.FC<PlanGateProps> = ({ feature, children, fallback }) => {
  const { canAccess } = usePlan()

  if (!canAccess(feature)) {
    return <>{fallback ?? <DefaultUpgradePrompt feature={feature} />}</>
  }

  return <>{children}</>
}

export default PlanGate
