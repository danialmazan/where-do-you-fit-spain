import type { ContextData, IncomeBand, LookupRecord, ProfileState, ResolvedEstimate, Variant } from './types'

const DIMENSIONS = [
  ['age', 'age_band', 1],
  ['activity', 'activity', 2],
  ['education', 'education', 4],
  ['household', 'household', 8],
  ['income', 'income', 16],
  ['region', 'region', 32]
] as const

const recordIndexCache = new WeakMap<LookupRecord[], Map<string, LookupRecord>>()

const lookupKey = (
  mask: number,
  variant: Variant,
  values: Partial<Record<'age' | 'activity' | 'education' | 'household' | 'income' | 'region', string | null>>,
) => [mask, variant, values.age ?? '', values.activity ?? '', values.education ?? '', values.household ?? '', values.income ?? '', values.region ?? ''].join('|')

const ageBand = (age: number) => {
  if (age < 25) return '18-24'
  if (age < 30) return '25-29'
  if (age < 35) return '30-34'
  if (age < 40) return '35-39'
  if (age < 45) return '40-44'
  if (age < 50) return '45-49'
  if (age < 55) return '50-54'
  if (age < 60) return '55-59'
  if (age < 65) return '60-64'
  if (age < 75) return '65-74'
  if (age < 86) return '75-85'
  return '86+'
}

const wideAge = (age: number) => {
  if (age < 30) return '18-29'
  if (age < 40) return '30-39'
  if (age < 50) return '40-49'
  if (age < 60) return '50-59'
  if (age < 75) return '60-74'
  return '75+'
}

export const incomeBand = (income: number): IncomeBand => {
  if (income < 15000) return 'under_15k'
  if (income < 25000) return '15_25k'
  if (income < 40000) return '25_40k'
  if (income < 60000) return '40_60k'
  return '60k_plus'
}

const wideIncome = (income: number) => income < 25000 ? 'under_25k' : income < 60000 ? '25_60k' : '60k_plus'

interface Payload {
  metadata: { weighted_adult_population: number }
  columns: string[]
  records: Array<Array<string | number | null>>
}

export interface LoadedData {
  records: LookupRecord[]
  context: ContextData
  adultPopulation: number
}

export async function loadData(): Promise<LoadedData> {
  const base = import.meta.env.BASE_URL
  const [lookupResponse, contextResponse] = await Promise.all([
    fetch(`${base}data/profile-lookups.json`),
    fetch(`${base}data/context.json`)
  ])
  if (!lookupResponse.ok || !contextResponse.ok) throw new Error('data-load')
  const payload = await lookupResponse.json() as Payload
  const context = await contextResponse.json() as ContextData
  const col = Object.fromEntries(payload.columns.map((name, index) => [name, index]))
  const records = payload.records.map((row): LookupRecord => ({
    mask: Number(row[col.mask]), age: row[col.a] as string | null, activity: row[col.t] as string | null,
    education: row[col.e] as string | null, household: row[col.h] as string | null, income: row[col.i] as string | null,
    region: row[col.r] as string | null, estimate: row[col.p] === null ? null : Number(row[col.p]), sampleN: Number(row[col.n]),
    effectiveN: Number(row[col.ne]), quality: row[col.q] as LookupRecord['quality'], variant: row[col.v] as Variant
  }))
  return { records, context, adultPopulation: payload.metadata.weighted_adult_population }
}

export function selectionFor(profile: ProfileState, includeKeys?: Array<keyof ProfileState['include']>, variant: Variant = 'exact') {
  const included = new Set(includeKeys ?? Object.keys(profile.include).filter(key => profile.include[key as keyof ProfileState['include']]) as Array<keyof ProfileState['include']>)
  const selection: Record<string, string> = { age_band: variant === 'age' || variant === 'both' ? wideAge(profile.age) : ageBand(profile.age) }
  if (included.has('activity')) selection.activity = profile.activity
  if (included.has('education')) selection.education = profile.education
  if (included.has('household')) selection.household = profile.household
  if (included.has('income') && profile.activity === 'employee' && profile.income !== null) {
    selection.income = variant === 'income' || variant === 'both' ? wideIncome(profile.income) : incomeBand(profile.income)
  }
  if (included.has('region')) selection.region = profile.region
  return selection
}

export function findRecord(records: LookupRecord[], selection: Record<string, string>, variant: Variant): LookupRecord | null {
  const mask = DIMENSIONS.reduce((sum, [, key, bit]) => selection[key] ? sum + bit : sum, 0)
  let index = recordIndexCache.get(records)
  if (!index) {
    index = new Map(records.map(record => [lookupKey(record.mask, record.variant, record), record]))
    recordIndexCache.set(records, index)
  }
  const values = Object.fromEntries(DIMENSIONS.map(([recordKey, selectionKey]) => [recordKey, selection[selectionKey] ?? null]))
  return index.get(lookupKey(mask, variant, values)) ?? null
}

export function resolveEstimate(records: LookupRecord[], profile: ProfileState, includeKeys?: Array<keyof ProfileState['include']>): ResolvedEstimate {
  const exactSelection = selectionFor(profile, includeKeys, 'exact')
  const exact = findRecord(records, exactSelection, 'exact')
  if (exact?.quality === 'standard' && exact.estimate !== null) return { record: exact, variant: 'exact', definition: exactSelection }

  const hasAge = Boolean(exactSelection.age_band)
  const hasIncome = Boolean(exactSelection.income)
  const variants: Variant[] = [...(hasAge ? ['age' as const] : []), ...(hasIncome ? ['income' as const] : []), ...(hasAge && hasIncome ? ['both' as const] : [])]
  for (const variant of variants) {
    const selection = selectionFor(profile, includeKeys, variant)
    const candidate = findRecord(records, selection, variant)
    if (candidate?.quality === 'standard' && candidate.estimate !== null) return { record: candidate, variant, definition: selection }
  }
  return { record: null, variant: 'unavailable', definition: exactSelection }
}

export const getAgeBand = ageBand
