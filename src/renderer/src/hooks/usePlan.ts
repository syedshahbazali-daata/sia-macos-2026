import { storage, enums } from '@renderer/helpers/storageHelper'
import type { License, Plan, PlanFeature } from '@renderer/types/license'
import { PLAN_FEATURES, FREE_SCHEDULE_LIMIT } from '@renderer/types/license'

interface PlanContext {
  plan: Plan
  license: License | null
  canAccess: (feature: PlanFeature) => boolean
  scheduleLimit: number
  isPro: boolean
  isEnterprise: boolean
}

export function usePlan(): PlanContext {
  const license = storage.getParsed(enums.LICENSE, null) as License | null
  const plan: Plan = license?.plan ?? 'free'

  return {
    plan,
    license,
    canAccess: (feature: PlanFeature) => PLAN_FEATURES[plan].includes(feature),
    scheduleLimit: plan === 'free' ? FREE_SCHEDULE_LIMIT : Infinity,
    isPro: plan === 'pro' || plan === 'enterprise',
    isEnterprise: plan === 'enterprise',
  }
}
