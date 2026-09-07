export type Language = 'es' | 'en'

export type Activity = 'employee' | 'self_employed' | 'unemployed' | 'retired' | 'student' | 'other_inactive'
export type Education = 'primary' | 'lower_secondary' | 'upper_secondary' | 'tertiary'
export type Household = 'alone' | 'two_no_children' | 'one_parent' | 'two_with_children' | 'other_no_children' | 'other_with_children'
export type IncomeBand = 'under_15k' | '15_25k' | '25_40k' | '40_60k' | '60k_plus'
export type Variant = 'exact' | 'age' | 'income' | 'both'
export type Quality = 'standard' | 'low' | 'suppressed'

export interface ProfileState {
  age: number
  region: string
  activity: Activity
  education: Education
  household: Household
  income: number | null
  include: Record<'activity' | 'education' | 'household' | 'income' | 'region', boolean>
}

export interface LookupRecord {
  mask: number
  age: string | null
  activity: string | null
  education: string | null
  household: string | null
  income: string | null
  region: string | null
  estimate: number | null
  sampleN: number
  effectiveN: number
  quality: Quality
  variant: Variant
}

export interface ContextData {
  metadata: Record<string, unknown>
  age: Array<{ age: number; count: number }>
  regions: Array<{ region: string; count: number }>
  activity: Array<{ age_band: string | null; activity: string; estimate: number; denominator: number; share: number; scope: string }>
  education: Array<{ age_band: string | null; education: string; estimate: number; denominator: number; share: number; scope: string }>
  household: Array<{ age_band: string | null; household: string; estimate: number; denominator: number; share: number; scope: string }>
  income_quantiles: Array<{ percentile: number; value: number }>
  income_histogram: Array<{ lower: number; upper: number | null; estimate: number }>
  salary_population: number
  salary_sample_n: number
}

export interface ResolvedEstimate {
  record: LookupRecord | null
  variant: Variant | 'unavailable'
  definition: Record<string, string>
}
