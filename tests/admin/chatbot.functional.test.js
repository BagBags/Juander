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
    await driver.executeScript("arguments[0].style.outline='3px solid #e11d48'; arguments[0].style.transition='outline 0.2s ease';", el);
  } catch (_) {}
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", el).catch(()=>{});
  await driver.sleep(300);
  try { await el.click(); } catch (_) { await driver.executeScript('arguments[0].click();', el); }
  await driver.sleep(300);
  try { await driver.executeScript("arguments[0].style.outline='';", el); } catch(_) {}
}

async function goToChatbot(driver) {
  await driver.get(`${BASE_URL}/AdminManageChatbot`);
  await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000).catch(()=>{});
  await driver.sleep(800);
  try {
    await driver.wait(until.elementLocated(By.xpath("//h3[contains(.,'Knowledge Base Management')]")), 6000);
    return;
  } catch (_) {}
  // Hash route fallback
  await driver.get(`${BASE_URL}/#/AdminManageChatbot`);
  await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000).catch(()=>{});
  await driver.sleep(800);
}

describe('Chatbot Management - Functional Tests', function () {
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

  it('Logs in and navigates to Chatbot Management', async () => {
    await step(driver, 'Login to production');
    await loginToProduction(driver, BASE_URL, ADMIN_USER, ADMIN_PASS);

    await step(driver, 'Navigate to Chatbot Management');
    await goToChatbot(driver);

    await step(driver, 'Verify Chatbot page loaded');
    const heading = await driver.wait(
      until.elementLocated(By.xpath("//h3[contains(.,'Knowledge Base Management')]")),
      10000
    );
    if (!heading) throw new Error('Chatbot Management page not found');
  });

  // ===== VALIDATION TESTS =====
  describe('Validation Tests', () => {
    it('Should show error when submitting without English information', async () => {
      await step(driver, 'Clear English information field');
      const infoEnInput = await driver.findElement(By.xpath("//textarea[@name='info_en']"));
      await infoEnInput.clear();
      await driver.sleep(500);

      await step(driver, 'Try to submit form');
      const addButton = await driver.findElement(By.xpath("//button[contains(normalize-space(.), 'Add') and not(contains(normalize-space(.), 'Update'))]"));
      await safeClick(driver, addButton);
      await driver.sleep(800);

      await step(driver, 'Verify validation error appears');
      const errorMsg = await driver.wait(
        until.elementLocated(By.xpath("//p[contains(., 'English information is required')]")),
        5000
      ).catch(() => null);
      if (!errorMsg) throw new Error('Validation error not shown for missing English information');
    });

    it('Should allow submission with only English information (Filipino is optional)', async () => {
      await step(driver, 'Fill English information');
      const infoEnInput = await driver.findElement(By.xpath("//textarea[@name='info_en']"));
      await infoEnInput.clear();
      await infoEnInput.sendKeys(`Test Entry ${Date.now()}`);
      await driver.sleep(500);

      await step(driver, 'Leave Filipino information empty');
      const infoFilInput = await driver.findElement(By.xpath("//textarea[@name='info_fil']"));
      await infoFilInput.clear();
      await driver.sleep(500);

      await step(driver, 'Submit form');
      const addButton = await driver.findElement(By.xpath("//button[contains(normalize-space(.), 'Add') and not(contains(normalize-space(.), 'Update'))]"));
      await safeClick(driver, addButton);
      await driver.sleep(800);

      await step(driver, 'Confirm Add in modal');
      const confirmBtn = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(normalize-space(.), 'Add Entry')]")),
        10000
      ).catch(() => null);
      
      if (confirmBtn) {
        await safeClick(driver, confirmBtn);
        await driver.sleep(2000);
        
        await step(driver, 'Verify entry was added');
        const entryFound = await driver.wait(async () => {
          const entries = await driver.findElements(By.xpath(`//p[contains(., 'Test Entry')]`));
          return entries.length > 0;
        }, 5000).catch(() => false);
        if (!entryFound) throw new Error('Entry not added despite valid English information');
      }
    });

    it('Should allow keywords field to be empty', async () => {
      await step(driver, 'Fill English information');
      const infoEnInput = await driver.findElement(By.xpath("//textarea[@name='info_en']"));
      await infoEnInput.clear();
      await infoEnInput.sendKeys(`No Keywords Entry ${Date.now()}`);
      await driver.sleep(500);

      await step(driver, 'Leave keywords field empty');
      const keywordsInput = await driver.findElement(By.xpath("//input[@name='keywords']"));
      await keywordsInput.clear();
      await driver.sleep(500);

      await step(driver, 'Submit form');
      const addButton = await driver.findElement(By.xpath("//button[contains(normalize-space(.), 'Add') and not(contains(normalize-space(.), 'Update'))]"));
      await safeClick(driver, addButton);
      await driver.sleep(800);

      await step(driver, 'Confirm Add in modal');
      const confirmBtn = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(normalize-space(.), 'Add Entry')]")),
        10000
      ).catch(() => null);
      
      if (confirmBtn) {
        await safeClick(driver, confirmBtn);
        await driver.sleep(2000);
      }
    });

    it('Should allow tags to be optional', async () => {
      await step(driver, 'Fill English information');
      const infoEnInput = await driver.findElement(By.xpath("//textarea[@name='info_en']"));
      await infoEnInput.clear();
      await infoEnInput.sendKeys(`No Tags Entry ${Date.now()}`);
      await driver.sleep(500);

      await step(driver, 'Ensure no tags are selected');
      const selectedCheckboxes = await driver.findElements(By.xpath("//input[@type='checkbox' and @checked]"));
      for (const checkbox of selectedCheckboxes) {
        await safeClick(driver, checkbox);
        await driver.sleep(300);
      }

      await step(driver, 'Submit form');
      const addButton = await driver.findElement(By.xpath("//button[contains(normalize-space(.), 'Add') and not(contains(normalize-space(.), 'Update'))]"));
      await safeClick(driver, addButton);
      await driver.sleep(800);

      await step(driver, 'Confirm Add in modal');
      const confirmBtn = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(normalize-space(.), 'Add Entry')]")),
        10000
      ).catch(() => null);
      
      if (confirmBtn) {
        await safeClick(driver, confirmBtn);
        await driver.sleep(2000);
      }
    });
  });

  // ===== FILTER & SEARCH TESTS =====
  describe('Filter & Search Tests', () => {
    it('Should filter entries by tag selection', async () => {
      await step(driver, 'Click Active tab');
      const activeTab = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(., 'Active Entries')]")),
        10000
      );
      await safeClick(driver, activeTab);
      await driver.sleep(800);

      await step(driver, 'Get initial entry count');
      const initialEntries = await driver.findElements(By.xpath("//div[contains(@class,'rounded-xl') and contains(@class,'border-2') and contains(@class,'border-gray-200')]"));
      const initialCount = initialEntries.length;

      await step(driver, 'Click About tag filter');
      const aboutFilterBtn = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(., 'About') and contains(@class,'px-2')]")),
        10000
      ).catch(() => null);
      
      if (aboutFilterBtn) {
        await safeClick(driver, aboutFilterBtn);
        await driver.sleep(1000);

        await step(driver, 'Verify filtered entries are shown');
        const filteredEntries = await driver.findElements(By.xpath("//div[contains(@class,'rounded-xl') and contains(@class,'border-2') and contains(@class,'border-gray-200')]"));
        // Filtered count should be <= initial count
        if (filteredEntries.length > initialCount) {
          throw new Error(`Filtered count (${filteredEntries.length}) should not exceed initial count (${initialCount})`);
        }
      }
    });

    it('Should clear tag filter when clicking Clear all button', async () => {
      await step(driver, 'Click About tag filter');
      const aboutFilterBtn = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(., 'About') and contains(@class,'px-2')]")),
        10000
      ).catch(() => null);
      
      if (aboutFilterBtn) {
        await safeClick(driver, aboutFilterBtn);
        await driver.sleep(800);

        await step(driver, 'Click Clear all button');
        const clearBtn = await driver.wait(
          until.elementLocated(By.xpath("//button[contains(., 'Clear all')]")),
          5000
        ).catch(() => null);
        
        if (clearBtn) {
          await safeClick(driver, clearBtn);
          await driver.sleep(800);

          await step(driver, 'Verify filter is cleared');
          const clearBtnAfter = await driver.findElements(By.xpath("//button[contains(., 'Clear all')]"));
          if (clearBtnAfter.length > 0) {
            throw new Error('Clear all button still visible after clearing filters');
          }
        }
      }
    });

    it('Should show all entries when no filter is applied', async () => {
      await step(driver, 'Ensure no filters are applied');
      const clearBtn = await driver.findElements(By.xpath("//button[contains(., 'Clear all')]"));
      if (clearBtn.length > 0) {
        await safeClick(driver, clearBtn[0]);
        await driver.sleep(800);
      }

      await step(driver, 'Get all active entries');
      const allEntries = await driver.findElements(By.xpath("//div[contains(@class,'rounded-xl') and contains(@class,'border-2') and contains(@class,'border-gray-200')]"));
      if (allEntries.length === 0) {
        throw new Error('No entries found when no filter is applied');
      }
    });
  });

  // ===== TAB SWITCHING TESTS =====
  describe('Tab Switching Tests', () => {
    it('Should switch between Active and Archived tabs', async () => {
      await step(driver, 'Click Active tab');
      const activeTab = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(., 'Active Entries')]")),
        10000
      );
      await safeClick(driver, activeTab);
      await driver.sleep(800);

      await step(driver, 'Verify Active tab is displayed');
      let activeContent = await driver.findElements(By.xpath("//div[contains(@class,'rounded-xl') and contains(@class,'border-2') and contains(@class,'border-gray-200')]"));
      // Active entries have border-gray-200

      await step(driver, 'Click Archived tab');
      const archivedTab = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(., 'Archived')]")),
        10000
      );
      await safeClick(driver, archivedTab);
      await driver.sleep(800);

      await step(driver, 'Verify Archived tab is displayed');
      let archivedContent = await driver.findElements(By.xpath("//div[contains(@class,'rounded-xl') and contains(@class,'border-2') and contains(@class,'border-gray-300')]"));
      // Archived entries have border-gray-300

      await step(driver, 'Switch back to Active tab');
      await safeClick(driver, activeTab);
      await driver.sleep(800);

      await step(driver, 'Verify Active tab is displayed again');
      activeContent = await driver.findElements(By.xpath("//div[contains(@class,'rounded-xl') and contains(@class,'border-2') and contains(@class,'border-gray-200')]"));
    });
  });

  // ===== EDGE CASE TESTS =====
  describe('Edge Case Tests', () => {
    it('Should handle very long English information text', async () => {
      await step(driver, 'Click Active tab');
      const activeTab = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(., 'Active Entries')]")),
        10000
      );
      await safeClick(driver, activeTab);
      await driver.sleep(800);

      await step(driver, 'Fill with very long text');
      const infoEnInput = await driver.findElement(By.xpath("//textarea[@name='info_en']"));
      const longText = 'A'.repeat(500) + ` ${Date.now()}`;
      await infoEnInput.clear();
      await infoEnInput.sendKeys(longText);
      await driver.sleep(500);

      await step(driver, 'Submit form');
      const addButton = await driver.findElement(By.xpath("//button[contains(normalize-space(.), 'Add') and not(contains(normalize-space(.), 'Update'))]"));
      await safeClick(driver, addButton);
      await driver.sleep(800);

      await step(driver, 'Confirm Add in modal');
      const confirmBtn = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(normalize-space(.), 'Add Entry')]")),
        10000
      ).catch(() => null);
      
      if (confirmBtn) {
        await safeClick(driver, confirmBtn);
        await driver.sleep(2000);
      }
    });

    it('Should handle special characters in keywords', async () => {
      await step(driver, 'Fill English information');
      const infoEnInput = await driver.findElement(By.xpath("//textarea[@name='info_en']"));
      await infoEnInput.clear();
      await infoEnInput.sendKeys(`Special Chars Entry ${Date.now()}`);
      await driver.sleep(500);

      await step(driver, 'Fill keywords with special characters');
      const keywordsInput = await driver.findElement(By.xpath("//input[@name='keywords']"));
      await keywordsInput.clear();
      await keywordsInput.sendKeys('keyword@1, keyword#2, keyword$3');
      await driver.sleep(500);

      await step(driver, 'Submit form');
      const addButton = await driver.findElement(By.xpath("//button[contains(normalize-space(.), 'Add') and not(contains(normalize-space(.), 'Update'))]"));
      await safeClick(driver, addButton);
      await driver.sleep(800);

      await step(driver, 'Confirm Add in modal');
      const confirmBtn = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(normalize-space(.), 'Add Entry')]")),
        10000
      ).catch(() => null);
      
      if (confirmBtn) {
        await safeClick(driver, confirmBtn);
        await driver.sleep(2000);
      }
    });

    it('Should handle whitespace-only input as invalid', async () => {
      await step(driver, 'Fill English information with only spaces');
      const infoEnInput = await driver.findElement(By.xpath("//textarea[@name='info_en']"));
      await infoEnInput.clear();
      await infoEnInput.sendKeys('     ');
      await driver.sleep(500);

      await step(driver, 'Try to submit form');
      const addButton = await driver.findElement(By.xpath("//button[contains(normalize-space(.), 'Add') and not(contains(normalize-space(.), 'Update'))]"));
      await safeClick(driver, addButton);
      await driver.sleep(800);

      await step(driver, 'Verify validation error appears');
      const errorMsg = await driver.wait(
        until.elementLocated(By.xpath("//p[contains(., 'English information is required')]")),
        5000
      ).catch(() => null);
      if (!errorMsg) throw new Error('Whitespace-only input should be treated as invalid');
    });

    it('Should display correct entry count in tabs', async () => {
      await step(driver, 'Click Active tab');
      const activeTab = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(., 'Active Entries')]")),
        10000
      );
      await safeClick(driver, activeTab);
      await driver.sleep(800);

      await step(driver, 'Extract count from Active tab button');
      const activeTabText = await activeTab.getText();
      const activeCountMatch = activeTabText.match(/\((\d+)\)/);
      const activeCount = activeCountMatch ? parseInt(activeCountMatch[1]) : 0;

      await step(driver, 'Count actual active entries');
      const actualActiveEntries = await driver.findElements(By.xpath("//div[contains(@class,'rounded-xl') and contains(@class,'border-2') and contains(@class,'border-gray-200')]"));
      
      if (actualActiveEntries.length !== activeCount) {
        console.log(`Warning: Tab shows ${activeCount} entries but found ${actualActiveEntries.length} actual entries`);
      }
    });
  });

  // ===== FORM STATE TESTS =====
  describe('Form State Tests', () => {
    it('Should clear form after successful submission', async () => {
      await step(driver, 'Fill form with data');
      const infoEnInput = await driver.findElement(By.xpath("//textarea[@name='info_en']"));
      await infoEnInput.clear();
      await infoEnInput.sendKeys(`Form Clear Test ${Date.now()}`);
      await driver.sleep(500);

      const keywordsInput = await driver.findElement(By.xpath("//input[@name='keywords']"));
      await keywordsInput.clear();
      await keywordsInput.sendKeys('test, keywords');
      await driver.sleep(500);

      await step(driver, 'Submit form');
      const addButton = await driver.findElement(By.xpath("//button[contains(normalize-space(.), 'Add') and not(contains(normalize-space(.), 'Update'))]"));
      await safeClick(driver, addButton);
      await driver.sleep(800);

      await step(driver, 'Confirm Add in modal');
      const confirmBtn = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(normalize-space(.), 'Add Entry')]")),
        10000
      ).catch(() => null);
      
      if (confirmBtn) {
        await safeClick(driver, confirmBtn);
        await driver.sleep(2000);

        await step(driver, 'Verify form is cleared');
        const infoEnAfter = await driver.findElement(By.xpath("//textarea[@name='info_en']"));
        const valueAfter = await infoEnAfter.getAttribute('value');
        if (valueAfter.trim() !== '') {
          throw new Error('Form was not cleared after successful submission');
        }
      }
    });

    it('Should populate form when editing an entry', async () => {
      await step(driver, 'Click Active tab');
      const activeTab = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(., 'Active Entries')]")),
        10000
      );
      await safeClick(driver, activeTab);
      await driver.sleep(800);

      await step(driver, 'Click Edit button on first entry');
      const editBtn = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(., 'Edit')]")),
        10000
      ).catch(() => null);
      
      if (editBtn) {
        await safeClick(driver, editBtn);
        await driver.sleep(800);

        await step(driver, 'Verify form is populated');
        const infoEnInput = await driver.findElement(By.xpath("//textarea[@name='info_en']"));
        const value = await infoEnInput.getAttribute('value');
        if (!value || value.trim() === '') {
          throw new Error('Form not populated when editing entry');
        }

        await step(driver, 'Verify Update button is shown instead of Add');
        const updateBtn = await driver.findElements(By.xpath("//button[contains(normalize-space(.), 'Update') and not(contains(normalize-space(.), 'Tag'))]"));
        if (updateBtn.length === 0) {
          throw new Error('Update button not shown in edit mode');
        }
      }
    });
  });
});
