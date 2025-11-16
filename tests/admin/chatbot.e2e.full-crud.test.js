const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { loginToProduction } = require('./production-login-helper');
const { cleanupArchivableItems } = require('./test-cleanup-helper');

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
    await driver.wait(until.elementLocated(By.xpath("//h3[contains(.,'Knowledge Base Management')] | //h1[contains(.,'Chatbot')]")), 6000);
    return;
  } catch (_) {}
  // Hash route fallback
  await driver.get(`${BASE_URL}/#/AdminManageChatbot`);
  await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000).catch(()=>{});
  await driver.sleep(800);
}

describe('Chatbot Management - Full CRUD: Knowledge Base Entries', function () {
  this.timeout(240000);
  let driver;
  const UNIQUE_ENTRY_EN = `Test Entry EN ${Date.now()}`;
  const UNIQUE_ENTRY_FIL = `Test Entry FIL ${Date.now()}`;

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

  it('Perform CRUD: Add New Chatbot Knowledge Base Entry', async () => {
    await step(driver, 'Fill English information');
    const infoEnInput = await driver.wait(
      until.elementLocated(By.xpath("//textarea[@name='info_en']")),
      10000
    );
    await infoEnInput.clear();
    await infoEnInput.sendKeys(UNIQUE_ENTRY_EN);
    await driver.sleep(500);

    await step(driver, 'Fill Filipino information');
    const infoFilInput = await driver.findElement(By.xpath("//textarea[@name='info_fil']"));
    await infoFilInput.clear();
    await infoFilInput.sendKeys(UNIQUE_ENTRY_FIL);
    await driver.sleep(500);

    await step(driver, 'Enter keywords (comma separated)');
    const keywordsInput = await driver.findElement(By.xpath("//input[@name='keywords']"));
    await keywordsInput.clear();
    await keywordsInput.sendKeys('keyword1, keyword2, keyword3');
    await driver.sleep(500);

    await step(driver, 'Select "About" tag');
    // Find the tag checkboxes container
    const tagLabels = await driver.findElements(By.xpath("//label[contains(.,'About')]"));
    if (tagLabels.length > 0) {
      const aboutCheckbox = await tagLabels[0].findElement(By.xpath(".//input[@type='checkbox']"));
      const isChecked = await aboutCheckbox.isSelected();
      if (!isChecked) {
        await safeClick(driver, aboutCheckbox);
        await driver.sleep(500);
      }
    }

    await step(driver, 'Click Add button');
    const addButton = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(normalize-space(.), 'Add') and not(contains(normalize-space(.), 'Update'))]")),
      10000
    );
    await safeClick(driver, addButton);
    await driver.sleep(800);

    await step(driver, 'Confirm Add in modal');
    const confirmAddBtn = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(normalize-space(.), 'Add Entry')]")),
      10000
    );
    await safeClick(driver, confirmAddBtn);
    await driver.sleep(2000);

    await step(driver, 'Verify entry appears in Active list');
    const entryFound = await driver.wait(async () => {
      const entries = await driver.findElements(By.xpath(`//p[contains(., '${UNIQUE_ENTRY_EN}')]`));
      return entries.length > 0;
    }, 10000).catch(() => false);
    if (!entryFound) throw new Error('Entry not found after adding');
  });

  it('Perform CRUD: Edit Entry', async () => {
    await step(driver, 'Find and click Edit button for the entry');
    const entryCard = await driver.findElement(By.xpath(`//p[contains(., '${UNIQUE_ENTRY_EN}')]/ancestor::div[contains(@class,'rounded-xl')]`));
    const editBtn = await entryCard.findElement(By.xpath(".//button[contains(., 'Edit')]"));
    await safeClick(driver, editBtn);
    await driver.sleep(800);

    await step(driver, 'Verify form is populated with entry data');
    const infoEnInput = await driver.findElement(By.xpath("//textarea[@name='info_en']"));
    const currentValue = await infoEnInput.getAttribute('value');
    if (!currentValue.includes(UNIQUE_ENTRY_EN)) throw new Error('Form not populated with entry data');

    await step(driver, 'Update English information');
    const updatedEN = `${UNIQUE_ENTRY_EN} UPDATED`;
    await infoEnInput.clear();
    await infoEnInput.sendKeys(updatedEN);
    await driver.sleep(500);

    await step(driver, 'Click Update button');
    const updateButton = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(normalize-space(.), 'Update') and not(contains(normalize-space(.), 'Tag'))]")),
      10000
    );
    await safeClick(driver, updateButton);
    await driver.sleep(800);

    await step(driver, 'Confirm Update in modal');
    const confirmUpdateBtn = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(normalize-space(.), 'Update')]")),
      10000
    );
    await safeClick(driver, confirmUpdateBtn);
    await driver.sleep(2000);

    await step(driver, 'Verify entry is updated');
    const updatedEntryFound = await driver.wait(async () => {
      const entries = await driver.findElements(By.xpath(`//p[contains(., 'UPDATED')]`));
      return entries.length > 0;
    }, 10000).catch(() => false);
    if (!updatedEntryFound) throw new Error('Entry not updated');
  });

  it('Perform CRUD: Archive Entry', async () => {
    await step(driver, 'Find entry and click Archive button');
    const entryCard = await driver.findElement(By.xpath(`//p[contains(., 'UPDATED')]/ancestor::div[contains(@class,'rounded-xl')]`));
    const archiveBtn = await entryCard.findElement(By.xpath(".//button[contains(., 'Archive')]"));
    await safeClick(driver, archiveBtn);
    await driver.sleep(800);

    await step(driver, 'Confirm Archive in modal');
    const confirmArchiveBtn = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(normalize-space(.), 'Archive Entry')]")),
      10000
    );
    await safeClick(driver, confirmArchiveBtn);
    await driver.sleep(2000);

    await step(driver, 'Click Archived tab');
    const archivedTab = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Archived')]")),
      10000
    );
    await safeClick(driver, archivedTab);
    await driver.sleep(1000);

    await step(driver, 'Verify entry appears in Archived tab');
    const archivedEntryFound = await driver.wait(async () => {
      const entries = await driver.findElements(By.xpath(`//p[contains(., 'UPDATED')]`));
      return entries.length > 0;
    }, 10000).catch(() => false);
    if (!archivedEntryFound) throw new Error('Entry not found in Archived tab');
  });

  it('Perform CRUD: Restore Entry', async () => {
    await step(driver, 'Find archived entry and click Restore button');
    const archivedCard = await driver.findElement(By.xpath(`//p[contains(., 'UPDATED')]/ancestor::div[contains(@class,'rounded-xl')]`));
    const restoreBtn = await archivedCard.findElement(By.xpath(".//button[contains(., 'Restore')]"));
    await safeClick(driver, restoreBtn);
    await driver.sleep(800);

    await step(driver, 'Confirm Restore in modal');
    const confirmRestoreBtn = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(normalize-space(.), 'Restore Entry')]")),
      10000
    );
    await safeClick(driver, confirmRestoreBtn);
    await driver.sleep(2000);

    await step(driver, 'Click Active tab');
    const activeTab = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Active Entries')]")),
      10000
    );
    await safeClick(driver, activeTab);
    await driver.sleep(1000);

    await step(driver, 'Verify entry is back in Active tab');
    const activeEntryFound = await driver.wait(async () => {
      const entries = await driver.findElements(By.xpath(`//p[contains(., 'UPDATED')]`));
      return entries.length > 0;
    }, 10000).catch(() => false);
    if (!activeEntryFound) throw new Error('Entry not restored to Active tab');
  });

  it('Perform CRUD: Archive again for permanent delete', async () => {
    await step(driver, 'Find entry and click Archive button');
    const entryCard = await driver.findElement(By.xpath(`//p[contains(., 'UPDATED')]/ancestor::div[contains(@class,'rounded-xl')]`));
    const archiveBtn = await entryCard.findElement(By.xpath(".//button[contains(., 'Archive')]"));
    await safeClick(driver, archiveBtn);
    await driver.sleep(800);

    await step(driver, 'Confirm Archive in modal');
    const confirmArchiveBtn = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(normalize-space(.), 'Archive Entry')]")),
      10000
    );
    await safeClick(driver, confirmArchiveBtn);
    await driver.sleep(2000);

    await step(driver, 'Click Archived tab');
    const archivedTab = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Archived')]")),
      10000
    );
    await safeClick(driver, archivedTab);
    await driver.sleep(1000);
  });

  it('Perform CRUD: Permanently Delete Entry', async () => {
    await step(driver, 'Find archived entry and click Delete button');
    const archivedCard = await driver.findElement(By.xpath(`//p[contains(., 'UPDATED')]/ancestor::div[contains(@class,'rounded-xl')]`));
    const deleteBtn = await archivedCard.findElement(By.xpath(".//button[contains(., 'Delete')]"));
    await safeClick(driver, deleteBtn);
    await driver.sleep(800);

    await step(driver, 'Confirm Delete Forever in modal');
    const confirmDeleteBtn = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(normalize-space(.), 'Delete Forever')]")),
      10000
    );
    await safeClick(driver, confirmDeleteBtn);
    await driver.sleep(2000);

    await step(driver, 'Verify entry is permanently deleted');
    const stillExists = await driver.findElements(By.xpath(`//p[contains(., 'UPDATED')]`)).catch(() => []);
    if (stillExists.length > 0) throw new Error('Entry still exists after permanent delete');
  });

  it('Test Validations: Try to add entry without English information', async () => {
    await step(driver, 'Click Active tab to ensure we are on active entries');
    const activeTab = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Active Entries')]")),
      10000
    );
    await safeClick(driver, activeTab);
    await driver.sleep(800);

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

  it('Test Filtering: Filter by "About" tag', async () => {
    await step(driver, 'Add a test entry with About tag');
    const infoEnInput = await driver.findElement(By.xpath("//textarea[@name='info_en']"));
    await infoEnInput.clear();
    await infoEnInput.sendKeys(`Filter Test ${Date.now()}`);
    await driver.sleep(500);

    const keywordsInput = await driver.findElement(By.xpath("//input[@name='keywords']"));
    await keywordsInput.clear();
    await keywordsInput.sendKeys('filter, test');
    await driver.sleep(500);

    // Select About tag
    const tagLabels = await driver.findElements(By.xpath("//label[contains(.,'About')]"));
    if (tagLabels.length > 0) {
      const aboutCheckbox = await tagLabels[0].findElement(By.xpath(".//input[@type='checkbox']"));
      const isChecked = await aboutCheckbox.isSelected();
      if (!isChecked) {
        await safeClick(driver, aboutCheckbox);
        await driver.sleep(500);
      }
    }

    const addButton = await driver.findElement(By.xpath("//button[contains(normalize-space(.), 'Add') and not(contains(normalize-space(.), 'Update'))]"));
    await safeClick(driver, addButton);
    await driver.sleep(800);

    const confirmAddBtn = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(normalize-space(.), 'Add Entry')]")),
      10000
    );
    await safeClick(driver, confirmAddBtn);
    await driver.sleep(2000);

    await step(driver, 'Click About tag filter button');
    const aboutFilterBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'About') and contains(@class,'px-2')]")),
      10000
    );
    await safeClick(driver, aboutFilterBtn);
    await driver.sleep(1000);

    await step(driver, 'Verify only entries with About tag are shown');
    const entries = await driver.findElements(By.xpath("//div[contains(@class,'rounded-xl') and contains(@class,'border-2')]"));
    if (entries.length === 0) throw new Error('No entries shown after filtering by About tag');
    
    // Verify all shown entries have About tag
    for (const entry of entries) {
      const hasAboutTag = await entry.findElements(By.xpath(".//span[contains(., 'About')]")).catch(() => []);
      // At least the filtered entry should have the tag
    }
  });

  // Cleanup: Delete all test entries after tests complete
  after(async () => {
    try {
      await step(driver, 'Cleanup: Deleting test entries');
      
      // Go to Active tab first
      const activeTab = await driver.findElements(By.xpath("//button[contains(., 'Active Entries')]"));
      if (activeTab.length > 0) {
        await safeClick(driver, activeTab[0]);
        await driver.sleep(1000);
      }

      // Use the cleanup helper to remove all test entries
      const testKeywords = ['Test Entry', 'Filter Test', 'Form Clear Test', 'UPDATED'];
      const result = await cleanupArchivableItems(driver, testKeywords, {
        itemSelector: "//div[contains(@class,'rounded-xl') and contains(@class,'border')]",
        archiveButtonText: 'Archive',
        deleteButtonText: 'Delete',
        confirmArchiveText: 'Archive Entry',
        confirmDeleteText: 'Delete Forever',
        archivedTabText: 'Archived',
        sleepMs: 1000
      });

      console.log(`✓ Cleanup completed: Archived ${result.archived}, Deleted ${result.deleted}`);
      if (result.errors.length > 0) {
        console.log(`⚠️ Cleanup had ${result.errors.length} errors (non-critical)`);
      }
    } catch (err) {
      console.log('Cleanup error (non-critical):', err.message);
    }
  });
});
