import { expect, test } from '@playwright/test'

test('loads without horizontal overflow and exposes the full first interaction', async ({ page }, testInfo) => {
  await page.goto('')
  await expect(page.getByRole('link', { name: 'Daniel Almazán' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '¿Dónde encajas en España?' })).toBeVisible()
  await expect(page.getByText('¿Eres la norma, o la excepción?')).toBeVisible()
  await expect(page.getByText('Todo ocurre en tu navegador.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Construye tu perfil' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Cómo se reduce tu grupo' })).toBeVisible()
  await expect(page.locator('.funnel-labels li').first()).toContainText('(100%)')
  await expect(page.locator('.funnel-labels li').last()).toContainText(/\(\d+%\)/)
  await expect(page.locator('.one-in')).toContainText(/\(\d+(?:,\d+)?%\)/)
  await expect(page.locator('.funnel-shape polygon')).toHaveCount(5)

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth,
    introHeight: document.querySelector('.intro')?.getBoundingClientRect().height ?? 0,
    primary: getComputedStyle(document.documentElement).getPropertyValue('--dani-primary').trim(),
    bodyFont: getComputedStyle(document.body).fontFamily,
  }))
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport)
  expect(dimensions.primary).toBe('#145c9e')
  expect(dimensions.bodyFont).toContain('Geist')
  if (testInfo.project.name === 'mobile') expect(dimensions.introHeight).toBeLessThan(650)

  const ageInput = page.getByLabel('Edad')
  await ageInput.focus()
  const focusStyle = await ageInput.evaluate(element => ({
    border: getComputedStyle(element).borderBottomColor,
    outline: getComputedStyle(element).outlineStyle,
  }))
  expect(focusStyle.border).toBe('rgb(20, 92, 158)')
  expect(focusStyle.outline).toBe('none')
})

test('switches language and explains both broadening and suppression', async ({ page }) => {
  await page.goto('')
  await page.getByRole('button', { name: 'EN' }).click()
  await expect(page).toHaveURL(/\?lang=en$/)
  await expect(page.getByRole('heading', { name: 'Where do you fit in Spain?' })).toBeVisible()

  await page.getByLabel('Gross employee pay received in 2024 OPTIONAL').fill('200000')
  await expect(page.getByText('BROADER PROFILE DUE TO SMALL SAMPLE')).toBeVisible()
  await expect(page.getByText(/We broadened only age \(ages 30–39\)/)).toBeVisible()

  await page.getByLabel('Autonomous Community').selectOption('ES64')
  await page.locator('#region').locator('xpath=following::label[1]').click()
  await expect(page.getByText('Not enough sample')).toBeVisible()
})
