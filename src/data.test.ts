import { describe, expect, it } from 'vitest'
import { incomeBand, resolveEstimate, selectionFor } from './data'
import type { LookupRecord, ProfileState } from './types'

const profile: ProfileState = {
  age: 33,
  region: 'ES30',
  activity: 'employee',
  education: 'tertiary',
  household: 'two_no_children',
  income: 36000,
  include: { activity: true, education: true, household: true, income: true, region: false }
}

const record = (overrides: Partial<LookupRecord>): LookupRecord => ({
  mask: 31,
  age: '30-34',
  activity: 'employee',
  education: 'tertiary',
  household: 'two_no_children',
  income: '25_40k',
  region: null,
  estimate: 95000,
  sampleN: 80,
  effectiveN: 55,
  quality: 'standard',
  variant: 'exact',
  ...overrides
})

describe('profile category mapping', () => {
  it('maps salary boundaries deterministically', () => {
    expect(incomeBand(14999)).toBe('under_15k')
    expect(incomeBand(15000)).toBe('15_25k')
    expect(incomeBand(40000)).toBe('40_60k')
    expect(incomeBand(60000)).toBe('60k_plus')
  })

  it('keeps region out unless selected', () => {
    expect(selectionFor(profile)).not.toHaveProperty('region')
    expect(selectionFor({ ...profile, include: { ...profile.include, region: true } })).toHaveProperty('region', 'ES30')
  })
})

describe('sparse-profile resolution', () => {
  it('uses the exact cell when it is standard quality', () => {
    const result = resolveEstimate([record({})], profile)
    expect(result.variant).toBe('exact')
    expect(result.record?.estimate).toBe(95000)
  })

  it('uses the precomputed broad-age cell when exact support is low', () => {
    const records = [
      record({ quality: 'low', estimate: 62000, sampleN: 31, effectiveN: 22 }),
      record({ age: '30-39', variant: 'age', estimate: 181000, sampleN: 143, effectiveN: 91 })
    ]
    const result = resolveEstimate(records, profile)
    expect(result.variant).toBe('age')
    expect(result.record?.estimate).toBe(181000)
  })

  it('does not publish a suppressed exact estimate when no fallback exists', () => {
    const result = resolveEstimate([record({ quality: 'suppressed', estimate: null, sampleN: 8, effectiveN: 6 })], profile)
    expect(result.variant).toBe('unavailable')
    expect(result.record).toBeNull()
  })
})
