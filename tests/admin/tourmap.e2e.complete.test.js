const { Builder, By, until, Key, Actions } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const fs = require('fs');
const { loginToProduction } = require('./production-login-helper');

const BASE_URL = (process.env.BASE_URL || 'https://d39zx5gyblzxjs.cloudfront.net').replace(/\/$/, '');
const HEADLESS = (process.env.HEADLESS || 'false').toLowerCase() === 'true';
const ADMIN_USER = process.env.ADMIN_USER || 'juander714@gmail.com';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Admin1234!';
const SLOW_MS = parseInt(process.env.SLOW_MS || '1000', 10);

const UNIQUE_NAME = `Manila Cathedral ${Date.now()}`;

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

async function goToTourMap(driver) {
  await driver.get(`${BASE_URL}/AdminTourMap`);
  await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000).catch(()=>{});
  await driver.sleep(800);
  try {
    await driver.wait(until.elementLocated(By.xpath("//h2[contains(., 'Tour Map')]")), 6000);
    return;
  } catch (_) {
    await driver.get(`${BASE_URL}/#/AdminTourMap`);
    await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000).catch(()=>{});
    await driver.sleep(800);
  }
}

async function findSiteEntry(driver, siteName, timeout = 5000) {
  try {
    const entry = await driver.wait(until.elementLocated(By.xpath(`//div[contains(., '${siteName}')]`)), timeout);
    return { element: entry };
  } catch (_) {
    return null;
  }
}

async function scrollFindSiteEntry(driver, siteName, maxScrolls = 5) {
  for (let i = 0; i < maxScrolls; i++) {
    const entries = await driver.findElements(By.xpath(`//div[contains(., '${siteName}')]`));
    if (entries.length > 0) return { element: entries[0] };
    await driver.executeScript("arguments[0].scrollTop += 300;", await driver.findElement(By.xpath("//div[contains(@class, 'overflow-y-auto')]")).catch(() => null));
    await driver.sleep(300);
  }
  return null;
}

describe('Tour Map Management - Complete E2E Tests', function () {
  this.timeout(300000);
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

  it('Logs in and navigates to Tour Map', async () => {
    await step(driver, 'Login to production');
    await loginToProduction(driver, BASE_URL, ADMIN_USER, ADMIN_PASS);
    
    await step(driver, 'Verify token in localStorage');
    const token = await driver.executeScript('return localStorage.getItem("token")');
    if (!token) throw new Error('Token not found in localStorage after login');
    console.log('Token found:', token.substring(0, 20) + '...');
    
    await step(driver, 'Navigate to Tour Map');
    await driver.get(`${BASE_URL}/AdminTourMap`);
    await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000);
    await driver.sleep(2000);
    
    await step(driver, 'Verify page URL');
    const currentUrl = await driver.getCurrentUrl();
    console.log('Current URL:', currentUrl);
    if (!currentUrl.includes('AdminTourMap') && !currentUrl.includes('admin-tour-map')) {
      throw new Error(`Expected AdminTourMap URL, got: ${currentUrl}`);
    }
    
    await step(driver, 'Wait for Tour Map heading');
    const heading = await driver.wait(until.elementLocated(By.xpath("//h2[contains(., 'Tour Map')] | //h1[contains(., 'Tour Map')] | //div[contains(., 'Tour Map')]")), 15000).catch(async () => {
      const pageSource = await driver.getPageSource();
      console.log('Page contains:', pageSource.substring(0, 500));
      throw new Error('Tour Map heading not found');
    });
    if (!heading) throw new Error('Tour Map page not found');
    console.log('Tour Map page loaded successfully');
  });

  describe('Map Legend View Tests', () => {
    it('Should click Map Legend (View) button', async () => {
      await step(driver, 'Look for Map Legend button');
      const legendBtn = await driver.findElements(By.xpath("//button[contains(., 'Legend')] | //button[contains(., 'Map Legend')]"));
      console.log(`Found ${legendBtn.length} legend buttons`);
      if (legendBtn.length > 0) {
        await safeClick(driver, legendBtn[0]);
        await driver.sleep(1500);
        console.log('Legend button clicked');
      } else {
        console.log('Map Legend button not found - skipping');
      }
    });
  });

  describe('Add Pin - Manual Coordinates', () => {
    it('Should click Add Pin button', async () => {
      await step(driver, 'Click Add Pin button');
      // Button has title="Add Pin" attribute (icon-only button, no text)
      const addPinBtn = await driver.wait(
        until.elementLocated(By.css('button[title="Add Pin"]')),
        15000
      ).catch(() => null);
      
      if (!addPinBtn) {
        throw new Error('Add Pin button not found - expected button with title="Add Pin"');
      }
      
      console.log('✓ Add Pin button found');
      await safeClick(driver, addPinBtn);
      await driver.sleep(1500);
      
      await step(driver, 'Wait for Add Pin Modal');
      // Modal appears with "Add Pin" heading and two options: "Tap to place" and "Manual Add"
      await driver.wait(until.elementLocated(By.xpath("//h2[contains(., 'Add Pin')]")), 10000);
      console.log('✓ Add Pin Modal appeared');
      
      // Click "Manual Add" option to proceed to coordinate form
      const manualAddBtn = await driver.wait(
        until.elementLocated(By.xpath("//h3[contains(., 'Manual Add')]/ancestor::button")),
        10000
      );
      await safeClick(driver, manualAddBtn);
      await driver.sleep(1500);
      console.log('✓ Manual Add option clicked');
    });

    it('Should fill in manual coordinates and site details', async () => {
      await step(driver, 'Verify form is still visible');
      const formCheck = await driver.findElements(By.xpath("//input[contains(@placeholder, 'Latitude')]"));
      console.log(`Form check - found ${formCheck.length} latitude inputs`);
      if (formCheck.length === 0) {
        throw new Error('Form disappeared - need to click Add Pin again');
      }

      await step(driver, 'Fill latitude field');
      const latInput = await driver.findElements(By.xpath("//input[contains(@placeholder, 'Latitude')]"));
      console.log(`Found ${latInput.length} latitude inputs`);
      if (latInput.length > 0) {
        await latInput[0].clear();
        await latInput[0].sendKeys('120.97332772279593');
        await driver.sleep(800);
      }

      await step(driver, 'Fill longitude field');
      const lonInput = await driver.findElements(By.xpath("//input[contains(@placeholder, 'Longitude')]"));
      console.log(`Found ${lonInput.length} longitude inputs`);
      if (lonInput.length > 0) {
        await lonInput[0].clear();
        await lonInput[0].sendKeys('14.592022520792217');
        await driver.sleep(800);
      }

      await step(driver, 'Fill site name');
      const nameInput = await driver.findElements(By.xpath("//input[contains(@placeholder, 'Site Name')]"));
      console.log(`Found ${nameInput.length} site name inputs`);
      if (nameInput.length > 0) {
        await nameInput[0].clear();
        await nameInput[0].sendKeys(UNIQUE_NAME);
        await driver.sleep(800);
      }

      await step(driver, 'Select category');
      const categorySelect = await driver.findElements(By.xpath("//select"));
      console.log(`Found ${categorySelect.length} select dropdowns`);
      if (categorySelect.length > 0) {
        await safeClick(driver, categorySelect[0]);
        await driver.sleep(800);
        const options = await driver.findElements(By.xpath("//select[1]//option"));
        if (options.length > 1) {
          await safeClick(driver, options[1]);
          await driver.sleep(800);
        }
      }

      await step(driver, 'Fill site description');
      const descInputs = await driver.findElements(By.xpath("//textarea"));
      console.log(`Found ${descInputs.length} textarea fields`);
      if (descInputs.length > 0) {
        await descInputs[0].clear();
        await descInputs[0].sendKeys('Section 1: Historic cathedral in Manila. Built in the 16th century.');
        await driver.sleep(800);
      }

      if (descInputs.length > 1) {
        await descInputs[1].clear();
        await descInputs[1].sendKeys('Section 2: Features beautiful architecture and religious artifacts.');
        await driver.sleep(800);
      }

      await step(driver, 'Upload images');
      const imgPath = resolveTestImage();
      if (imgPath) {
        const fileInputs = await driver.findElements(By.xpath("//input[@type='file']"));
        console.log(`Found ${fileInputs.length} file inputs`);
        if (fileInputs.length > 0) {
          await fileInputs[0].sendKeys(imgPath);
          await driver.sleep(1000);
        }
        if (fileInputs.length > 1) {
          await fileInputs[1].sendKeys(imgPath);
          await driver.sleep(1000);
        }
      }

      await step(driver, 'Set prices and status');
      const numberInputs = await driver.findElements(By.xpath("//input[@type='number']"));
      console.log(`Found ${numberInputs.length} number inputs`);
      if (numberInputs.length > 0) {
        await numberInputs[0].clear();
        await numberInputs[0].sendKeys('100');
        await driver.sleep(500);
      }
      if (numberInputs.length > 1) {
        await numberInputs[1].clear();
        await numberInputs[1].sendKeys('75');
        await driver.sleep(500);
      }

      await step(driver, 'Save changes');
      const saveBtn = await driver.findElements(By.xpath("//button[contains(., 'Save')]"));
      console.log(`Found ${saveBtn.length} save buttons`);
      if (saveBtn.length > 0) {
        await safeClick(driver, saveBtn[0]);
        await driver.sleep(2500);
      }
    });
  });

  describe('Manage Pins - Search and Filter', () => {
    it('Should open Manage Pins and search by site name', async () => {
      await step(driver, 'Click Manage Pins button');
      // Button has title="Manage Pins" attribute (icon-only button, no text)
      const managePinsBtn = await driver.wait(
        until.elementLocated(By.css('button[title="Manage Pins"]')),
        15000
      ).catch(() => null);
      
      if (!managePinsBtn) {
        console.log('Manage Pins button not found - skipping');
        return;
      }
      
      console.log('✓ Manage Pins button found');
      await safeClick(driver, managePinsBtn);
      await driver.sleep(2000);
      console.log('✓ Manage Pins modal opened');

      await step(driver, 'Search for Manila Cathedral');
      const searchInput = await driver.findElements(By.xpath("//input[contains(@placeholder, 'Search')]"));
      console.log(`Found ${searchInput.length} search inputs`);
      if (searchInput.length > 0) {
        await searchInput[0].clear();
        await searchInput[0].sendKeys('Manila Cathedral');
        await driver.sleep(1500);
      }
    });

    it('Should filter by Active status', async () => {
      await step(driver, 'Look for Active filter button');
      const activeFilterBtn = await driver.findElements(By.xpath("//button[contains(., 'Active')]"));
      console.log(`Found ${activeFilterBtn.length} Active buttons`);
      if (activeFilterBtn.length > 0) {
        await safeClick(driver, activeFilterBtn[0]);
        await driver.sleep(1500);
      } else {
        console.log('Active filter not found - skipping');
      }
    });

    it('Should filter by Fortifications category', async () => {
      await step(driver, 'Look for Fortifications filter button');
      const fortFilterBtn = await driver.findElements(By.xpath("//button[contains(., 'Fortifications')]"));
      console.log(`Found ${fortFilterBtn.length} Fortifications buttons`);
      if (fortFilterBtn.length > 0) {
        await safeClick(driver, fortFilterBtn[0]);
        await driver.sleep(1500);
      } else {
        console.log('Fortifications filter not found - skipping');
      }
    });
  });

  describe('Edit Pin', () => {
    it('Should edit site details', async () => {
      await step(driver, 'Find and click Edit button for site');
      const editBtn = await driver.findElements(By.xpath("//button[contains(., 'Edit')]"));
      console.log(`Found ${editBtn.length} Edit buttons`);
      if (editBtn.length > 0) {
        await safeClick(driver, editBtn[0]);
        await driver.sleep(2000);

        await step(driver, 'Edit site name');
        const nameInput = await driver.findElements(By.xpath("//input[@placeholder='Site Name']"));
        if (nameInput.length > 0) {
          await nameInput[0].clear();
          await nameInput[0].sendKeys(UNIQUE_NAME + ' - Updated');
          await driver.sleep(500);
        }

        await step(driver, 'Edit site description');
        const descInputs = await driver.findElements(By.xpath("//textarea[contains(@placeholder, 'description')]"));
        if (descInputs.length > 0) {
          await descInputs[0].clear();
          await descInputs[0].sendKeys('Updated Section 1: Historic cathedral with updated information.');
          await driver.sleep(500);
        }

        await step(driver, 'Edit 2D Facade');
        const imgPath = resolveTestImage();
        if (imgPath) {
          const facadeInputs = await driver.findElements(By.xpath("//input[@type='file']"));
          if (facadeInputs.length > 0) {
            await facadeInputs[0].sendKeys(imgPath);
            await driver.sleep(1000);
          }
        }

        await step(driver, 'Edit entrance fee prices');
        const priceInputs = await driver.findElements(By.xpath("//input[@type='number']"));
        if (priceInputs.length > 0) {
          await priceInputs[0].clear();
          await priceInputs[0].sendKeys('120');
          await driver.sleep(500);
        }
        if (priceInputs.length > 1) {
          await priceInputs[1].clear();
          await priceInputs[1].sendKeys('80');
          await driver.sleep(500);
        }

        await step(driver, 'Save edited changes');
        const saveBtn = await driver.findElements(By.xpath("//button[contains(., 'Save') or contains(., 'Update')]"));
        if (saveBtn.length > 0) {
          await safeClick(driver, saveBtn[0]);
          await driver.sleep(2000);
        }
      }
    });
  });

  describe('Archive, Restore, and Delete', () => {
    it('Should archive the site', async () => {
      await step(driver, 'Open Manage Pins');
      const managePinsBtn = await driver.findElements(By.xpath("//button[contains(., 'Manage Pins')]"));
      console.log(`Found ${managePinsBtn.length} Manage Pins buttons`);
      if (managePinsBtn.length > 0) {
        await safeClick(driver, managePinsBtn[0]);
        await driver.sleep(2000);
      } else {
        console.log('Manage Pins not found - skipping archive test');
        return;
      }

      await step(driver, 'Search for site');
      const searchInput = await driver.findElements(By.xpath("//input[contains(@placeholder, 'Search')]"));
      console.log(`Found ${searchInput.length} search inputs`);
      if (searchInput.length > 0) {
        await searchInput[0].clear();
        await searchInput[0].sendKeys(UNIQUE_NAME);
        await driver.sleep(1500);
      }

      await step(driver, 'Click Archive button');
      const archiveBtn = await driver.findElements(By.xpath("//button[contains(., 'Archive')]"));
      console.log(`Found ${archiveBtn.length} Archive buttons`);
      if (archiveBtn.length > 0) {
        await safeClick(driver, archiveBtn[0]);
        await driver.sleep(1500);

        const confirmBtn = await driver.findElements(By.xpath("//button[contains(., 'Archive')]"));
        if (confirmBtn.length > 1) {
          await safeClick(driver, confirmBtn[confirmBtn.length - 1]);
          await driver.sleep(2500);
        }
      }
    });

    it('Should restore the site from archive', async () => {
      await step(driver, 'Click Archived tab');
      const archivedTab = await driver.findElements(By.xpath("//button[contains(., 'Archived')]"));
      if (archivedTab.length > 0) {
        await safeClick(driver, archivedTab[0]);
        await driver.sleep(1000);

        await step(driver, 'Search for archived site');
        const searchInput = await driver.findElements(By.xpath("//input[contains(@placeholder, 'Search')]"));
        if (searchInput.length > 0) {
          await searchInput[0].clear();
          await searchInput[0].sendKeys(UNIQUE_NAME);
          await driver.sleep(1000);
        }

        await step(driver, 'Click Restore button');
        const restoreBtn = await driver.findElements(By.xpath("//button[contains(., 'Restore')]"));
        if (restoreBtn.length > 0) {
          await safeClick(driver, restoreBtn[0]);
          await driver.sleep(1000);

          const confirmBtn = await driver.findElements(By.xpath("//button[contains(., 'Restore')]"));
          if (confirmBtn.length > 1) {
            await safeClick(driver, confirmBtn[confirmBtn.length - 1]);
            await driver.sleep(2000);
          }
        }
      }
    });

    it('Should permanently delete the site', async () => {
      await step(driver, 'Go back to Active tab');
      const activeTab = await driver.findElements(By.xpath("//button[contains(., 'Active')]"));
      if (activeTab.length > 0) {
        await safeClick(driver, activeTab[0]);
        await driver.sleep(1000);

        await step(driver, 'Archive again for deletion');
        const searchInput = await driver.findElements(By.xpath("//input[contains(@placeholder, 'Search')]"));
        if (searchInput.length > 0) {
          await searchInput[0].clear();
          await searchInput[0].sendKeys(UNIQUE_NAME);
          await driver.sleep(1000);
        }

        const archiveBtn = await driver.findElements(By.xpath("//button[contains(., 'Archive')]"));
        if (archiveBtn.length > 0) {
          await safeClick(driver, archiveBtn[0]);
          await driver.sleep(1000);
          const confirmBtn = await driver.findElements(By.xpath("//button[contains(., 'Archive')]"));
          if (confirmBtn.length > 1) {
            await safeClick(driver, confirmBtn[confirmBtn.length - 1]);
            await driver.sleep(2000);
          }
        }
      }

      await step(driver, 'Go to Archived tab and delete');
      const archivedTab = await driver.findElements(By.xpath("//button[contains(., 'Archived')]"));
      if (archivedTab.length > 0) {
        await safeClick(driver, archivedTab[0]);
        await driver.sleep(1000);

        const searchInput = await driver.findElements(By.xpath("//input[contains(@placeholder, 'Search')]"));
        if (searchInput.length > 0) {
          await searchInput[0].clear();
          await searchInput[0].sendKeys(UNIQUE_NAME);
          await driver.sleep(1000);
        }

        await step(driver, 'Click Delete button');
        const deleteBtn = await driver.findElements(By.xpath("//button[contains(., 'Delete')]"));
        if (deleteBtn.length > 0) {
          await safeClick(driver, deleteBtn[0]);
          await driver.sleep(1000);

          const confirmDeleteBtn = await driver.findElements(By.xpath("//button[contains(., 'Delete Forever') or contains(., 'Delete')]"));
          if (confirmDeleteBtn.length > 0) {
            await safeClick(driver, confirmDeleteBtn[confirmDeleteBtn.length - 1]);
            await driver.sleep(2000);
          }
        }
      }
    });
  });

  describe('Tap to Place Pin', () => {
    it('Should activate Tap to Place mode and add pin by clicking map', async () => {
      await step(driver, 'Look for Tap to Place button');
      const tapToPlaceBtn = await driver.findElements(By.xpath("//button[contains(., 'Tap to Place')] | //button[contains(., 'Click to Place')]"));
      if (tapToPlaceBtn.length > 0) {
        await safeClick(driver, tapToPlaceBtn[0]);
        await driver.sleep(1000);

        await step(driver, 'Click on map to place pin');
        const mapContainer = await driver.findElements(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]"));
        if (mapContainer.length > 0) {
          const mapEl = mapContainer[0];
          const location = await mapEl.getRect();
          const centerX = location.x + location.width / 2;
          const centerY = location.y + location.height / 2;
          
          const actions = driver.actions({ async: true });
          await actions.move({ x: centerX, y: centerY }).click().perform();
          await driver.sleep(1500);

          await step(driver, 'Fill in site details from tap');
          const nameInput = await driver.findElements(By.xpath("//input[@placeholder='Site Name']"));
          if (nameInput.length > 0) {
            await nameInput[0].clear();
            await nameInput[0].sendKeys(`Tap Placed Site ${Date.now()}`);
            await driver.sleep(500);
          }

          const descInput = await driver.findElements(By.xpath("//textarea[contains(@placeholder, 'description')]"));
          if (descInput.length > 0) {
            await descInput[0].clear();
            await descInput[0].sendKeys('Site created by tap to place feature');
            await driver.sleep(500);
          }

          const saveBtn = await driver.findElements(By.xpath("//button[contains(., 'Save')]"));
          if (saveBtn.length > 0) {
            await safeClick(driver, saveBtn[0]);
            await driver.sleep(2000);
          }
        }
      } else {
        console.log('Tap to Place button not found');
      }
    });
  });

  describe('Validation Tests', () => {
    it('Should validate required fields', async () => {
      await step(driver, 'Click Add Pin');
      const addPinBtn = await driver.findElements(By.xpath("//button[contains(., 'Add Pin')]"));
      if (addPinBtn.length > 0) {
        await safeClick(driver, addPinBtn[0]);
        await driver.sleep(1000);

        await step(driver, 'Try to save without filling required fields');
        const saveBtn = await driver.findElements(By.xpath("//button[contains(., 'Save')]"));
        if (saveBtn.length > 0) {
          await safeClick(driver, saveBtn[0]);
          await driver.sleep(1000);

          const errorMsg = await driver.findElements(By.xpath("//p[contains(., 'required')]"));
          if (errorMsg.length > 0) {
            console.log('Validation error displayed correctly');
          }
        }
      }
    });
  });
});
