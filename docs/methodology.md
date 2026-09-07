# Methodology

## Statistical scope

The combined-profile estimate represents adults aged 18 or over living in private households in Spain. It is not an estimate of the entire resident population and excludes people in collective households. Estimates are survey-weighted counts, not unweighted sample counts.

The build currently uses 58,691 eligible ECV 2025 person records, representing about 41.03 million adults through the official `PB040` personal cross-sectional weight. The public payload contains aggregates only; no respondent-level microdata are shipped to the browser.

## Sources and outputs

| Output | Source | Variables |
| --- | --- | --- |
| Combined “people like you” estimate and progressive profile | ECV 2025 cross-sectional public microdata | `RB082`, `DB040`, `PL032`, `PE041`, `HX060`, `PY010G`, `PB040` |
| Employment, education and household shares within age groups | ECV 2025 | Same harmonised categories and `PB040` |
| Salary percentile among employees reporting positive prior-year employee income | ECV 2025 | `PY010G`, weighted by `PB040` |
| Percentage younger and older; regional population context | INE Annual Population Census 2025, table 68519 | Single-year age and Autonomous Community totals |

EPA and annual salary-structure statistics are intentionally not joined to ECV records. They are validation/context sources for a later release, because the public files do not share person-level identifiers or a common joint sample.

## Inputs and categorisation

The six interface inputs are age, Autonomous Community, current activity, completed education, household composition and gross employee pay received in 2024. Region is contextual by default and must be explicitly included in the combined profile. Pay is offered only when the current activity is employee.

Exact age bands are `18–24`, five-year groups from `25–29` through `60–64`, then `65–74`, `75–85` and `86+`. Exact employee-income bands are below €15,000, €15,000–24,999, €25,000–39,999, €40,000–59,999 and €60,000 or more. The income variable is prior-calendar-year gross cash or near-cash employee income; it is not current salary, household income, disposable income or an annualised wage rate.

## Estimation and publication rules

Each joint estimate is a direct weighted sum of records matching the selected categories. The system never constructs a joint profile by multiplying marginal probabilities. Individual income percentiles use the weighted empirical distribution of positive employee income.

An exact estimate is published as standard quality only when its unweighted cell contains at least 50 respondents and its Kish effective sample size is at least 30:

`n_eff = (sum(w))^2 / sum(w^2)`

Cells with 20–49 records or effective sample size 15–29 are retained internally as low reliability but are not shown as exact profile estimates. Cells below either lower threshold are suppressed. Displayed population estimates are deliberately rounded, and no confidence interval is shown because the public microdata do not expose the complete survey-design information needed for a fully design-correct interval.

## Deterministic sparse-cell fallback

When an exact joint profile fails the publication threshold, the client tries a fixed and transparent sequence:

1. Broaden age to `18–29`, `30–39`, `40–49`, `50–59`, `60–74` or `75+`.
2. If necessary, broaden employee income to below €25,000, €25,000–59,999 or €60,000 or more.
3. If necessary, broaden both age and income.

Employment, education, household composition and region are never changed silently. A broadened result is labelled and states what changed. If no standard-quality fallback exists, the interface reports that the sample is insufficient and invites the user to remove a characteristic.

## Calibration and precision

The ECV `PB040` weights define the adult private-household universe used by joint estimates. Census totals are used for age comparisons and contextual population figures, not as a post-hoc multiplier for sparse ECV cells. This avoids creating unsupported precision or changing the survey's joint relationships.

## Privacy and disclosure

All answers remain in React state in the browser. They are not placed in the URL, logged by an application backend, or stored locally. The project has no database or API. Static lookup rows apply the thresholds above, and public files contain no micro-records or record identifiers.

## Known limitations and deferred scope

- ECV is a household living-conditions survey, not the strongest specialist source for occupation or current wage rates.
- Regional joint profiles become sparse quickly; region is therefore optional and prominently warned.
- The salary comparison excludes people without positive employee income and should not be read as a comparison with all adults.
- Sampling error, recall error and category harmonisation remain even when a cell clears the threshold.
- Sex, occupation, housing tenure, household disposable income, EPA/EES standalone comparisons, uncertainty intervals and alternative characteristic orderings are deferred until their explanatory benefit and sample support are demonstrated.
