import { test } from '@playwright/test';
import { chromium } from '@playwright/test';

const EXEC = '/home/junghwki/.playwright/chromium_headless_shell-1217/chrome-headless-shell-linux64/chrome-headless-shell';

test('debug: check page content', async () => {
  const browser = await chromium.launch({ executablePath: EXEC });
  const page = await browser.newPage();

  await page.goto('http://localhost:4173');
  await page.waitForTimeout(2000);

  const text = await page.locator('body').innerText();
  console.log('=== HOME PAGE ===');
  console.log(text.substring(0, 500));

  // Click online button
  await page.getByText('온라인').click();
  await page.waitForTimeout(2000);

  const text2 = await page.locator('body').innerText();
  console.log('=== ONLINE PAGE ===');
  console.log(text2.substring(0, 800));

  await page.screenshot({ path: '/tmp/pong-online.png' });
  await browser.close();
});
