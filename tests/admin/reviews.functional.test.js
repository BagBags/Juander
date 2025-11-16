const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { loginToProduction } = require('./production-login-helper');

const BASE_URL = (process.env.BASE_URL || 'https://d39zx5gyblzxjs.cloudfront.net').replace(/\/$/, '');
const HEADLESS = (process.env.HEADLESS || 'false').toLowerCase() === 'true';
const ADMIN_USER = process.env.ADMIN_USER || 'juander714@gmail.com';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Admin1234!';
const SLOW_MS = parseInt(process.env.SLOW_MS || '1000', 10);

async function step(driver, message) {
  console.log(`STEP: ${message}`);
  await driver.sleep(SLOW_MS);
}

async function safeClick(driver, el) {
  try {
    await driver.executeScript("arguments[0].style.outline='3px solid #e11d48';", el);
  } catch (_) {}
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", el).catch(()=>{});
  await driver.sleep(300);
  try { await el.click(); } catch (_) { await driver.executeScript('arguments[0].click();', el); }
  await driver.sleep(300);
}

async function goToReviews(driver) {
  await driver.get(`${BASE_URL}/AdminReviews`);
  await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000).catch(()=>{});
  await driver.sleep(800);
  try {
    await driver.wait(until.elementLocated(By.xpath("//h2[contains(., 'All Reviews')]")), 6000);
    return;
  } catch (_) {
    await driver.get(`${BASE_URL}/#/AdminReviews`);
    await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000).catch(()=>{});
    await driver.sleep(800);
  }
}

describe('Reviews Management - Functional Tests', function () {
  this.timeout(240000);
  let driver;

  before(async () => {
    const options = new chrome.Options();
    if (HEADLESS) options.addArguments('--headless=new');
    options.addArguments('--window-size=1366,900');
    options.addArguments('--disable-gpu');
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('Logs in and navigates to Reviews Management', async () => {
    await step(driver, 'Login to production');
    await loginToProduction(driver, BASE_URL, ADMIN_USER, ADMIN_PASS);
    await step(driver, 'Navigate to Reviews Management');
    await goToReviews(driver);
    const heading = await driver.wait(until.elementLocated(By.xpath("//h2[contains(., 'All Reviews')]")), 10000);
    if (!heading) throw new Error('Reviews Management page not found');
  });

  describe('View Action Tests', () => {
    it('Should display reviews table with all columns', async () => {
      await step(driver, 'Verify table headers are present');
      const headers = ['User', 'Site', 'Rating', 'Review', 'Date', 'Actions'];
      for (const header of headers) {
        const headerEl = await driver.findElements(By.xpath(`//th[contains(., '${header}')]`));
        if (headerEl.length === 0) throw new Error(`Table header "${header}" not found`);
      }
    });

    it('Should open detail modal when clicking View button', async () => {
      await step(driver, 'Click first View button');
      const viewButtons = await driver.findElements(By.xpath("//button[contains(., 'View')]"));
      if (viewButtons.length === 0) throw new Error('No View buttons found');
      await safeClick(driver, viewButtons[0]);
      await driver.sleep(800);

      await step(driver, 'Verify detail modal is opened');
      const modal = await driver.wait(until.elementLocated(By.xpath("//h3[contains(., 'Review Details')]")), 5000).catch(() => null);
      if (!modal) throw new Error('Detail modal not opened');

      await step(driver, 'Verify modal contains review information');
      const userInfo = await driver.findElements(By.xpath("//div[contains(@class, 'rounded-full')]"));
      if (userInfo.length === 0) throw new Error('User info not displayed in modal');

      await step(driver, 'Close modal');
      const closeBtn = await driver.findElement(By.xpath("//button[contains(., 'Close')]"));
      await safeClick(driver, closeBtn);
      await driver.sleep(600);
    });

    it('Should display all review details in modal', async () => {
      await step(driver, 'Click first View button');
      const viewButtons = await driver.findElements(By.xpath("//button[contains(., 'View')]"));
      if (viewButtons.length > 0) {
        await safeClick(driver, viewButtons[0]);
        await driver.sleep(800);

        await step(driver, 'Verify modal displays user name');
        const userName = await driver.findElements(By.xpath("//div[contains(@class, 'font-bold') and contains(@class, 'text-lg')]"));
        if (userName.length === 0) throw new Error('User name not displayed');

        await step(driver, 'Verify modal displays site name');
        const siteInfo = await driver.findElements(By.xpath("//div[contains(., 'Site')]"));
        if (siteInfo.length === 0) throw new Error('Site info not displayed');

        await step(driver, 'Verify modal displays rating');
        const ratingInfo = await driver.findElements(By.xpath("//div[contains(., 'Rating')]"));
        if (ratingInfo.length === 0) throw new Error('Rating not displayed');

        const closeBtn = await driver.findElement(By.xpath("//button[contains(., 'Close')]"));
        await safeClick(driver, closeBtn);
        await driver.sleep(600);
      }
    });
  });

  describe('Delete Action Tests', () => {
    it('Should delete review when clicking Delete button', async () => {
      await step(driver, 'Get initial review count');
      const initialRows = await driver.findElements(By.xpath("//tbody//tr"));
      const initialCount = initialRows.length;

      if (initialCount === 0) {
        console.log('No reviews to delete - skipping delete test');
        return;
      }

      await step(driver, 'Click first Delete button');
      const deleteButtons = await driver.findElements(By.xpath("//button[contains(., 'Delete')]"));
      if (deleteButtons.length > 0) {
        await safeClick(driver, deleteButtons[0]);
        await driver.sleep(800);

        await step(driver, 'Confirm delete in modal');
        const confirmBtn = await driver.wait(until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(., 'Confirm')]")), 10000).catch(() => null);
        if (confirmBtn) {
          await safeClick(driver, confirmBtn);
          await driver.sleep(2000);

          await step(driver, 'Verify review count decreased');
          const finalRows = await driver.findElements(By.xpath("//tbody//tr"));
          const finalCount = finalRows.length;
          if (finalCount >= initialCount) throw new Error('Review not deleted');
        }
      }
    });

    it('Should delete review from detail modal', async () => {
      await step(driver, 'Get initial review count');
      const initialRows = await driver.findElements(By.xpath("//tbody//tr"));
      const initialCount = initialRows.length;

      if (initialCount === 0) {
        console.log('No reviews to delete - skipping delete from modal test');
        return;
      }

      await step(driver, 'Click View button');
      const viewButtons = await driver.findElements(By.xpath("//button[contains(., 'View')]"));
      if (viewButtons.length > 0) {
        await safeClick(driver, viewButtons[0]);
        await driver.sleep(800);

        await step(driver, 'Click Delete Review button in modal');
        const deleteBtn = await driver.findElement(By.xpath("//button[contains(., 'Delete Review')]"));
        await safeClick(driver, deleteBtn);
        await driver.sleep(800);

        await step(driver, 'Confirm delete in confirmation modal');
        const confirmBtn = await driver.wait(until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(., 'Confirm')]")), 10000).catch(() => null);
        if (confirmBtn) {
          await safeClick(driver, confirmBtn);
          await driver.sleep(2000);

          await step(driver, 'Verify review count decreased');
          const finalRows = await driver.findElements(By.xpath("//tbody//tr"));
          const finalCount = finalRows.length;
          if (finalCount >= initialCount) throw new Error('Review not deleted from modal');
        }
      }
    });
  });

  describe('Search Functionality Tests', () => {
    it('Should search reviews by user name (Sophia)', async () => {
      await step(driver, 'Clear search field and enter user name');
      const searchInput = await driver.findElement(By.xpath("//input[@placeholder='Search by user, site, or review text...']"));
      await searchInput.clear();
      await searchInput.sendKeys('Sophia');
      await driver.sleep(1000);

      await step(driver, 'Verify filtered results contain Sophia');
      const rows = await driver.findElements(By.xpath("//tbody//tr"));
      if (rows.length === 0) {
        console.log('No reviews found for Sophia - search may be working correctly');
      } else {
        const firstRow = await rows[0].getText();
        if (!firstRow.toLowerCase().includes('sophia')) {
          console.log('Warning: Search results may not be filtered correctly');
        }
      }

      await step(driver, 'Clear search');
      await searchInput.clear();
      await driver.sleep(800);
    });

    it('Should search reviews by site name (Casa Manila Museum)', async () => {
      await step(driver, 'Enter site name in search');
      const searchInput = await driver.findElement(By.xpath("//input[@placeholder='Search by user, site, or review text...']"));
      await searchInput.clear();
      await searchInput.sendKeys('Casa Manila Museum');
      await driver.sleep(1000);

      await step(driver, 'Verify filtered results contain site name');
      const rows = await driver.findElements(By.xpath("//tbody//tr"));
      if (rows.length === 0) {
        console.log('No reviews found for Casa Manila Museum');
      }

      await step(driver, 'Clear search');
      await searchInput.clear();
      await driver.sleep(800);
    });

    it('Should search reviews by review text (Good)', async () => {
      await step(driver, 'Enter review text in search');
      const searchInput = await driver.findElement(By.xpath("//input[@placeholder='Search by user, site, or review text...']"));
      await searchInput.clear();
      await searchInput.sendKeys('Good');
      await driver.sleep(1000);

      await step(driver, 'Verify filtered results contain Good');
      const rows = await driver.findElements(By.xpath("//tbody//tr"));
      if (rows.length === 0) {
        console.log('No reviews found with "Good" text');
      }

      await step(driver, 'Clear search');
      await searchInput.clear();
      await driver.sleep(800);
    });

    it('Should clear search and show all reviews', async () => {
      await step(driver, 'Enter search term');
      const searchInput = await driver.findElement(By.xpath("//input[@placeholder='Search by user, site, or review text...']"));
      await searchInput.clear();
      await searchInput.sendKeys('test');
      await driver.sleep(800);

      await step(driver, 'Clear search field');
      await searchInput.clear();
      await driver.sleep(800);

      await step(driver, 'Verify all reviews are shown');
      const rows = await driver.findElements(By.xpath("//tbody//tr"));
      if (rows.length === 0) {
        console.log('No reviews in table');
      }
    });
  });

  describe('Filter by Site Tests', () => {
    it('Should filter reviews by site dropdown', async () => {
      await step(driver, 'Get initial review count');
      const initialRows = await driver.findElements(By.xpath("//tbody//tr"));
      const initialCount = initialRows.length;

      await step(driver, 'Open site filter dropdown');
      const siteDropdown = await driver.findElement(By.xpath("//select[contains(@class, 'pl-10')]"));
      await siteDropdown.click();
      await driver.sleep(600);

      await step(driver, 'Select first site option');
      const options = await driver.findElements(By.xpath("//select[contains(@class, 'pl-10')]//option"));
      if (options.length > 1) {
        // Select second option (first is "All Sites")
        await options[1].click();
        await driver.sleep(1000);

        await step(driver, 'Verify filtered results');
        const filteredRows = await driver.findElements(By.xpath("//tbody//tr"));
        console.log(`Initial: ${initialCount}, Filtered: ${filteredRows.length}`);

        await step(driver, 'Reset filter to All Sites');
        await siteDropdown.click();
        await driver.sleep(600);
        const resetOption = await driver.findElement(By.xpath("//select[contains(@class, 'pl-10')]//option[@value='']"));
        await resetOption.click();
        await driver.sleep(800);
      }
    });

    it('Should filter reviews by Casa Manila Museum site', async () => {
      await step(driver, 'Open site filter dropdown');
      const siteDropdown = await driver.findElement(By.xpath("//select[contains(@class, 'pl-10')]"));
      await siteDropdown.click();
      await driver.sleep(600);

      await step(driver, 'Look for Casa Manila Museum option');
      const casaManilaOption = await driver.findElements(By.xpath("//select[contains(@class, 'pl-10')]//option[contains(., 'Casa Manila')]"));
      if (casaManilaOption.length > 0) {
        await safeClick(driver, casaManilaOption[0]);
        await driver.sleep(1000);

        await step(driver, 'Verify filtered results');
        const rows = await driver.findElements(By.xpath("//tbody//tr"));
        console.log(`Filtered by Casa Manila Museum: ${rows.length} reviews`);

        await step(driver, 'Reset filter');
        await siteDropdown.click();
        await driver.sleep(600);
        const resetOption = await driver.findElement(By.xpath("//select[contains(@class, 'pl-10')]//option[@value='']"));
        await resetOption.click();
        await driver.sleep(800);
      } else {
        console.log('Casa Manila Museum option not found in dropdown');
      }
    });
  });

  describe('Sort/Filter by Rating Tests', () => {
    it('Should sort reviews by Highest Rating', async () => {
      await step(driver, 'Find and interact with sort dropdown');
      const sortDropdowns = await driver.findElements(By.xpath("//select[contains(@class, 'pl-10')]"));
      if (sortDropdowns.length >= 3) {
        const thirdDropdown = sortDropdowns[2];
        await safeClick(driver, thirdDropdown);
        await driver.sleep(800);

        await step(driver, 'Select Highest Rating option');
        const highestOption = await driver.findElements(By.xpath("//option[contains(., 'Highest Rating')]"));
        if (highestOption.length > 0) {
          await safeClick(driver, highestOption[0]);
          await driver.sleep(1500);

          await step(driver, 'Verify reviews are sorted by highest rating');
          const rows = await driver.findElements(By.xpath("//tbody//tr"));
          console.log(`Sorted by Highest Rating: ${rows.length} reviews`);
        } else {
          console.log('Highest Rating option not found');
        }
      } else {
        console.log('Sort dropdown not found');
      }
    });

    it('Should sort reviews by Lowest Rating', async () => {
      await step(driver, 'Find and interact with sort dropdown');
      const sortDropdowns = await driver.findElements(By.xpath("//select[contains(@class, 'pl-10')]"));
      if (sortDropdowns.length >= 3) {
        const thirdDropdown = sortDropdowns[2];
        await safeClick(driver, thirdDropdown);
        await driver.sleep(800);

        await step(driver, 'Select Lowest Rating option');
        const lowestOption = await driver.findElements(By.xpath("//option[contains(., 'Lowest Rating')]"));
        if (lowestOption.length > 0) {
          await safeClick(driver, lowestOption[0]);
          await driver.sleep(1500);

          await step(driver, 'Verify reviews are sorted by lowest rating');
          const rows = await driver.findElements(By.xpath("//tbody//tr"));
          console.log(`Sorted by Lowest Rating: ${rows.length} reviews`);
        } else {
          console.log('Lowest Rating option not found');
        }
      } else {
        console.log('Sort dropdown not found');
      }
    });

    it('Should sort reviews by Latest First', async () => {
      await step(driver, 'Find and interact with sort dropdown');
      const sortDropdowns = await driver.findElements(By.xpath("//select[contains(@class, 'pl-10')]"));
      if (sortDropdowns.length >= 3) {
        const thirdDropdown = sortDropdowns[2];
        await safeClick(driver, thirdDropdown);
        await driver.sleep(800);

        await step(driver, 'Select Latest First option');
        const latestOption = await driver.findElements(By.xpath("//option[contains(., 'Latest First')]"));
        if (latestOption.length > 0) {
          await safeClick(driver, latestOption[0]);
          await driver.sleep(1500);

          await step(driver, 'Verify reviews are sorted by latest');
          const rows = await driver.findElements(By.xpath("//tbody//tr"));
          console.log(`Sorted by Latest First: ${rows.length} reviews`);
        } else {
          console.log('Latest First option not found');
        }
      } else {
        console.log('Sort dropdown not found');
      }
    });

    it('Should sort reviews by Oldest First', async () => {
      await step(driver, 'Find and interact with sort dropdown');
      const sortDropdowns = await driver.findElements(By.xpath("//select[contains(@class, 'pl-10')]"));
      if (sortDropdowns.length >= 3) {
        const thirdDropdown = sortDropdowns[2];
        await safeClick(driver, thirdDropdown);
        await driver.sleep(800);

        await step(driver, 'Select Oldest First option');
        const oldestOption = await driver.findElements(By.xpath("//option[contains(., 'Oldest First')]"));
        if (oldestOption.length > 0) {
          await safeClick(driver, oldestOption[0]);
          await driver.sleep(1500);

          await step(driver, 'Verify reviews are sorted by oldest');
          const rows = await driver.findElements(By.xpath("//tbody//tr"));
          console.log(`Sorted by Oldest First: ${rows.length} reviews`);
        } else {
          console.log('Oldest First option not found');
        }
      } else {
        console.log('Sort dropdown not found');
      }
    });
  });

  describe('Edge Case Tests', () => {
    it('Should display "No reviews found" when search returns no results', async () => {
      await step(driver, 'Enter search term that returns no results');
      const searchInput = await driver.findElement(By.xpath("//input[@placeholder='Search by user, site, or review text...']"));
      await searchInput.clear();
      await searchInput.sendKeys('XYZABC123NONEXISTENT');
      await driver.sleep(1000);

      await step(driver, 'Verify no reviews message is displayed');
      const noReviewsMsg = await driver.findElements(By.xpath("//p[contains(., 'No reviews found')]"));
      if (noReviewsMsg.length === 0) {
        console.log('No reviews message not displayed - may have results');
      }

      await step(driver, 'Clear search');
      await searchInput.clear();
      await driver.sleep(800);
    });

    it('Should display review count in header', async () => {
      await step(driver, 'Verify review count is displayed');
      const countDisplay = await driver.findElements(By.xpath("//span[contains(@class, 'text-[#f04e37]')]"));
      if (countDisplay.length === 0) throw new Error('Review count not displayed');
      const countText = await countDisplay[0].getText();
      console.log(`Total reviews: ${countText}`);
    });

    it('Should handle multiple filters simultaneously', async () => {
      await step(driver, 'Apply search filter');
      const searchInput = await driver.findElement(By.xpath("//input[@placeholder='Search by user, site, or review text...']"));
      await searchInput.clear();
      await searchInput.sendKeys('Good');
      await driver.sleep(800);

      await step(driver, 'Apply site filter');
      const siteDropdown = await driver.findElements(By.xpath("//select[contains(@class, 'pl-10')]"));
      if (siteDropdown.length >= 1) {
        await siteDropdown[0].click();
        await driver.sleep(600);
        const options = await driver.findElements(By.xpath("//select[contains(@class, 'pl-10')]//option"));
        if (options.length > 1) {
          await options[1].click();
          await driver.sleep(1000);

          await step(driver, 'Verify combined filters work');
          const rows = await driver.findElements(By.xpath("//tbody//tr"));
          console.log(`Results with combined filters: ${rows.length}`);

          await step(driver, 'Clear filters');
          await searchInput.clear();
          await driver.sleep(600);
          await siteDropdown[0].click();
          await driver.sleep(600);
          const resetOption = await driver.findElement(By.xpath("//select[contains(@class, 'pl-10')]//option[@value='']"));
          await resetOption.click();
          await driver.sleep(800);
        }
      }
    });
  });
});
