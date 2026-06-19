import { Timestamp } from 'firebase/firestore'

export type Plan = 'free' | 'pro' | 'enterprise'

export type License = {
  id: string
  username: string
  expiry_date: Timestamp
  email: string
  license: string
  plan: Plan
}

// Features locked behind a paid plan.
// Add a feature name here and gate it with usePlan().canAccess(feature).
export type PlanFeature =
  | 'livegate'
  | 'mass-messaging'
  | 'multi-platform'
  | 'onlyfans'
  | 'unlimited-schedules'

export const PLAN_FEATURES: Record<Plan, PlanFeature[]> = {
  free: [],
  pro: ['livegate', 'multi-platform', 'onlyfans', 'unlimited-schedules'],
  enterprise: ['livegate', 'multi-platform', 'onlyfans', 'unlimited-schedules', 'mass-messaging'],
}

export const FREE_SCHEDULE_LIMIT = 5

