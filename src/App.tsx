import { useEffect, useMemo, useRef, useState } from 'react'
import { getAgeBand, loadData, resolveEstimate } from './data'
import type { LoadedData } from './data'
import { labels } from './i18n'
import type { Copy } from './i18n'
import type { Activity, Education, Household, Language, ProfileState, Variant } from './types'

const activityOptions: Activity[] = ['employee', 'self_employed', 'unemployed', 'retired', 'student', 'other_inactive']
const educationOptions: Education[] = ['primary', 'lower_secondary', 'upper_secondary', 'tertiary']
const householdOptions: Household[] = ['alone', 'two_no_children', 'one_parent', 'two_with_children', 'other_no_children', 'other_with_children']

const initialProfile: ProfileState = {
  age: 34,
  region: 'ES30',
  activity: 'employee',
  education: 'tertiary',
  household: 'two_no_children',
  income: 36000,
  include: { activity: true, education: true, household: true, income: true, region: false }
}

const formatNumber = (value: number, language: Language) => new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-GB').format(value)
const formatPercent = (value: number, language: Language, digits = 1) => new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-GB', { maximumFractionDigits: digits }).format(value * 100)

const displayAgeRange = (value: string | undefined, language: Language) => {
  if (!value) return ''
  if (value.endsWith('+')) return language === 'es' ? `${value.slice(0, -1)} años o más` : `age ${value.slice(0, -1)}+`
  const range = value.replace('-', language === 'es' ? ' a ' : '–')
  return language === 'es' ? `${range} años` : `ages ${range}`
}

const displayIncomeRange = (value: string | undefined, language: Language) => {
  const labels = language === 'es'
    ? { under_25k: 'menos de 25.000 €', '25_60k': 'de 25.000 € a 59.999 €', '60k_plus': '60.000 € o más' }
    : { under_25k: 'under €25,000', '25_60k': '€25,000–€59,999', '60k_plus': '€60,000 or more' }
  return value ? labels[value as keyof typeof labels] ?? value : ''
}

function roundedEstimate(value: number) {
  const unit = value < 100000 ? 1000 : value < 1000000 ? 10000 : 100000
  return Math.round(value / unit) * unit
}

function languageFromUrl(): Language {
  return new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'es'
}

function IncludeToggle({ checked, onChange, copy }: { checked: boolean; onChange: (checked: boolean) => void; copy: Copy }) {
  return (
    <label className="include-toggle">
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
      <span aria-hidden="true" />
      {copy.includeProfile}
    </label>
  )
}

function SelectField({ id, label, help, value, onChange, children, include, onInclude, copy }: {
  id: string; label: string; help?: string; value: string; onChange: (value: string) => void; children: React.ReactNode;
  include?: boolean; onInclude?: (checked: boolean) => void; copy: Copy
}) {
  return (
    <div className="field-row">
      <div className="field-copy"><label htmlFor={id}>{label}</label>{help && <p>{help}</p>}</div>
      <div className="field-control">
        <select id={id} value={value} onChange={event => onChange(event.target.value)}>{children}</select>
        {onInclude && <IncludeToggle checked={Boolean(include)} onChange={onInclude} copy={copy} />}
      </div>
    </div>
  )
}

function App() {
  const [language, setLanguage] = useState<Language>(languageFromUrl)
  const [profile, setProfile] = useState<ProfileState>(initialProfile)
  const [ageInput, setAgeInput] = useState(String(initialProfile.age))
  const [data, setData] = useState<LoadedData | null>(null)
  const [error, setError] = useState(false)
  const resultsRef = useRef<HTMLElement>(null)
  const t = labels[language]

  useEffect(() => {
    loadData().then(setData).catch(() => setError(true))
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
    document.title = language === 'es' ? '¿Dónde encajas en España?' : 'Where do you fit in Spain?'
    const url = new URL(location.href)
    if (language === 'en') url.searchParams.set('lang', 'en'); else url.searchParams.delete('lang')
    history.replaceState({}, '', url)
  }, [language])

  const setInclude = (key: keyof ProfileState['include'], checked: boolean) => setProfile(current => ({ ...current, include: { ...current.include, [key]: checked } }))

  const activeKeys = useMemo(() => {
    const order: Array<keyof ProfileState['include']> = ['activity', 'education', 'household']
    if (profile.activity === 'employee' && profile.income !== null) order.push('income')
    if (profile.include.region) order.push('region')
    return order.filter(key => profile.include[key])
  }, [profile])

  const finalEstimate = useMemo(() => data ? resolveEstimate(data.records, profile, activeKeys) : null, [data, profile, activeKeys])

  const progression = useMemo(() => {
    if (!data) return []
    const steps: Array<{ keys: Array<keyof ProfileState['include']>; label: string }> = [{ keys: [], label: `${t.age}: ${profile.age}` }]
    activeKeys.forEach((key, index) => {
      const label = key === 'activity' ? t.activityLabels[profile.activity]
        : key === 'education' ? t.educationLabels[profile.education]
        : key === 'household' ? t.householdLabels[profile.household]
        : key === 'income' ? `${t.income}: €${formatNumber(profile.income ?? 0, language)}`
        : t.regionLabels[profile.region as keyof typeof t.regionLabels]
      steps.push({ keys: activeKeys.slice(0, index + 1), label })
    })
    return steps.map(step => ({ ...step, result: resolveEstimate(data.records, profile, step.keys) }))
  }, [data, profile, activeKeys, t, language])

  const position = useMemo(() => {
    if (!data) return null
    const total = data.context.age.reduce((sum, row) => sum + row.count, 0)
    const younger = data.context.age.filter(row => row.age < profile.age).reduce((sum, row) => sum + row.count, 0) / total
    const older = data.context.age.filter(row => row.age > profile.age).reduce((sum, row) => sum + row.count, 0) / total
    const ageBand = getAgeBand(profile.age)
    const activity = data.context.activity.find(row => row.scope === 'age' && row.age_band === ageBand && row.activity === profile.activity)?.share ?? 0
    const education = data.context.education.find(row => row.scope === 'age' && row.age_band === ageBand && row.education === profile.education)?.share ?? 0
    const household = data.context.household.find(row => row.scope === 'age' && row.age_band === ageBand && row.household === profile.household)?.share ?? 0
    const salaryPercentile = profile.activity === 'employee' && profile.income !== null
      ? Math.max(1, data.context.income_quantiles.filter(row => row.value <= profile.income!).at(-1)?.percentile ?? 1)
      : null
    return { younger, older, activity, education, household, salaryPercentile }
  }, [data, profile])

  const estimate = finalEstimate?.record?.estimate ?? null
  const rounded = estimate === null ? null : roundedEstimate(estimate)
  const oneIn = estimate && data ? Math.max(2, Math.round(data.adultPopulation / estimate)) : null
  const populationShare = estimate && data ? estimate / data.adultPopulation : null
  const dotCount = estimate && data ? Math.max(2, Math.round(120 * Math.pow(estimate / data.adultPopulation, 0.42))) : 0
  const maxProgression = progression[0]?.result.record?.estimate ?? data?.adultPopulation ?? 1

  const broadenedDetail = (variant: Variant, definition: Record<string, string>) => {
    const ageRange = displayAgeRange(definition.age_band, language)
    const incomeRange = displayIncomeRange(definition.income, language)
    if (variant === 'age') return t.broadenedAge.replace('{range}', ageRange)
    if (variant === 'income') return t.broadenedIncome.replace('{range}', incomeRange)
    return t.broadenedBoth.replace('{ageRange}', ageRange).replace('{incomeRange}', incomeRange)
  }

  const progressionWidths = progression.map(step => {
    const value = step.result.record?.estimate ?? 0
    return value > 0 ? Math.max(4, Math.min(100, (value / maxProgression) * 100)) : 0
  })

  return (
    <>
      <header className="site-header">
        <a className="brand" href="https://danielalmazan.com">{t.brand}</a>
        <div className="language" role="group" aria-label="Language">
          <button className={language === 'es' ? 'active' : ''} onClick={() => setLanguage('es')} aria-pressed={language === 'es'}>ES</button>
          <span>/</span>
          <button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')} aria-pressed={language === 'en'}>EN</button>
        </div>
      </header>

      <main>
        <section className="workspace">
          <div className="intro">
            <p className="eyebrow">{t.dataTag}</p>
            <h1>{t.title.split('\n').map(line => <span key={line}>{line}</span>)}</h1>
            <p className="dek">{t.dek}</p>
            <p className="privacy"><span aria-hidden="true">●</span>{t.privacy}</p>
          </div>

          <form className="profile-form" onSubmit={event => { event.preventDefault(); resultsRef.current?.scrollIntoView({ behavior: 'smooth' }) }}>
            <div className="form-heading"><h2>{t.formTitle}</h2><p>{t.formHint}</p></div>

            <div className="field-row">
              <div className="field-copy"><label htmlFor="age">{t.age}</label><p>{t.ageHelp}</p></div>
              <div className="field-control age-control">
                <input
                  id="age"
                  type="number"
                  min="18"
                  max="100"
                  inputMode="numeric"
                  value={ageInput}
                  onChange={event => {
                    const value = event.target.value
                    const age = Number(value)
                    setAgeInput(value)
                    if (/^\d{2,3}$/.test(value) && age >= 18 && age <= 100) {
                      setProfile(current => ({ ...current, age }))
                    }
                  }}
                  onBlur={() => {
                    const parsedAge = Number(ageInput)
                    const age = ageInput !== '' && Number.isFinite(parsedAge)
                      ? Math.max(18, Math.min(100, Math.round(parsedAge)))
                      : profile.age
                    setAgeInput(String(age))
                    setProfile(current => ({ ...current, age }))
                  }}
                />
                <span>{language === 'es' ? 'años' : 'years'}</span>
              </div>
            </div>

            <SelectField id="region" label={t.region} help={t.regionHelp} value={profile.region} onChange={region => setProfile(current => ({ ...current, region }))} include={profile.include.region} onInclude={checked => setInclude('region', checked)} copy={t}>
              {Object.entries(t.regionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </SelectField>

            <SelectField id="activity" label={t.activity} value={profile.activity} onChange={activity => setProfile(current => ({ ...current, activity: activity as Activity, include: { ...current.include, income: activity === 'employee' && current.include.income } }))} include={profile.include.activity} onInclude={checked => setInclude('activity', checked)} copy={t}>
              {activityOptions.map(value => <option key={value} value={value}>{t.activityLabels[value]}</option>)}
            </SelectField>

            <SelectField id="education" label={t.education} value={profile.education} onChange={education => setProfile(current => ({ ...current, education: education as Education }))} include={profile.include.education} onInclude={checked => setInclude('education', checked)} copy={t}>
              {educationOptions.map(value => <option key={value} value={value}>{t.educationLabels[value]}</option>)}
            </SelectField>

            <SelectField id="household" label={t.household} help={t.householdHelp} value={profile.household} onChange={household => setProfile(current => ({ ...current, household: household as Household }))} include={profile.include.household} onInclude={checked => setInclude('household', checked)} copy={t}>
              {householdOptions.map(value => <option key={value} value={value}>{t.householdLabels[value]}</option>)}
            </SelectField>

            {profile.activity === 'employee' && <div className="field-row salary-row">
              <div className="field-copy"><label htmlFor="income">{t.income} <small>{t.optional}</small></label><p>{t.incomeHelp}</p></div>
              <div className="field-control">
                <div className="money-input"><span>€</span><input id="income" type="number" min="0" max="500000" step="500" value={profile.income ?? ''} onChange={event => setProfile(current => ({ ...current, income: event.target.value === '' ? null : Number(event.target.value) }))} /></div>
                <IncludeToggle checked={profile.include.income && profile.income !== null} onChange={checked => setInclude('income', checked)} copy={t} />
              </div>
            </div>}

            <button className="primary-action" type="submit">{t.calculate}<span aria-hidden="true">↓</span></button>
          </form>

          <aside className="live-result" aria-live="polite">
            <p className="result-kicker">{t.peopleLike}</p>
            {!data && !error && <p className="loading">{t.loading}</p>}
            {error && <p className="error">{t.error}</p>}
            {data && finalEstimate?.variant === 'unavailable' && <div className="unavailable"><strong>{t.unavailable}</strong><p>{t.unavailableText}</p></div>}
            {data && rounded !== null && <>
              <p className="big-number">{formatNumber(rounded, language)}</p>
              <p className="estimate-label">{t.estimated}</p>
              {oneIn && populationShare && <p className="one-in">{t.oneIn
                .replace('{value}', formatNumber(oneIn, language))
                .replace('{percentage}', formatPercent(populationShare, language, populationShare < .001 ? 2 : 1))}</p>}
              <div className="quality-line">
                <span className={finalEstimate?.variant === 'exact' ? 'quality exact' : 'quality broad'}>{finalEstimate?.variant === 'exact' ? t.exact : t.broadened}</span>
                {profile.include.region && <span className="region-flag">{t.regionWarning}</span>}
              </div>
              {finalEstimate && finalEstimate.variant !== 'exact' && finalEstimate.variant !== 'unavailable' && <p className="broad-note">{t.broadenedText.replace('{detail}', broadenedDetail(finalEstimate.variant, finalEstimate.definition))}</p>}
            </>}
            <div className="population-field" aria-hidden="true">
              {Array.from({ length: 120 }, (_, index) => <span key={index} className={index < dotCount ? 'visible' : ''} />)}
            </div>
            <p className="universe">{t.universe}</p>
          </aside>
        </section>

        {data && position && <section className="results" ref={resultsRef}>
          <div className="section-heading"><p>01</p><h2>{t.position}</h2></div>
          <div className="position-grid">
            <article className="position-item age-position">
              <p className="metric">{formatPercent(position.younger, language)}%</p>
              <h3>{t.younger}</h3>
              <div className="age-line"><span style={{ left: `${Math.min(98, position.younger * 100)}%` }} /><i style={{ width: `${position.younger * 100}%` }} /></div>
              <p className="secondary">{formatPercent(position.older, language)}% {t.older}</p>
            </article>
            <article className="position-item">
              <p className="metric">{formatPercent(position.activity, language)}%</p>
              <h3>{t.sameActivity}</h3>
              <p className="descriptor">{t.activityLabels[profile.activity]}</p>
            </article>
            <article className="position-item">
              <p className="metric">{formatPercent(position.education, language)}%</p>
              <h3>{t.sameEducation}</h3>
              <p className="descriptor">{t.educationLabels[profile.education]}</p>
            </article>
            <article className="position-item">
              <p className="metric">{formatPercent(position.household, language)}%</p>
              <h3>{t.sameHousehold}</h3>
              <p className="descriptor">{t.householdLabels[profile.household]}</p>
            </article>
            <article className="position-item income-position">
              {position.salaryPercentile !== null ? <>
                <p className="salary-lead">{t.salaryPercentile}</p>
                <p className="metric">{position.salaryPercentile}%</p>
                <h3>{t.salaryComparator}</h3>
                <div className="income-axis"><i style={{ width: `${position.salaryPercentile}%` }} /><span style={{ left: `${position.salaryPercentile}%` }}>€{formatNumber(profile.income ?? 0, language)}</span></div>
              </> : <p>{t.salaryNoValue}</p>}
            </article>
          </div>
        </section>}

        {data && <section className="progression-section">
          <div className="section-heading"><p>02</p><div><h2>{t.progression}</h2><span>{t.progressionHint}</span></div></div>
          <div className="progression-funnel">
            <svg className="funnel-shape" viewBox={`0 0 100 ${Math.max(1, progression.length * 20)}`} preserveAspectRatio="none" aria-hidden="true">
              {progressionWidths.map((width, index) => {
                const nextWidth = progressionWidths[index + 1] ?? width
                const topLeft = (100 - width) / 2
                const topRight = (100 + width) / 2
                const bottomLeft = (100 - nextWidth) / 2
                const bottomRight = (100 + nextWidth) / 2
                const y = index * 20
                return <polygon key={index} points={`${topLeft},${y} ${topRight},${y} ${bottomRight},${y + 20} ${bottomLeft},${y + 20}`} />
              })}
            </svg>
            <ol className="funnel-labels">
              {progression.map((step, index) => {
                const value = step.result.record?.estimate ?? null
                return <li key={`${index}-${step.label}`}>
                  <div className="progression-label"><span>{String(index + 1).padStart(2, '0')}</span><strong>{step.label}</strong></div>
                  <p>{value ? `${formatNumber(roundedEstimate(value), language)} ${t.people} (${formatPercent(value / maxProgression, language, 0)}%)` : '—'}</p>
                </li>
              })}
            </ol>
          </div>
        </section>}

        <section className="method-section">
          <div className="section-heading"><p>03</p><h2>{t.method}</h2></div>
          <p className="method-lead">{t.methodIntro}</p>
          <ol>{t.methodPoints.map((point, index) => <li key={point}><span>{index + 1}</span>{point}</li>)}</ol>
          <div className="source-links">
            <a href="https://www.ine.es/dyngs/INEbase/es/operacion.htm?c=Estadistica_C&cid=1254736176807&menu=resultados&secc=1254736195153&idp=1254735976608" target="_blank" rel="noreferrer">{t.sourceLink} ↗</a>
            <a href="https://www.ine.es/jaxiT3/Tabla.htm?t=68519" target="_blank" rel="noreferrer">{t.censusLink} ↗</a>
          </div>
        </section>
      </main>

      <footer><p>{t.footer}</p><a href="https://danielalmazan.com">danielalmazan.com ↗</a></footer>
    </>
  )
}

export default App
