const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const fs = require('fs');
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

function resolveTestImage() {
  const p1 = path.resolve(process.cwd(), 'tests', 'aasets', 'images.jpg');
  const p2 = path.resolve(process.cwd(), 'tests', 'assets', 'images.jpg');
  if (fs.existsSync(p1)) return p1;
  if (fs.existsSync(p2)) return p2;
  return null;
}

async function goToItinerary(driver) {
  await driver.get(`${BASE_URL}/AdminItinerary`);
  await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000).catch(()=>{});
  await driver.sleep(800);
  try {
    await driver.wait(until.elementLocated(By.xpath("//h2[contains(., 'Add Itinerary')] | //h2[contains(., 'Edit Itinerary')]")), 6000);
    return;
  } catch (_) {}
  // Hash route fallback
  await driver.get(`${BASE_URL}/#/AdminItinerary`);
  await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000).catch(()=>{});
  await driver.sleep(800);
}

describe('Itinerary Management - Full CRUD', function () {
  this.timeout(240000);
  let driver;
  const UNIQUE_NAME = `Test Itinerary ${Date.now()}`;

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

  it('Logs in and navigates to Itinerary Management', async () => {
    await step(driver, 'Login to production');
    await loginToProduction(driver, BASE_URL, ADMIN_USER, ADMIN_PASS);

    await step(driver, 'Navigate to Itinerary Management');
    await goToItinerary(driver);

    await step(driver, 'Verify Itinerary page loaded');
    const heading = await driver.wait(
      until.elementLocated(By.xpath("//h2[contains(., 'Add Itinerary')]")),
      10000
    );
    if (!heading) throw new Error('Itinerary Management page not found');
  });

  it('Perform CRUD: Add New Itinerary', async () => {
    await step(driver, 'Upload image');
    const imgPath = resolveTestImage();
    if (!imgPath) throw new Error('Test image not found');
    
    const fileInput = await driver.wait(
      until.elementLocated(By.xpath("//input[@type='file' and @accept='image/png']")),
      10000
    );
    await fileInput.sendKeys(imgPath);
    await driver.sleep(1000);

    await step(driver, 'Enter itinerary name');
    const nameInput = await driver.findElement(By.xpath("//input[@placeholder='Itinerary Name']"));
    await nameInput.clear();
    await nameInput.sendKeys(UNIQUE_NAME);
    await driver.sleep(500);

    await step(driver, 'Enter description');
    const descInput = await driver.findElement(By.xpath("//textarea[@placeholder='Description']"));
    await descInput.clear();
    await descInput.sendKeys('This is a test itinerary with multiple sites');
    await driver.sleep(500);

    await step(driver, 'Enter duration (4 hours)');
    const durationInput = await driver.findElement(By.xpath("//input[@placeholder='Duration (hours)']"));
    await durationInput.clear();
    await durationInput.sendKeys('4');
    await driver.sleep(500);

    await step(driver, 'Select 4 sites by clicking Add buttons');
    // Find all site cards and click the first 4 Add buttons
    const siteAddButtons = await driver.findElements(By.xpath("//button[contains(., 'Add') and contains(@class, 'bg-red-500')]"));
    const sitesToAdd = Math.min(4, siteAddButtons.length);
    
    for (let i = 0; i < sitesToAdd; i++) {
      const buttons = await driver.findElements(By.xpath("//button[contains(., 'Add') and contains(@class, 'bg-red-500')]"));
      if (buttons.length > 0) {
        await safeClick(driver, buttons[0]);
        await driver.sleep(600);
      }
    }

    await step(driver, 'Verify 4 sites are selected');
    const selectedCount = await driver.findElements(By.xpath("//button[contains(., 'Added') and contains(@class, 'bg-green-500')]"));
    if (selectedCount.length < 4) throw new Error(`Expected 4 sites selected, got ${selectedCount.length}`);

    await step(driver, 'Click Save button');
    const saveButton = await driver.findElement(By.xpath("//button[contains(., 'Save')]"));
    await safeClick(driver, saveButton);
    await driver.sleep(800);

    await step(driver, 'Confirm Add in modal');
    const confirmBtn = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(., 'Add Itinerary')]")),
      10000
    );
    await safeClick(driver, confirmBtn);
    await driver.sleep(2000);

    await step(driver, 'Verify itinerary appears in Active list');
    const itineraryFound = await driver.wait(async () => {
      const items = await driver.findElements(By.xpath(`//h3[contains(., '${UNIQUE_NAME}')]`));
      return items.length > 0;
    }, 10000).catch(() => false);
    if (!itineraryFound) throw new Error('Itinerary not found after adding');
  });

  it('Perform CRUD: Edit Itinerary', async () => {
    await step(driver, 'Find and click Edit button for the itinerary');
    const itineraryCard = await driver.findElement(By.xpath(`//h3[contains(., '${UNIQUE_NAME}')]/ancestor::div[contains(@class,'rounded-xl')]`));
    const editBtn = await itineraryCard.findElement(By.xpath(".//button[contains(., 'Edit')]"));
    await safeClick(driver, editBtn);
    await driver.sleep(800);

    await step(driver, 'Verify form is populated with itinerary data');
    const nameInput = await driver.findElement(By.xpath("//input[@placeholder='Itinerary Name']"));
    const currentValue = await nameInput.getAttribute('value');
    if (!currentValue.includes(UNIQUE_NAME)) throw new Error('Form not populated with itinerary data');

    await step(driver, 'Update itinerary name');
    const updatedName = `${UNIQUE_NAME} UPDATED`;
    await nameInput.clear();
    await nameInput.sendKeys(updatedName);
    await driver.sleep(500);

    await step(driver, 'Update description');
    const descInput = await driver.findElement(By.xpath("//textarea[@placeholder='Description']"));
    await descInput.clear();
    await descInput.sendKeys('Updated description for test itinerary');
    await driver.sleep(500);

    await step(driver, 'Click Update button');
    const updateButton = await driver.findElement(By.xpath("//button[contains(., 'Update')]"));
    await safeClick(driver, updateButton);
    await driver.sleep(800);

    await step(driver, 'Confirm Update in modal');
    const confirmBtn = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(., 'Update')]")),
      10000
    );
    await safeClick(driver, confirmBtn);
    await driver.sleep(2000);

    await step(driver, 'Verify itinerary is updated');
    const updatedFound = await driver.wait(async () => {
      const items = await driver.findElements(By.xpath(`//h3[contains(., 'UPDATED')]`));
      return items.length > 0;
    }, 10000).catch(() => false);
    if (!updatedFound) throw new Error('Itinerary not updated');
  });

  it('Perform CRUD: Archive Itinerary', async () => {
    await step(driver, 'Find itinerary and click Archive button');
    const itineraryCard = await driver.findElement(By.xpath(`//h3[contains(., 'UPDATED')]/ancestor::div[contains(@class,'rounded-xl')]`));
    const archiveBtn = await itineraryCard.findElement(By.xpath(".//button[contains(., 'Archive')]"));
    await safeClick(driver, archiveBtn);
    await driver.sleep(800);

    await step(driver, 'Confirm Archive in modal');
    const confirmBtn = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(., 'Archive')]")),
      10000
    );
    await safeClick(driver, confirmBtn);
    await driver.sleep(2000);

    await step(driver, 'Click Archived tab');
    const archivedTab = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Archived')]")),
      10000
    );
    await safeClick(driver, archivedTab);
    await driver.sleep(1000);

    await step(driver, 'Verify itinerary appears in Archived tab');
    const archivedFound = await driver.wait(async () => {
      const items = await driver.findElements(By.xpath(`//h3[contains(., 'UPDATED')]`));
      return items.length > 0;
    }, 10000).catch(() => false);
    if (!archivedFound) throw new Error('Itinerary not found in Archived tab');
  });

  it('Perform CRUD: Restore Itinerary', async () => {
    await step(driver, 'Find archived itinerary and click Restore button');
    const archivedCard = await driver.findElement(By.xpath(`//h3[contains(., 'UPDATED')]/ancestor::div[contains(@class,'rounded-xl')]`));
    const restoreBtn = await archivedCard.findElement(By.xpath(".//button[contains(., 'Restore')]"));
    await safeClick(driver, restoreBtn);
    await driver.sleep(800);

    await step(driver, 'Confirm Restore in modal');
    const confirmBtn = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(., 'Restore')]")),
      10000
    );
    await safeClick(driver, confirmBtn);
    await driver.sleep(2000);

    await step(driver, 'Click Active tab');
    const activeTab = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Active Itineraries')]")),
      10000
    );
    await safeClick(driver, activeTab);
    await driver.sleep(1000);

    await step(driver, 'Verify itinerary is back in Active tab');
    const activeFound = await driver.wait(async () => {
      const items = await driver.findElements(By.xpath(`//h3[contains(., 'UPDATED')]`));
      return items.length > 0;
    }, 10000).catch(() => false);
    if (!activeFound) throw new Error('Itinerary not restored to Active tab');
  });

  it('Perform CRUD: Archive again for permanent delete', async () => {
    await step(driver, 'Find itinerary and click Archive button');
    const itineraryCard = await driver.findElement(By.xpath(`//h3[contains(., 'UPDATED')]/ancestor::div[contains(@class,'rounded-xl')]`));
    const archiveBtn = await itineraryCard.findElement(By.xpath(".//button[contains(., 'Archive')]"));
    await safeClick(driver, archiveBtn);
    await driver.sleep(800);

    await step(driver, 'Confirm Archive in modal');
    const confirmBtn = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(., 'Archive')]")),
      10000
    );
    await safeClick(driver, confirmBtn);
    await driver.sleep(2000);

    await step(driver, 'Click Archived tab');
    const archivedTab = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Archived')]")),
      10000
    );
    await safeClick(driver, archivedTab);
    await driver.sleep(1000);
  });

  it('Perform CRUD: Permanently Delete Itinerary', async () => {
    await step(driver, 'Find archived itinerary and click Delete button');
    const archivedCard = await driver.findElement(By.xpath(`//h3[contains(., 'UPDATED')]/ancestor::div[contains(@class,'rounded-xl')]`));
    const deleteBtn = await archivedCard.findElement(By.xpath(".//button[contains(., 'Delete')]"));
    await safeClick(driver, deleteBtn);
    await driver.sleep(800);

    await step(driver, 'Confirm Delete Forever in modal');
    const confirmBtn = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(., 'Delete Forever')]")),
      10000
    );
    await safeClick(driver, confirmBtn);
    await driver.sleep(2000);

    await step(driver, 'Verify itinerary is permanently deleted');
    const stillExists = await driver.findElements(By.xpath(`//h3[contains(., 'UPDATED')]`)).catch(() => []);
    if (stillExists.length > 0) throw new Error('Itinerary still exists after permanent delete');
  });
});
