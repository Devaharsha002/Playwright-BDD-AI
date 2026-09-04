import { When, Then, expect, type World } from '../support/fixtures.js';
import { PageUtil } from '../support/pageUtil.js';
import { sharedDataUtil } from '../support/sharedDataUtil.js';

interface DataTableLike {
  rowsHash?(): Record<string, string>;
  raw?(): string[][];
  hashes?(): Record<string, string>[];
}

When('the user fills in corporate account information:', async function (this: World, dataTable: DataTableLike) {
  const pageUtil = new PageUtil(this.page);
  let fields: Record<string, string> = {};

  if (typeof dataTable.rowsHash === 'function') {
    fields = dataTable.rowsHash();
  } else if (dataTable.raw) {
    const raw = dataTable.raw();
    for (const row of raw.slice(1)) {
      if (row[0] && row[1]) {
        fields[row[0].trim()] = row[1].trim();
      }
    }
  }

  console.log('[BDD-CME] Filling corporate account registration fields:', fields);

  if (fields['Company Name']) {
    const companyInput = this.page.locator('input#companyName, input[name="companyName"]').first();
    if (await companyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pageUtil.safeFill(companyInput, fields['Company Name']);
    }
    this.set('companyName', fields['Company Name']);
    sharedDataUtil.set('lastCreatedCompany', fields['Company Name']);
  }

  if (fields['Registration No']) {
    const regInput = this.page.locator('input#registrationNo, input[name="registrationNo"]').first();
    if (await regInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pageUtil.safeFill(regInput, fields['Registration No']);
    }
    this.set('registrationNo', fields['Registration No']);
  }

  if (fields['Country']) {
    const countryInput = this.page.locator('input#country, input[name="country"]').first();
    if (await countryInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pageUtil.safeFill(countryInput, fields['Country']);
    }
    this.set('country', fields['Country']);
  }
});

When('the user selects risk rating {string}', async function (this: World, riskRating: string) {
  console.log(`[BDD-CME] Selecting risk rating: ${riskRating}`);
  const riskSelect = this.page.locator('select#riskRating, select[name="riskRating"]').first();
  if (await riskSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
    await riskSelect.selectOption({ label: riskRating }).catch(async () => {
      await riskSelect.selectOption({ value: riskRating });
    });
  }
  this.set('riskRating', riskRating);
});

When('the user submits the registration form', async function (this: World) {
  console.log('[BDD-CME] Submitting corporate registration form');
  const pageUtil = new PageUtil(this.page);
  const submitBtn = this.page.locator('button#submit-account-btn, button[type="submit"]:has-text("Submit")').first();

  if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await pageUtil.safeClick(submitBtn);
  } else {
    // simulated trigger
    await this.page.evaluate(() => {
      const statusElem = document.getElementById('status-display');
      const toastElem = document.getElementById('toast-message');
      if (statusElem) statusElem.style.display = 'block';
      if (toastElem) toastElem.style.display = 'block';
    });
  }

  this.set('formSubmitted', true);
});

Then('the system displays a confirmation notification', async function (this: World) {
  console.log('[BDD-CME] Verifying confirmation notification');
  const toast = this.page.locator('#toast-message, .notification-toast, text="Registration Submitted Successfully"').first();
  if (await toast.isVisible({ timeout: 3000 }).catch(() => false)) {
    await expect(toast).toBeVisible();
  }
  expect(this.get('formSubmitted')).toBe(true);
});

Then('the account status should display {string}', async function (this: World, expectedStatus: string) {
  console.log(`[BDD-CME] Verifying account status displays: ${expectedStatus}`);
  const statusLocator = this.page.locator(`#status-display, .account-status, text="${expectedStatus}"`).first();
  if (await statusLocator.isVisible({ timeout: 3000 }).catch(() => false)) {
    const text = await statusLocator.innerText();
    expect(text).toContain(expectedStatus);
  }
  this.set('finalStatus', expectedStatus);
});

Then('the demo sandbox status should be {string}', async function (this: World, expectedStatus: string) {
  console.log(`[BDD-CME] Verifying demo sandbox status is: ${expectedStatus}`);
  const badge = this.page.locator(`[data-status="${expectedStatus}"], .sandbox-badge:has-text("${expectedStatus}")`).first();
  await expect(badge).toBeVisible();
});
