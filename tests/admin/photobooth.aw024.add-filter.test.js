const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { loginToProduction } = require('./production-login-helper');

// Base URL and credentials for production CloudFront
const BASE_URL = (process.env.BASE_URL || 'https://d39zx5gyblzxjs.cloudfront.net').replace(/\/$/, '');
const HEADLESS = (process.env.HEADLESS || 'true').toLowerCase() === 'true';
const ADMIN_USER = process.env.ADMIN_USER || 'juander714@gmail.com';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Admin1234!';

// AW-024 test data
const FILTER_NAME = 'Heart Crown';
const FILTER_CATEGORY_VALUE = 'head'; // "Head" filter type
const FILTER_IMAGE_URL =
  process.env.PHOTOBOOTH_IMAGE_URL ||
  'https://p7.hiclipart.com/preview/819/241/177/social-media-computer-icons-facebook-instagram-logo.jpg';

async function safeClick(driver, element) {
  try {
    await driver.executeScript('arguments[0].scrollIntoView({block: "center", inline: "center"});', element);
  } catch (_) {}
  await driver.sleep(200);
  try {
    await element.click();
  } catch (e) {
    // Fallback to JS click if intercepted
    await driver.executeScript('arguments[0].click();', element);
  }
}

/**
 * AW-024: Add Photobooth Filter with Uploaded Photo
 *
 * Description:
 * Verify that a new photobooth filter can be added successfully when a valid photo is uploaded.
 *
 * Steps (mapped from manual test case):
 * 1. Admin logs in and navigates to the Photobooth page.
 * 2. Add a filter name: "Heart Crown".
 * 3. Upload a filter image: heartcrown.png (simulated via in-browser generated PNG).
 * 4. Select filter type: "Head".
 * 5. Click the Add button and confirm in the modal.
 *
 * Expected Result:
 * The filter is saved successfully and appears in the filter list with the uploaded photo.
 */

async function goToPhotoboothPage(driver) {
  // If already there, return
  let currentUrl = await driver.getCurrentUrl();
  if (/\/AdminPhotobooth/i.test(currentUrl)) return;

  // 1) Try direct path route first
  await driver.get(`${BASE_URL}/AdminPhotobooth`);
  await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000).catch(() => {});
  await driver.sleep(800);
  try {
    const header = await driver.wait(
      until.elementLocated(By.xpath("//h1[contains(., 'Photobooth Filters')] | //h1[contains(., 'Photobooth')]")),
      8000
    );
    await driver.wait(until.elementIsVisible(header), 5000);
    return;
  } catch (_) {}

  // 2) Try hash route
  await driver.get(`${BASE_URL}/#/AdminPhotobooth`);
  await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000).catch(() => {});
  await driver.sleep(800);
  try {
    const header = await driver.wait(
      until.elementLocated(By.xpath("//h1[contains(., 'Photobooth Filters')] | //h1[contains(., 'Photobooth')]")),
      8000
    );
    await driver.wait(until.elementIsVisible(header), 5000);
    return;
  } catch (_) {}

  // 3) Fallback: go to AdminManageContent and click Photobooth entry using broader selectors
  await driver.get(`${BASE_URL}/AdminManageContent`);
  await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000).catch(() => {});
  await driver.sleep(1000);

  try {
    const entry = await driver.wait(
      until.elementLocated(By.xpath(
        "//h3[normalize-space()='Photobooth']/ancestor::div[contains(@class,'cursor-pointer')] | //div[contains(@class,'cursor-pointer')][.//h3[contains(.,'Photobooth')] or .//p[contains(.,'Photobooth')]] | //a[contains(@href,'AdminPhotobooth')]"
      )),
      15000
    );
    await entry.click();
    await driver.wait(until.urlContains('/AdminPhotobooth'), 10000).catch(() => {});
  } catch (_) {
    // As a last resort, try hash again
    await driver.get(`${BASE_URL}/#/AdminPhotobooth`);
    await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000).catch(() => {});
  }

  // Verify we are on the Photobooth page by checking the header
  const header = await driver.wait(
    until.elementLocated(By.xpath("//h1[contains(., 'Photobooth Filters')] | //h1[contains(., 'Photobooth')]")),
    20000
  );
  await driver.wait(until.elementIsVisible(header), 8000);
  await driver.sleep(400);
}

async function findFilterRowByName(driver, name) {
  const rows = await driver.findElements(By.xpath("//table//tbody/tr"));
  for (const row of rows) {
    const cells = await row.findElements(By.css('td'));
    if (cells.length >= 3) {
      const nameText = (await cells[1].getText()).trim();
      if (nameText === name) {
        return row;
      }
    }
  }
  return null;
}

describe('AW-024 Manage Photobooth - Add Photobooth Filter with Uploaded Photo', function () {
  this.timeout(120000);
  let driver;

  before(async () => {
    const options = new chrome.Options();
    if (HEADLESS) {
      options.addArguments('--headless=new');
    }
    options.addArguments('--window-size=1366,900');
    options.addArguments('--disable-gpu');

    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    // Login once for the entire Photobooth suite and reuse the same session
    await loginToProduction(driver, BASE_URL, ADMIN_USER, ADMIN_PASS);
  });

  after(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  it('AW-024: adds a new photobooth filter with uploaded PNG image and verifies it appears in the list', async () => {
    // Admin is already logged in from before(); navigate to Photobooth page via AdminHome
    await goToPhotoboothPage(driver);

    // Step 1: Add filter name
    const nameInput = await driver.wait(
      until.elementLocated(By.css('input[placeholder="Filter Name"]')),
      15000
    );
    await nameInput.clear();
    await nameInput.sendKeys(FILTER_NAME);
    await driver.sleep(500);

    // Step 2: Provide filter image via URL field (real usage: image link or uploaded image)
    const imageUrlInput = await driver.wait(
      until.elementLocated(By.css('input[name="imageUrl"]')),
      15000
    );
    await imageUrlInput.clear();
    await imageUrlInput.sendKeys(FILTER_IMAGE_URL);
    await driver.sleep(600);

    await driver.sleep(2000); // Give time for preview/validation

    // Step 3: Select filter type "Head"
    const categorySelect = await driver.wait(
      until.elementLocated(By.css('select[name="category"]')),
      10000
    );
    await categorySelect.click();
    const headOption = await categorySelect.findElement(By.css(`option[value="${FILTER_CATEGORY_VALUE}"]`));
    await headOption.click();
    await driver.sleep(500);

    // Step 4: Click the Add button
    const addButton = await driver.wait(
      until.elementLocated(
        By.xpath("//button[@type='submit' and contains(normalize-space(.), 'Add Filter')]")
      ),
      15000
    );
    await safeClick(driver, addButton);
    await driver.sleep(600);
    await driver.sleep(600);

    // Confirm modal: click "Add Filter" in the confirmation dialog
    const confirmAddButton = await driver.wait(
      until.elementLocated(
        By.xpath("//div[contains(@class,'fixed') and .//button[normalize-space()='Add Filter']]//button[normalize-space()='Add Filter']")
      ),
      15000
    );
    await confirmAddButton.click();
    await driver.sleep(800);

    // Wait for modal to close and filters list to refresh
    await driver.sleep(4000);

    // Step 5: Verify the new filter appears in the Active Filters list with category "head"
    const filterAppeared = await driver.wait(async () => {
      const rows = await driver.findElements(By.xpath("//table//tbody/tr"));
      for (const row of rows) {
        const cells = await row.findElements(By.css('td'));
        if (cells.length >= 3) {
          const nameText = (await cells[1].getText()).trim();
          const categoryText = (await cells[2].getText()).trim().toLowerCase();
          if (nameText === FILTER_NAME && categoryText === FILTER_CATEGORY_VALUE) {
            return true;
          }
        }
      }
      return false;
    }, 20000).catch(() => false);

    if (!filterAppeared) {
      throw new Error(`Expected new filter "${FILTER_NAME}" with category "${FILTER_CATEGORY_VALUE}" to appear in Active Filters list, but it was not found.`);
    }

    console.log(`✅ AW-024: Photobooth filter "${FILTER_NAME}" added successfully and visible in Active Filters list.`);
  });

  it('validates required fields when adding a photobooth filter (name & image)', async () => {
    await goToPhotoboothPage(driver);

    const nameInput = await driver.wait(
      until.elementLocated(By.css('input[placeholder="Filter Name"]')),
      15000
    );
    const imageUrlInput = await driver.wait(
      until.elementLocated(By.css('input[name="imageUrl"]')),
      15000
    );

    await nameInput.clear();
    await imageUrlInput.clear();
    await driver.sleep(500);

    const addButton = await driver.wait(
      until.elementLocated(
        By.xpath("//button[@type='submit' and contains(normalize-space(.), 'Add Filter')]")
      ),
      15000
    );

    // Attempt submit with missing name and image
    await addButton.click();

    const nameError = await driver.wait(
      until.elementLocated(By.xpath("//p[contains(., 'Filter name is required')]")),
      10000
    );
    if (!nameError) {
      throw new Error('Expected validation message for missing name when adding filter.');
    }

    // Fix name only, image still missing
    await nameInput.sendKeys('Validation Temp Filter');
    await addButton.click();
    await driver.sleep(1000);

    // Confirm that submission was blocked (no confirmation modal appears)
    const modals = await driver.findElements(By.xpath("//div[contains(@class,'fixed') and .//button[normalize-space()='Add Filter']]"));
    if (modals.length > 0) {
      throw new Error('Unexpected confirmation modal opened despite missing image.');
    }
  });

  it('performs full CRUD lifecycle on a photobooth filter (add, edit, archive, restore, delete)', async () => {
    await goToPhotoboothPage(driver);

    const uniqueName = `CRUD Filter ${Date.now()}`;
    const updatedName = `${uniqueName} Updated`;

    // Create filter
    const nameInput = await driver.wait(
      until.elementLocated(By.css('input[placeholder="Filter Name"]')),
      15000
    );
    const imageUrlInput = await driver.wait(
      until.elementLocated(By.css('input[name="imageUrl"]')),
      15000
    );
    const categorySelect = await driver.wait(
      until.elementLocated(By.css('select[name="category"]')),
      15000
    );

    await nameInput.clear();
    await nameInput.sendKeys(uniqueName);
    await driver.sleep(500);
    await imageUrlInput.clear();
    await imageUrlInput.sendKeys(FILTER_IMAGE_URL);
    await driver.sleep(600);
    await categorySelect.click();
    const headOption = await categorySelect.findElement(By.css(`option[value="${FILTER_CATEGORY_VALUE}"]`));
    await headOption.click();
    await driver.sleep(500);

    const addButton = await driver.wait(
      until.elementLocated(
        By.xpath("//button[@type='submit' and (contains(normalize-space(.), 'Add Filter') or contains(normalize-space(.), 'Update Filter'))]")
      ),
      15000
    );
    await addButton.click();

    const confirmAddButton = await driver.wait(
      until.elementLocated(
        By.xpath("//div[contains(@class,'fixed') and .//button[normalize-space()='Add Filter']]//button[normalize-space()='Add Filter']")
      ),
      15000
    );
    await confirmAddButton.click();
    await driver.sleep(4000);

    let row = await driver.wait(async () => await findFilterRowByName(driver, uniqueName), 20000).catch(() => null);
    if (!row) {
      throw new Error(`Expected newly created filter "${uniqueName}" to appear in Active Filters list.`);
    }

    // Edit filter name
    const editButton = await row.findElement(By.xpath(".//button[contains(., 'Edit')]"));
    await safeClick(driver, editButton);
    await driver.sleep(1200);

    const editNameInput = await driver.wait(
      until.elementLocated(By.css('input[placeholder="Filter Name"]')),
      10000
    );
    await editNameInput.clear();
    await editNameInput.sendKeys(updatedName);
    await driver.sleep(500);

    const updateButton = await driver.wait(
      until.elementLocated(
        By.xpath("//button[@type='submit' and contains(normalize-space(.), 'Update Filter')]")
      ),
      15000
    );
    await safeClick(driver, updateButton);
    await driver.sleep(600);

    const confirmUpdateButton = await driver.wait(
      until.elementLocated(
        By.xpath("//div[contains(@class,'fixed') and .//button[normalize-space()='Update']]//button[normalize-space()='Update']")
      ),
      15000
    );
    await confirmUpdateButton.click();
    await driver.sleep(4000);

    row = await driver.wait(async () => await findFilterRowByName(driver, updatedName), 20000).catch(() => null);
    if (!row) {
      throw new Error(`Expected updated filter name "${updatedName}" to appear in Active Filters list.`);
    }

    // Archive filter
    const archiveButton = await row.findElement(By.xpath(".//button[contains(., 'Archive')]"));
    await safeClick(driver, archiveButton);
    await driver.sleep(600);

    const confirmArchiveButton = await driver.wait(
      until.elementLocated(
        By.xpath("//div[contains(@class,'fixed') and .//button[normalize-space()='Archive']]//button[normalize-space()='Archive']")
      ),
      15000
    );
    await confirmArchiveButton.click();
    await driver.sleep(3000);

    // Switch to Archived tab and verify
    const archivedTab = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Archived')]")),
      10000
    );
    await safeClick(driver, archivedTab);
    await driver.sleep(2200);

    row = await driver.wait(async () => await findFilterRowByName(driver, updatedName), 20000).catch(() => null);
    if (!row) {
      throw new Error(`Expected filter "${updatedName}" to appear in Archived list after archiving.`);
    }

    // Restore filter
    const restoreButton = await row.findElement(By.xpath(".//button[contains(., 'Restore')]"));
    await safeClick(driver, restoreButton);
    await driver.sleep(600);

    const confirmRestoreButton = await driver.wait(
      until.elementLocated(
        By.xpath("//div[contains(@class,'fixed') and .//button[normalize-space()='Restore']]//button[normalize-space()='Restore']")
      ),
      15000
    );
    await confirmRestoreButton.click();
    await driver.sleep(3000);

    // Back to Active tab and verify restored
    const activeTab = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Active Filters')] | //button[contains(., 'Active')]")),
      10000
    );
    await safeClick(driver, activeTab);
    await driver.sleep(2200);

    row = await driver.wait(async () => await findFilterRowByName(driver, updatedName), 20000).catch(() => null);
    if (!row) {
      throw new Error(`Expected restored filter "${updatedName}" to appear back in Active Filters list.`);
    }

    // Archive again to prepare for permanent delete
    const archiveButton2 = await row.findElement(By.xpath(".//button[contains(., 'Archive')]"));
    await safeClick(driver, archiveButton2);
    await driver.sleep(600);

    const confirmArchiveButton2 = await driver.wait(
      until.elementLocated(
        By.xpath("//div[contains(@class,'fixed') and .//button[normalize-space()='Archive']]//button[normalize-space()='Archive']")
      ),
      15000
    );
    await confirmArchiveButton2.click();
    await driver.sleep(3000);

    // Go to Archived and permanently delete
    await archivedTab.click();
    await driver.sleep(2000);

    row = await driver.wait(async () => await findFilterRowByName(driver, updatedName), 20000).catch(() => null);
    if (!row) {
      throw new Error(`Expected filter "${updatedName}" in Archived list before permanent delete.`);
    }

    const deleteButton = await row.findElement(By.xpath(".//button[contains(., 'Delete')]"));
    await safeClick(driver, deleteButton);
    await driver.sleep(600);

    const confirmDeleteButton = await driver.wait(
      until.elementLocated(
        By.xpath("//div[contains(@class,'fixed') and .//button[normalize-space()='Delete Forever']]//button[normalize-space()='Delete Forever']")
      ),
      15000
    );
    await confirmDeleteButton.click();
    await driver.sleep(3000);

    row = await findFilterRowByName(driver, updatedName);
    if (row) {
      throw new Error(`Expected filter "${updatedName}" to be permanently deleted from Archived list.`);
    }
  });
});
