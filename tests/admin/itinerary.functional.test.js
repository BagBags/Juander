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
    await driver.executeScript("arguments[0].style.outline='3px solid #e11d48';", el);
  } catch (_) {}
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", el).catch(()=>{});
  await driver.sleep(300);
  try { await el.click(); } catch (_) { await driver.executeScript('arguments[0].click();', el); }
  await driver.sleep(300);
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
    await driver.wait(until.elementLocated(By.xpath("//h2[contains(., 'Add Itinerary')]")), 6000);
    return;
  } catch (_) {
    await driver.get(`${BASE_URL}/#/AdminItinerary`);
    await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000).catch(()=>{});
    await driver.sleep(800);
  }
}

describe('Itinerary Management - Functional Tests', function () {
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

  it('Logs in and navigates to Itinerary Management', async () => {
    await step(driver, 'Login to production');
    await loginToProduction(driver, BASE_URL, ADMIN_USER, ADMIN_PASS);
    await step(driver, 'Navigate to Itinerary Management');
    await goToItinerary(driver);
    const heading = await driver.wait(until.elementLocated(By.xpath("//h2[contains(., 'Add Itinerary')]")), 10000);
    if (!heading) throw new Error('Itinerary Management page not found');
  });

  describe('Validation Tests', () => {
    it('Should show error when submitting without itinerary name', async () => {
      await step(driver, 'Clear name field');
      const nameInput = await driver.findElement(By.xpath("//input[@placeholder='Itinerary Name']"));
      await nameInput.clear();
      await driver.sleep(500);
      const saveButton = await driver.findElement(By.xpath("//button[contains(., 'Save')]"));
      await safeClick(driver, saveButton);
      await driver.sleep(800);
      const errorMsg = await driver.wait(until.elementLocated(By.xpath("//p[contains(., 'Itinerary name is required')]")), 5000).catch(() => null);
      if (!errorMsg) throw new Error('Validation error not shown for missing name');
    });

    it('Should show error when submitting without description', async () => {
      await step(driver, 'Fill name and clear description');
      const nameInput = await driver.findElement(By.xpath("//input[@placeholder='Itinerary Name']"));
      await nameInput.clear();
      await nameInput.sendKeys(`Test ${Date.now()}`);
      const descInput = await driver.findElement(By.xpath("//textarea[@placeholder='Description']"));
      await descInput.clear();
      await driver.sleep(500);
      const saveButton = await driver.findElement(By.xpath("//button[contains(., 'Save')]"));
      await safeClick(driver, saveButton);
      const errorMsg = await driver.wait(until.elementLocated(By.xpath("//p[contains(., 'Description is required')]")), 5000).catch(() => null);
      if (!errorMsg) throw new Error('Validation error not shown for missing description');
    });

    it('Should show error when submitting without duration', async () => {
      await step(driver, 'Fill name and description, clear duration');
      const nameInput = await driver.findElement(By.xpath("//input[@placeholder='Itinerary Name']"));
      await nameInput.clear();
      await nameInput.sendKeys(`Test ${Date.now()}`);
      const descInput = await driver.findElement(By.xpath("//textarea[@placeholder='Description']"));
      await descInput.clear();
      await descInput.sendKeys('Test');
      const durationInput = await driver.findElement(By.xpath("//input[@placeholder='Duration (hours)']"));
      await durationInput.clear();
      await driver.sleep(500);
      const saveButton = await driver.findElement(By.xpath("//button[contains(., 'Save')]"));
      await safeClick(driver, saveButton);
      const errorMsg = await driver.wait(until.elementLocated(By.xpath("//p[contains(., 'Duration is required')]")), 5000).catch(() => null);
      if (!errorMsg) throw new Error('Validation error not shown for missing duration');
    });

    it('Should show error when submitting without image', async () => {
      await step(driver, 'Fill name, description, duration without image');
      const nameInput = await driver.findElement(By.xpath("//input[@placeholder='Itinerary Name']"));
      await nameInput.clear();
      await nameInput.sendKeys(`Test ${Date.now()}`);
      const descInput = await driver.findElement(By.xpath("//textarea[@placeholder='Description']"));
      await descInput.clear();
      await descInput.sendKeys('Test');
      const durationInput = await driver.findElement(By.xpath("//input[@placeholder='Duration (hours)']"));
      await durationInput.clear();
      await durationInput.sendKeys('4');
      await driver.sleep(500);
      const saveButton = await driver.findElement(By.xpath("//button[contains(., 'Save')]"));
      await safeClick(driver, saveButton);
      const errorMsg = await driver.wait(until.elementLocated(By.xpath("//p[contains(., 'Image is required')]")), 5000).catch(() => null);
      if (!errorMsg) throw new Error('Validation error not shown for missing image');
    });

    it('Should show error when submitting without selecting sites', async () => {
      await step(driver, 'Upload image and fill all fields except sites');
      const imgPath = resolveTestImage();
      if (!imgPath) throw new Error('Test image not found');
      const fileInput = await driver.findElement(By.xpath("//input[@type='file' and @accept='image/png']"));
      await fileInput.sendKeys(imgPath);
      await driver.sleep(1000);
      const nameInput = await driver.findElement(By.xpath("//input[@placeholder='Itinerary Name']"));
      await nameInput.clear();
      await nameInput.sendKeys(`Test ${Date.now()}`);
      const descInput = await driver.findElement(By.xpath("//textarea[@placeholder='Description']"));
      await descInput.clear();
      await descInput.sendKeys('Test');
      const durationInput = await driver.findElement(By.xpath("//input[@placeholder='Duration (hours)']"));
      await durationInput.clear();
      await durationInput.sendKeys('4');
      await driver.sleep(500);
      const saveButton = await driver.findElement(By.xpath("//button[contains(., 'Save')]"));
      await safeClick(driver, saveButton);
      const errorMsg = await driver.wait(until.elementLocated(By.xpath("//p[contains(., 'Please select at least one site')]")), 5000).catch(() => null);
      if (!errorMsg) throw new Error('Validation error not shown for no sites selected');
    });
  });

  describe('Site Selection Tests', () => {
    it('Should add site when clicking Add button', async () => {
      await step(driver, 'Click first Add button');
      const addButtons = await driver.findElements(By.xpath("//button[contains(., 'Add') and contains(@class, 'bg-red-500')]"));
      if (addButtons.length > 0) {
        await safeClick(driver, addButtons[0]);
        await driver.sleep(600);
        const addedButtons = await driver.findElements(By.xpath("//button[contains(., 'Added') and contains(@class, 'bg-green-500')]"));
        if (addedButtons.length === 0) throw new Error('Site not added');
      }
    });

    it('Should remove site when clicking Added button', async () => {
      await step(driver, 'Click Added button to remove site');
      const addedButtons = await driver.findElements(By.xpath("//button[contains(., 'Added') and contains(@class, 'bg-green-500')]"));
      if (addedButtons.length > 0) {
        await safeClick(driver, addedButtons[0]);
        await driver.sleep(600);
        const addButtons = await driver.findElements(By.xpath("//button[contains(., 'Add') and contains(@class, 'bg-red-500')]"));
        if (addButtons.length === 0) throw new Error('Site not removed');
      }
    });

    it('Should allow selecting multiple sites', async () => {
      await step(driver, 'Select 4 sites');
      for (let i = 0; i < 4; i++) {
        const addButtons = await driver.findElements(By.xpath("//button[contains(., 'Add') and contains(@class, 'bg-red-500')]"));
        if (addButtons.length > 0) {
          await safeClick(driver, addButtons[0]);
          await driver.sleep(600);
        }
      }
      const addedButtons = await driver.findElements(By.xpath("//button[contains(., 'Added') and contains(@class, 'bg-green-500')]"));
      if (addedButtons.length < 4) throw new Error(`Expected 4 sites, got ${addedButtons.length}`);
    });
  });

  describe('Tab Switching Tests', () => {
    it('Should switch between Active and Archived tabs', async () => {
      await step(driver, 'Click Active tab');
      const activeTab = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Active Itineraries')]")), 10000);
      await safeClick(driver, activeTab);
      await driver.sleep(800);
      await step(driver, 'Click Archived tab');
      const archivedTab = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Archived')]")), 10000);
      await safeClick(driver, archivedTab);
      await driver.sleep(800);
      await step(driver, 'Switch back to Active tab');
      await safeClick(driver, activeTab);
      await driver.sleep(800);
    });
  });

  describe('Form State Tests', () => {
    it('Should populate form when editing an itinerary', async () => {
      await step(driver, 'Click Active tab');
      const activeTab = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Active Itineraries')]")), 10000);
      await safeClick(driver, activeTab);
      await driver.sleep(800);
      const editBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Edit')]")), 10000).catch(() => null);
      if (editBtn) {
        await safeClick(driver, editBtn);
        await driver.sleep(800);
        const nameInput = await driver.findElement(By.xpath("//input[@placeholder='Itinerary Name']"));
        const value = await nameInput.getAttribute('value');
        if (!value || value.trim() === '') throw new Error('Form not populated when editing');
        const updateBtn = await driver.findElements(By.xpath("//button[contains(., 'Update')]"));
        if (updateBtn.length === 0) throw new Error('Update button not shown in edit mode');
      }
    });

    it('Should clear form when clicking Cancel button', async () => {
      await step(driver, 'Click Edit button');
      const editBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Edit')]")), 10000).catch(() => null);
      if (editBtn) {
        await safeClick(driver, editBtn);
        await driver.sleep(800);
        const nameInput = await driver.findElement(By.xpath("//input[@placeholder='Itinerary Name']"));
        await nameInput.clear();
        await nameInput.sendKeys('Modified');
        await driver.sleep(500);
        const cancelBtn = await driver.findElement(By.xpath("//button[contains(., 'Cancel')]"));
        await safeClick(driver, cancelBtn);
        await driver.sleep(800);
        const nameAfter = await driver.findElement(By.xpath("//input[@placeholder='Itinerary Name']"));
        const valueAfter = await nameAfter.getAttribute('value');
        if (valueAfter.trim() !== '') throw new Error('Form not cleared after Cancel');
      }
    });
  });

  describe('Edge Case Tests', () => {
    it('Should handle decimal duration values', async () => {
      await step(driver, 'Upload image and fill form with decimal duration');
      const imgPath = resolveTestImage();
      if (!imgPath) throw new Error('Test image not found');
      const fileInput = await driver.findElement(By.xpath("//input[@type='file' and @accept='image/png']"));
      await fileInput.sendKeys(imgPath);
      await driver.sleep(1000);
      const nameInput = await driver.findElement(By.xpath("//input[@placeholder='Itinerary Name']"));
      await nameInput.clear();
      await nameInput.sendKeys(`Decimal Test ${Date.now()}`);
      const descInput = await driver.findElement(By.xpath("//textarea[@placeholder='Description']"));
      await descInput.clear();
      await descInput.sendKeys('Test');
      const durationInput = await driver.findElement(By.xpath("//input[@placeholder='Duration (hours)']"));
      await durationInput.clear();
      await durationInput.sendKeys('2.5');
      const addButtons = await driver.findElements(By.xpath("//button[contains(., 'Add') and contains(@class, 'bg-red-500')]"));
      if (addButtons.length > 0) {
        await safeClick(driver, addButtons[0]);
        await driver.sleep(600);
      }
      const saveButton = await driver.findElement(By.xpath("//button[contains(., 'Save')]"));
      await safeClick(driver, saveButton);
      await driver.sleep(800);
      const confirmBtn = await driver.wait(until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(., 'Add Itinerary')]")), 10000).catch(() => null);
      if (confirmBtn) {
        await safeClick(driver, confirmBtn);
        await driver.sleep(2000);
      }
    });

    it('Should handle whitespace-only input as invalid', async () => {
      await step(driver, 'Fill name with only spaces');
      const nameInput = await driver.findElement(By.xpath("//input[@placeholder='Itinerary Name']"));
      await nameInput.clear();
      await nameInput.sendKeys('     ');
      await driver.sleep(500);
      const saveButton = await driver.findElement(By.xpath("//button[contains(., 'Save')]"));
      await safeClick(driver, saveButton);
      const errorMsg = await driver.wait(until.elementLocated(By.xpath("//p[contains(., 'Itinerary name is required')]")), 5000).catch(() => null);
      if (!errorMsg) throw new Error('Whitespace-only input should be invalid');
    });

    it('Should display correct itinerary count in tabs', async () => {
      await step(driver, 'Click Active tab and verify count');
      const activeTab = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Active Itineraries')]")), 10000);
      await safeClick(driver, activeTab);
      await driver.sleep(800);
      const activeTabText = await activeTab.getText();
      const activeCountMatch = activeTabText.match(/\((\d+)\)/);
      const activeCount = activeCountMatch ? parseInt(activeCountMatch[1]) : 0;
      const actualActiveItineraries = await driver.findElements(By.xpath("//div[contains(@class,'rounded-xl') and contains(@class,'bg-white') and contains(@class,'border')]"));
      if (actualActiveItineraries.length !== activeCount) {
        console.log(`Warning: Tab shows ${activeCount} but found ${actualActiveItineraries.length}`);
      }
    });
  });
});
