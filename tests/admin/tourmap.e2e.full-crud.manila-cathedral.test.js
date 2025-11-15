const { Builder, By, until, Key } = require('selenium-webdriver');
const path = require('path');
const fs = require('fs');
const chrome = require('selenium-webdriver/chrome');
const { loginToProduction } = require('./production-login-helper');

const BASE_URL = (process.env.BASE_URL || 'https://d39zx5gyblzxjs.cloudfront.net').replace(/\/$/, '');
const HEADLESS = (process.env.HEADLESS || 'false').toLowerCase() === 'true';
const ADMIN_USER = process.env.ADMIN_USER || 'juander714@gmail.com';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Admin1234!';

const LAT = '14.592022520792217';
const LNG = '120.97332772279593';
const BASE_NAME = 'Manila Cathedral';
const UNIQUE_NAME = `${BASE_NAME} E2E ${Date.now()}`;
const CATEGORY = 'Fortifications';
const DESC1 = 'Overview';
const DESC2 = 'Detailed history';

// Slow-mo tuning (in ms)
const SLOW_MS = parseInt(process.env.SLOW_MS || '1000', 10);

async function step(driver, message) {
  console.log(`STEP: ${message}`);
  await driver.sleep(SLOW_MS);
}

function resolveTestImage() {
  // Prefer the path provided by the user: tests/aasets/images.jpg (typo acknowledged)
  const p1 = path.resolve(process.cwd(), 'tests', 'aasets', 'images.jpg');
  const p2 = path.resolve(process.cwd(), 'tests', 'assets', 'images.jpg');
  if (fs.existsSync(p1)) return p1;
  if (fs.existsSync(p2)) return p2;
  return null;
}

async function uploadImageIfPresent(driver) {
  const fileInput = await driver.findElements(By.xpath("//div[contains(@class,'fixed')]//input[@type='file' and (contains(@accept,'image') or not(@accept))] | //input[@type='file' and (contains(@accept,'image') or not(@accept))]"));
  if (!fileInput.length) return false;
  const imgPath = resolveTestImage();
  if (!imgPath) { console.log('LOG: No test image found to upload'); return false; }
  await step(driver, `Upload image: ${path.basename(imgPath)}`);
  await fileInput[0].sendKeys(imgPath);
  await driver.sleep(800);
  return true;
}

async function uploadFacadeImageIfPresent(driver) {
  const imgPath = resolveTestImage();
  if (!imgPath) return false;
  const queries = [
    "//div[contains(@class,'fixed')]//label[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'facade') or contains(normalize-space(.), '2D')]/following::input[@type='file'][1]",
    "//div[contains(@class,'fixed')]//*[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'facade') or contains(normalize-space(.), '2D')]/following::input[@type='file'][1]",
  ];
  for (const q of queries) {
    const els = await driver.findElements(By.xpath(q));
    if (els.length) {
      await step(driver, 'Upload 2D Facade image');
      await els[0].sendKeys(imgPath);
      await driver.sleep(800);
      return true;
    }
  }
  return false;
}

async function ensureAtLeastOneMediaFile(driver) {
  const imgPath = resolveTestImage();
  if (!imgPath) return false;
  const mediaScoped = await driver.findElements(By.xpath(
    "//div[contains(@class,'fixed')]//section[.//*[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'media')]]//input[@type='file' and (contains(@accept,'image') or contains(@accept,'video') or not(@accept))]"
  ));
  if (mediaScoped.length) {
    await step(driver, 'Upload first Media file');
    await mediaScoped[0].sendKeys(imgPath);
    await driver.sleep(800);
    return true;
  }
  const allInputs = await driver.findElements(By.xpath("//div[contains(@class,'fixed')]//input[@type='file' and (contains(@accept,'image') or contains(@accept,'video') or not(@accept))]"));
  if (allInputs.length) {
    const idx = allInputs.length > 1 ? 1 : 0;
    await step(driver, 'Upload Media file (fallback input)');
    await allInputs[idx].sendKeys(imgPath);
    await driver.sleep(800);
    return true;
  }
  return false;
}

async function closePinDetailsIfOpen(driver) {
  // Try header X button variants
  const selectors = [
    "//div[contains(@class,'fixed')]//button[contains(@aria-label,'Close') or contains(normalize-space(.),'×') or normalize-space(.)='X' or contains(normalize-space(.),'Close')]",
    "//div[contains(@class,'fixed')]//*[contains(normalize-space(.),'×') or normalize-space(.)='X']/ancestor::button[1]",
    "//div[contains(@class,'fixed')]//button[@title='Close']"
  ];
  for (const q of selectors) {
    const btns = await driver.findElements(By.xpath(q));
    if (btns.length) { await safeClick(driver, btns[0]); await driver.sleep(400); return true; }
  }
  return false;
}

async function waitForPinDetailsToClose(driver, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const modals = await driver.findElements(By.xpath("//div[contains(@class,'fixed') and .//*[contains(.,'Pin Details')]]"));
    if (modals.length === 0) return true;
    await driver.sleep(300);
  }
  return false;
}

async function ensurePinDetailsDismissed(driver) {
  // Scroll to top to expose header close
  await scrollModalToTop(driver);
  // Try clicking X/Close buttons
  const clicked = await closePinDetailsIfOpen(driver);
  if (clicked) {
    const closed = await waitForPinDetailsToClose(driver, 5000);
    if (closed) return true;
  }
  // Try ESC key
  try { await driver.actions({ bridge: true }).sendKeys(Key.ESCAPE).perform(); await driver.sleep(400); } catch(_) {}
  if (await waitForPinDetailsToClose(driver, 5000)) return true;
  // Try clicking outside on the map to close
  try {
    const canvas = await findMapCanvas(driver);
    if (canvas) {
      await driver.actions({ bridge: true }).move({ origin: canvas, x: 10, y: 10 }).press().release().perform();
      await driver.sleep(500);
      if (await waitForPinDetailsToClose(driver, 3000)) return true;
    }
  } catch(_) {}
  // If still open, proceed (some UIs keep modal open after save); do not fail here
  return false;
}

async function refreshListIfPossible(driver) {
  // Try a refresh button in Manage Pins if present
  const refreshBtn = await driver.findElements(By.xpath("//button[contains(.,'Refresh')] | //button[@title='Refresh'] | //span[contains(.,'Refresh')]/ancestor::button"));
  if (refreshBtn.length) { await safeClick(driver, refreshBtn[0]); await driver.sleep(700); }
}

async function waitForSiteInList(driver, name, timeoutMs = 60000) {
  const start = Date.now();
  // Ensure Manage Pins open and filters reset
  await openManagePinsAndReset(driver);
  // Search exact name (type and press Enter). If a search icon/button exists, click it too.
  const searchBox = await driver.findElements(By.xpath("//input[contains(@placeholder,'Search') or contains(@aria-label,'Search')]"));
  if (searchBox.length) {
    await searchBox[0].clear().catch(()=>{});
    await searchBox[0].sendKeys(name);
    await searchBox[0].sendKeys(Key.ENTER).catch(()=>{});
    await driver.sleep(700);
    const searchBtn = await driver.findElements(By.xpath("//button[contains(.,'Search')] | //span[contains(@class,'search')]/ancestor::button"));
    if (searchBtn.length) { await safeClick(driver, searchBtn[0]); await driver.sleep(500); }
  }
  let isArchived = false;
  while (Date.now() - start < timeoutMs) {
    // Try Active tab
    if (isArchived) {
      const activeTab = await driver.findElements(By.xpath("//button[contains(.,'Active')] | //button[contains(.,'Active Filters')]"));
      if (activeTab.length) await safeClick(driver, activeTab[0]);
      isArchived = false;
      await driver.sleep(600);
    }
    let entry = await scrollFindSiteEntry(driver, name, 10);
    if (entry) return { entry, scope: 'Active' };
    // Try Archived tab
    const archivedTab = await driver.findElements(By.xpath("//button[contains(.,'Archived')]"));
    if (archivedTab.length) { await safeClick(driver, archivedTab[0]); isArchived = true; await driver.sleep(600); }
    entry = await scrollFindSiteEntry(driver, name, 10);
    if (entry) return { entry, scope: 'Archived' };
    // Refresh and loop
    await refreshListIfPossible(driver);
    await driver.sleep(600);
  }
  return null;
}

async function logModalButtons(driver, contextLabel = '') {
  try {
    const modalRoot = (await driver.findElements(By.xpath("//div[contains(@class,'fixed') and .//h1|.//h2|.//h3]")))[0];
    if (!modalRoot) { console.log('LOG: No modal root found for button scan'); return; }
    const buttons = await modalRoot.findElements(By.css('button'));
    console.log(`LOG: Modal buttons ${contextLabel} (count=${buttons.length})`);
    let idx = 1;
    for (const b of buttons) {
      const txt = (await b.getText().catch(()=>'')) || '';
      const type = await b.getAttribute('type').catch(()=>'');
      const cls = await b.getAttribute('class').catch(()=>'');
      console.log(`  [${idx}] text="${txt}" type="${type}" class="${cls}"`);
      idx++;
    }
  } catch (e) {
    console.log('LOG: Error scanning modal buttons:', e.message);
  }
}

async function dismissOverlays(driver) {
  // Close PWA install prompt if visible
  const installToasts = await driver.findElements(By.xpath("//div[contains(., 'Install Juander App') or contains(., 'Install our app')]"));
  if (installToasts.length) {
    const closeBtns = await installToasts[0].findElements(By.xpath(".//button[contains(.,'Close') or contains(.,'Got it') or contains(.,'Dismiss') or contains(.,'×') or contains(.,'X')]"));
    if (closeBtns.length) { await safeClick(driver, closeBtns[0]); await driver.sleep(400); }
  }
}

async function scrollModalToTop(driver) {
  // Find Pin Details modal container and scroll to top so top fields (Site Name, Category) are visible
  const modal = await driver.findElements(By.xpath("//div[contains(., 'Pin Details') and ancestor::div[contains(@class,'fixed')]]/ancestor::div[contains(@class,'fixed')][1] | //div[contains(@class,'fixed') and .//h2[contains(.,'Pin Details')] or .//h1[contains(.,'Pin Details')]]"));
  const container = modal[0] || null;
  if (container) {
    await driver.executeScript("arguments[0].scrollTop = 0;", container).catch(()=>{});
    await driver.sleep(300);
  }
}

async function safeClick(driver, el) {
  // Highlight element for visibility
  try {
    await driver.executeScript("arguments[0].style.outline='3px solid #e11d48'; arguments[0].style.transition='outline 0.2s ease';", el);
  } catch (_) {}
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", el).catch(()=>{});
  await driver.sleep(300);
  try { await el.click(); } catch (_) { await driver.executeScript('arguments[0].click();', el); }
  await driver.sleep(300);
  try { await driver.executeScript("arguments[0].style.outline='';", el); } catch(_) {}
}

async function goToTourMap(driver) {
  // Try direct first
  await driver.get(`${BASE_URL}/AdminTourMap`);
  await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000).catch(()=>{});
  await driver.sleep(800);
  try {
    await driver.wait(until.elementLocated(By.xpath("//h1[contains(.,'Tour Map')] | //div[contains(@class,'mapbox') or contains(@class,'map')] | //canvas[contains(@class,'mapbox')]")), 6000);
    return;
  } catch (_) {}
  // Hash route
  await driver.get(`${BASE_URL}/#/AdminTourMap`);
  await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000).catch(()=>{});
  await driver.sleep(800);
  try {
    await driver.wait(until.elementLocated(By.xpath("//h1[contains(.,'Tour Map')] | //div[contains(@class,'mapbox') or contains(@class,'map')] | //canvas[contains(@class,'mapbox')]")), 6000);
    return;
  } catch (_) {}
  // Through AdminManageContent tile
  await driver.get(`${BASE_URL}/AdminManageContent`);
  await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000).catch(()=>{});
  const tourMapTile = await driver.wait(
    until.elementLocated(By.xpath("//h3[normalize-space()='Tour Map']/ancestor::div[contains(@class,'cursor-pointer')] | //a[contains(@href,'AdminTourMap')]")),
    12000
  );
  await safeClick(driver, tourMapTile);
  await driver.wait(until.urlContains('/AdminTourMap'), 12000).catch(()=>{});
}

async function findMapCanvas(driver) {
  const candidates = await driver.findElements(By.css('canvas.mapboxgl-canvas, .mapboxgl-canvas, canvas'));
  return candidates[0] || null;
}

async function clickMapAtCenter(driver) {
  const canvas = await findMapCanvas(driver);
  if (!canvas) throw new Error('Map canvas not found');
  const rect = await driver.executeScript(
    "const r=arguments[0].getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};",
    canvas
  );
  // Move and click near center
  const actions = driver.actions({ bridge: true });
  await actions.move({ origin: canvas, x: Math.floor(rect.width/2)-10, y: Math.floor(rect.height/2)-10 }).press().release().perform();
}

async function setIfPresent(driver, selectors, value) {
  for (const sel of selectors) {
    try {
      const el = sel.type === 'css' ? await driver.findElement(By.css(sel.q)) : await driver.findElement(By.xpath(sel.q));
      await el.clear().catch(()=>{});
      await el.sendKeys(value);
      return true;
    } catch (_) {}
  }
  return false;
}

// Locate the Manage Pins modal root to scope subsequent queries
async function getManagePinsPanelRoot(driver) {
  const panels = await driver.findElements(
    By.xpath("//div[contains(@class,'fixed') and .//h2[normalize-space()='Manage Pins']]")
  );
  return panels[0] || null;
}

// Locate a site entry card within the Manage Pins modal (Active or Archived tab)
// Searches only in the visible grid (the one that's currently rendered)
async function findSiteEntry(driver, name, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  const panelRoot = await getManagePinsPanelRoot(driver);
  if (!panelRoot) return null;

  while (Date.now() < deadline) {
    // The grid is inside the overflow-y-auto div; search for visible cards
    // Cards have border-2 and rounded-xl classes (both active and archived)
    // Try exact match first, then partial match
    let cards = await panelRoot.findElements(By.xpath(
      ".//div[contains(@class,'overflow-y-auto')]//div[contains(@class,'border-2') and contains(@class,'rounded-xl')][.//h3[contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), translate('" + name + "','ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'))]]"
    ));
    
    if (cards.length) {
      return { element: cards[0], type: 'card' };
    }
    
    // Fallback: search for any card containing the name text (case-insensitive, includes archived cards)
    cards = await panelRoot.findElements(By.xpath(
      ".//div[contains(@class,'overflow-y-auto')]//div[contains(@class,'border-2') and contains(@class,'rounded-xl')][contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), translate('" + name + "','ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'))]"
    ));
    
    if (cards.length) {
      return { element: cards[0], type: 'card' };
    }
    
    // Additional fallback: search for cards with any border styling (active or archived)
    cards = await panelRoot.findElements(By.xpath(
      ".//div[contains(@class,'overflow-y-auto')]//div[contains(@class,'border') and contains(@class,'rounded')][contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), translate('" + name + "','ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'))]"
    ));
    
    if (cards.length) {
      return { element: cards[0], type: 'card' };
    }
    
    await driver.sleep(300);
  }
  return null;
}

async function openManagePinsAndReset(driver) {
  // Ensure Manage Pins panel is open
  const managePinsBtn = await driver.findElements(By.xpath("//button[@title='Manage Pins' or contains(.,'Manage Pins')] | //a[contains(.,'Manage Pins')]"));
  if (managePinsBtn.length) {
    await safeClick(driver, managePinsBtn[0]);
    await driver.sleep(800);
  }
  // Wait for Manage Pins modal to be present
  await driver.wait(
    until.elementLocated(By.xpath("//div[contains(@class,'fixed') and .//h2[normalize-space()='Manage Pins']]")),
    10000
  ).catch(() => {});

  // Clear search input if present
  const searchInputs = await driver.findElements(By.xpath("//div[contains(@class,'fixed') and .//h2[normalize-space()='Manage Pins']]//input[contains(@placeholder,'Search') or contains(@aria-label,'Search')]"));
  if (searchInputs.length) {
    await searchInputs[0].clear().catch(()=>{});
    await driver.sleep(400);
  }
  // Reset filters if they are toggles/buttons
  const clearBtns = await driver.findElements(By.xpath("//div[contains(@class,'fixed') and .//h2[normalize-space()='Manage Pins']]//button[contains(.,'Clear') or contains(.,'Reset')]"));
  if (clearBtns.length) {
    await safeClick(driver, clearBtns[0]);
    await driver.sleep(600);
  }
}

async function scrollFindSiteEntry(driver, name, maxScrolls = 8) {
  const panelRoot = await getManagePinsPanelRoot(driver);
  if (!panelRoot) return null;

  // Try to find list container (overflow area) inside Manage Pins
  const containers = await panelRoot.findElements(By.xpath(".//div[contains(@class,'overflow-y-auto')]"));
  const container = containers[0] || null;

  // Try current view first
  let entry = await findSiteEntry(driver, name, 1500);
  if (entry) return entry;
  if (!container) return null;

  // Scroll down in steps and search
  for (let i = 0; i < maxScrolls; i++) {
    await driver.executeScript(
      "arguments[0].scrollTop = arguments[0].scrollTop + Math.floor(arguments[0].clientHeight * 0.9);",
      container
    ).catch(()=>{});
    await driver.sleep(500);
    entry = await findSiteEntry(driver, name, 1500);
    if (entry) return entry;
  }
  return null;
}

describe('Tour Map - Full CRUD: Manila Cathedral', function () {
  this.timeout(240000);
  let driver;

  before(async () => {
    const options = new chrome.Options();
    if (HEADLESS) options.addArguments('--headless=new');
    options.addArguments('--window-size=1366,900');
    options.addArguments('--disable-gpu');
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    await step(driver, 'Launching browser');
    await loginToProduction(driver, BASE_URL, ADMIN_USER, ADMIN_PASS);
    await step(driver, 'Logged in successfully');
    await goToTourMap(driver);
    await step(driver, 'Navigated to Tour Map');
  });

  after(async () => { if (driver) await driver.quit(); });

  it('Clicks Map Legend (View)', async () => {
    await step(driver, 'Attempting to open Map Legend');
    const legendBtn = await driver.findElements(By.xpath("//button[contains(.,'Map Legend') or contains(.,'Legend') or contains(.,'View')]"));
    if (legendBtn.length > 0) {
      await safeClick(driver, legendBtn[0]);
      await step(driver, 'Map Legend opened');
      // Close if a panel opens
      const closeBtn = await driver.findElements(By.xpath("//button[contains(.,'Close') or contains(.,'Hide')]"));
      if (closeBtn.length > 0) { await safeClick(driver, closeBtn[0]); await step(driver, 'Map Legend closed'); }
    }
  });

  it('Add Pin via Manual Add with exact coordinates and full details, then Save', async () => {
    // Click Add Pin
    await step(driver, 'Click Add Pin');
    const addPin = await driver.wait(
      until.elementLocated(By.xpath("//button[@title='Add Pin' or contains(normalize-space(.),'Add Pin') or contains(normalize-space(.),'Add')]")),
      15000
    );
    await safeClick(driver, addPin);
    await step(driver, 'Tap the map to place the pin');

    // Tap on the map
    await clickMapAtCenter(driver);
    await step(driver, 'Pin placed');

    // Select Manual Add
    await step(driver, 'Select Manual Add');
    const manualAdd = await driver.findElements(By.xpath("//button[contains(.,'Manual Add')] | //a[contains(.,'Manual Add')] | //div[contains(.,'Manual Add') and @role='button']"));
    if (manualAdd.length > 0) {
      await safeClick(driver, manualAdd[0]);
      await step(driver, 'Manual Add selected');
    }

    // Enter coordinates
    await step(driver, `Enter coordinates LAT ${LAT}, LNG ${LNG}`);
    const latSet = await setIfPresent(driver, [
      { type:'css', q:"input[name*='lat']" },
      { type:'xpath', q:"//label[contains(.,'Latitude')]/following::input[1]" },
      { type:'xpath', q:"//input[contains(@placeholder,'Latitude') or contains(@aria-label,'Latitude')]" }
    ], LAT);
    const lngSet = await setIfPresent(driver, [
      { type:'css', q:"input[name*='lng'], input[name*='lon']" },
      { type:'xpath', q:"//label[contains(.,'Longitude')]/following::input[1]" },
      { type:'xpath', q:"//input[contains(@placeholder,'Longitude') or contains(@aria-label,'Longitude')]" }
    ], LNG);

    if (!latSet || !lngSet) throw new Error('Could not set coordinates');

    // Confirm coordinates by clicking "+ Add Pin" in the coordinates modal
    await step(driver, 'Confirm coordinates via + Add Pin');
    let addPinConfirmBtn = null;
    const addPinConfirmCandidates = [
      By.xpath("//button[normalize-space()='+ Add Pin']"),
      By.xpath("//button[contains(normalize-space(.),'Add Pin') and not(contains(normalize-space(.),'Add Pin to'))]"),
      By.xpath("//div[contains(@class,'fixed') and .//input[contains(@placeholder,'Latitude') or contains(@aria-label,'Latitude')]]//button[contains(normalize-space(.),'Add Pin')]")
    ];
    for (const locator of addPinConfirmCandidates) {
      const found = await driver.findElements(locator);
      if (found.length) { addPinConfirmBtn = found[0]; break; }
    }
    if (addPinConfirmBtn) {
      await safeClick(driver, addPinConfirmBtn);
      await step(driver, 'Coordinates confirmed');
    }

    // Wait for site details form to be present (Site Name field)
    await step(driver, 'Wait for site details form');
    await dismissOverlays(driver);
    await scrollModalToTop(driver);
    await driver.wait(
      until.elementLocated(By.xpath("//input[@name='name' or @placeholder='Site Name' or (@type='text' and ancestor::form)]")),
      15000
    );

    // Fill Site Name (unique to avoid collisions)
    await step(driver, `Fill Site Name: ${UNIQUE_NAME}`);
    const nameSet = await setIfPresent(driver, [
      { type:'css', q:"input[placeholder='Site Name']" },
      { type:'css', q:"input[name='name']" },
      { type:'xpath', q:"//label[contains(.,'Site Name')]/following::input[1]" }
    ], UNIQUE_NAME);
    if (!nameSet) throw new Error('Could not set site name');

    // Category (custom dropdown)
    await step(driver, `Select Category: ${CATEGORY}`);
    const catContainer = await driver.findElements(By.xpath("//div[contains(@class,'category-dropdown-container')]//div[contains(@class,'rounded-xl') and contains(@class,'cursor-pointer') or contains(@class,'rounded-xl')][1]"));
    if (catContainer.length) {
      await safeClick(driver, catContainer[0]);
      const catSearch = await driver.findElements(By.xpath("//div[contains(@class,'category-dropdown-container')]//input[contains(@placeholder,'Search') or contains(@placeholder,'category')]"));
      if (catSearch.length) {
        await catSearch[0].clear().catch(()=>{});
        await catSearch[0].sendKeys(CATEGORY);
        await driver.sleep(300);
      }
      const catOption = await driver.findElements(By.xpath(`//div[contains(@class,'category-dropdown-container')]//*[normalize-space(text())='${CATEGORY}']`));
      if (catOption.length) await safeClick(driver, catOption[0]);
    }

    // Descriptions
    await step(driver, 'Fill Description sections');
    await setIfPresent(driver, [
      { type:'css', q:"textarea[name='section1'], textarea[placeholder*='Section 1'], textarea" },
      { type:'xpath', q:"(//textarea)[1]" }
    ], DESC1);
    await setIfPresent(driver, [
      { type:'css', q:"textarea[name='section2'], textarea[placeholder*='Section 2']" },
      { type:'xpath', q:"(//textarea)[2]" }
    ], DESC2);

    // Façade & Medias - Optional: click edit buttons if present
    await step(driver, 'Edit 2D façade (if present)');
    const editFacade = await driver.findElements(By.xpath("//button[contains(.,'Edit') and contains(.,'façade') or contains(.,'Edit 2D')]"));
    if (editFacade.length) { await safeClick(driver, editFacade[0]); await driver.sleep(500); }

    await step(driver, 'Edit medias (if present)');
    const editMedias = await driver.findElements(By.xpath("//button[contains(.,'Edit') and (contains(.,'media') or contains(.,'Medias'))]"));
    if (editMedias.length) { await safeClick(driver, editMedias[0]); await driver.sleep(500); }

    // Upload required files: 2D Facade image and at least 1 media
    await uploadFacadeImageIfPresent(driver);
    await ensureAtLeastOneMediaFile(driver);

    // Entrance Fee: Custom (select + amounts)
    await step(driver, 'Set Entrance Fee: Custom (Regular 100 / Discount 75)');
    const feeSelect = await driver.findElements(By.xpath("//label[contains(.,'Entrance Fee')]/following::select[1] | //select[ancestor::div[.//label[contains(.,'Entrance Fee')]]]"));
    if (feeSelect.length) {
      await safeClick(driver, feeSelect[0]);
      const customOpt = await driver.findElements(By.xpath("//option[contains(.,'Custom Entrance Fee')]"));
      if (customOpt.length) await safeClick(driver, customOpt[0]);
    }
    await setIfPresent(driver, [
      { type:'xpath', q:"//input[@type='number' and (@placeholder='Enter regular price' or @aria-label='Regular Price')]" }
    ], '100');
    await setIfPresent(driver, [
      { type:'xpath', q:"//input[@type='number' and (@placeholder='Optional' or @aria-label='Discounted Price')]" }
    ], '75');

    // Status Active
    await step(driver, 'Set Status: Active');
    const statusSel = await driver.findElements(By.xpath("//select[contains(@name,'status')]"));
    if (statusSel.length) {
      await safeClick(driver, statusSel[0]);
      const activeOption = await driver.findElements(By.xpath("//option[normalize-space(text())='Active']"));
      if (activeOption.length) await safeClick(driver, activeOption[0]);
    }

    // Save
    await step(driver, 'Save site');
    await logModalButtons(driver, 'before save');
    const saveBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[@type='submit' or contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'save change') or contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'save changes') or contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'save') or contains(normalize-space(.),'Add')]")),
      15000
    );
    await safeClick(driver, saveBtn);
    await step(driver, 'Confirm save if prompted');

    // Confirm modal if any
    const confirmSave = await driver.findElements(By.xpath("//div[contains(@class,'fixed')]//button[normalize-space()='Add Pin' or normalize-space()='Save' or translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz')='save change'] | //button[normalize-space()='Add Pin' or normalize-space()='Save']"));
    if (confirmSave.length) { await safeClick(driver, confirmSave[0]); }
    await step(driver, 'Site saved');

    // Optional: look for success toast/snackbar (non-fatal if not present)
    const successToast = await driver.findElements(By.xpath("//div[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'success') or contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'saved')]"));
    if (successToast.length) { console.log('LOG: Success toast detected'); }

    // Dismiss Pin Details if possible, but do not fail if it stays open
    await ensurePinDetailsDismissed(driver);

    // Strict post-save verification: ensure entry appears in Manage Pins within 30s
    await step(driver, 'Verify saved site appears in Manage Pins');
    const foundAfterSave = await waitForSiteInList(driver, UNIQUE_NAME, 30000);
    if (!foundAfterSave) {
      throw new Error('Saved site did not appear in Manage Pins within 30s');
    }
  });

  it('Manage Pins: search, filter Active and category', async () => {
    await step(driver, 'Open Manage Pins');
    const managePins = await driver.findElements(By.xpath("//button[@title='Manage Pins' or contains(.,'Manage Pins')] | //a[contains(.,'Manage Pins')]"));
    if (managePins.length) { await safeClick(driver, managePins[0]); await driver.sleep(1200); }

    await step(driver, `Search for site: ${UNIQUE_NAME}`);
    const searchInput = await driver.findElements(By.xpath("//input[contains(@placeholder,'Search') or contains(@aria-label,'Search')]"));
    if (searchInput.length) {
      await searchInput[0].clear().catch(()=>{});
      await searchInput[0].sendKeys(UNIQUE_NAME);
      await searchInput[0].sendKeys(Key.ENTER).catch(()=>{});
      await driver.sleep(1200);
      const searchBtn = await driver.findElements(By.xpath("//button[contains(.,'Search')] | //span[contains(@class,'search')]/ancestor::button"));
      if (searchBtn.length) { await safeClick(driver, searchBtn[0]); await driver.sleep(600); }
    }

    await step(driver, 'Filter: Active');
    const activeFilter = await driver.findElements(By.xpath("//button[contains(.,'Active')] | //select/option[normalize-space(.)='Active']"));
    if (activeFilter.length) await safeClick(driver, activeFilter[0]);

    await step(driver, `Filter: Category ${CATEGORY}`);
    const categoryFilter = await driver.findElements(By.xpath(`//button[contains(.,'${CATEGORY}')] | //select/option[normalize-space(.)='${CATEGORY}']`));
    if (categoryFilter.length) await safeClick(driver, categoryFilter[0]);

    await driver.sleep(1200);
  });

  it('Edit the site and Save', async () => {
    // Reopen Manage Pins and reset filters/search to avoid hiding the entry
    await step(driver, 'Ensure Manage Pins is open and reset filters');
    await openManagePinsAndReset(driver);
    await step(driver, `Search for site: ${UNIQUE_NAME}`);
    const searchBox = await driver.findElements(By.xpath("//input[contains(@placeholder,'Search') or contains(@aria-label,'Search')]"));
    if (searchBox.length) { await searchBox[0].sendKeys(UNIQUE_NAME); await driver.sleep(800); }

    // Locate entry (row or card) by unique site name, with scrolling for virtualized lists
    const entry = (await scrollFindSiteEntry(driver, UNIQUE_NAME, 10)) || await findSiteEntry(driver, UNIQUE_NAME, 3000);
    if (!entry) throw new Error('Site row/card not found to edit');

    await step(driver, 'Edit the site');
    const editBtn = await entry.element.findElement(By.xpath(".//button[contains(.,'Edit')]"));
    await safeClick(driver, editBtn);
    await driver.sleep(1000);

    // Make small edits (append text)
    await setIfPresent(driver, [
      { type:'css', q:"input[placeholder='Site Name']" },
      { type:'css', q:"input[name='name']" },
      { type:'xpath', q:"//label[contains(.,'Site Name')]/following::input[1]" }
    ], UNIQUE_NAME + ' (Updated)');

    // Save updates
    await step(driver, 'Save updates');
    const updateBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[@type='submit' and contains(normalize-space(.),'Update')] | //button[contains(normalize-space(.),'Save')]")),
      12000
    );
    await safeClick(driver, updateBtn);

    const confirmUpd = await driver.findElements(By.xpath("//div[contains(@class,'fixed') and .//button[normalize-space()='Update']]//button[normalize-space()='Update'] | //button[normalize-space()='Update']"));
    if (confirmUpd.length) await safeClick(driver, confirmUpd[0]);
    await step(driver, 'Updates saved');
  });

  it('Archive, Restore, Permanently Delete', async () => {
    // Ensure Manage Pins is open and filters are reset, then search and scroll
    await step(driver, 'Ensure Manage Pins is open and reset filters');
    
    // Click Manage Pins button to open modal
    const managePinsBtnArchive = await driver.wait(until.elementLocated(By.xpath("//button[@title='Manage Pins']")), 10000);
    await safeClick(driver, managePinsBtnArchive);
    
    // Wait for modal to appear
    await driver.wait(until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//h2[contains(., 'Manage Pins')]")), 10000);
    await driver.sleep(1500); // Wait for modal to fully render
    
    await step(driver, `Search for site: ${UNIQUE_NAME}`);
    const searchBox2 = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//input[@placeholder='Search by site name...']")),
      10000
    );
    await searchBox2.clear();
    await searchBox2.sendKeys(UNIQUE_NAME); 
    await driver.sleep(2000); // Wait for search results to render
    
    // Find entry again (row or card) - with longer timeout
    let entry = (await scrollFindSiteEntry(driver, UNIQUE_NAME, 20)) || await findSiteEntry(driver, UNIQUE_NAME, 10000);
    if (!entry) {
      // Debug: log what we found
      const allCards = await driver.findElements(By.xpath("//div[contains(@class,'grid')]//div[contains(@class,'border')]"));
      console.log(`DEBUG: Found ${allCards.length} cards in grid`);
      throw new Error('Site row/card not found for archive');
    }

    // Archive - Click Edit button to open Pin Details form
    await step(driver, 'Click Edit to open Pin Details');
    const editBtn = await entry.element.findElement(By.xpath(".//button[contains(.,'Edit')]"));
    await safeClick(driver, editBtn);
    await driver.sleep(1500);
    
    // Archive button is in Pin Details form
    await step(driver, 'Archive site from Pin Details');
    const archiveBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(.,'Archive')]")), 10000);
    await safeClick(driver, archiveBtn);
    await driver.sleep(1000);
    
    // Confirm archive in modal
    const confirmArchive = await driver.wait(until.elementLocated(By.xpath("//button[contains(.,'Archive')]")), 10000);
    await safeClick(driver, confirmArchive);
    await driver.sleep(2000);
    await step(driver, 'Archived');

    // Reopen Manage Pins to see Archived tab
    await step(driver, 'Reopen Manage Pins to view Archived tab');
    const managePinsBtn = await driver.wait(until.elementLocated(By.xpath("//button[@title='Manage Pins']")), 10000);
    await safeClick(driver, managePinsBtn);
    await driver.sleep(1500);
    
    // Switch to Archived tab
    const archivedTab = await driver.wait(until.elementLocated(By.xpath("//button[contains(.,'Archived')]")), 10000);
    await safeClick(driver, archivedTab);
    await driver.sleep(1500);
    await step(driver, 'Viewing Archived');

    // Find entry in archived - wait longer for content to render
    await driver.sleep(3000);
    
    // Debug: Check what's in the archived section
    const allText = await driver.findElement(By.css('body')).getText();
    const hasName = allText.includes(UNIQUE_NAME);
    console.log(`DEBUG: Site name "${UNIQUE_NAME}" in page: ${hasName}`);
    
    // Search for archived card - try multiple approaches
    let archivedCard = null;
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline && !archivedCard) {
      // Approach 1: Find any element containing the site name
      let elements = await driver.findElements(By.xpath("//*[contains(text(), '" + UNIQUE_NAME + "')]"));
      console.log(`DEBUG: Found ${elements.length} elements with site name`);
      
      if (elements.length > 0) {
        const tag = await elements[0].getTagName();
        const text = await elements[0].getText().catch(() => '');
        console.log(`DEBUG: Found element: <${tag}> text="${text.substring(0, 50)}"`);
        
        try {
          // Get the card div (border-2 border-gray-300)
          const cardDiv = await elements[0].findElement(By.xpath("ancestor::div[contains(@class,'border-2') and contains(@class,'border-gray-300')]"));
          archivedCard = cardDiv;
          console.log('DEBUG: Found archived card with border-gray-300');
          break;
        } catch (e) {
          console.log('DEBUG: No border-gray-300 ancestor, trying fallback');
          // Fallback: just get any border-2 ancestor
          try {
            const cardDiv = await elements[0].findElement(By.xpath("ancestor::div[contains(@class,'border-2')]"));
            archivedCard = cardDiv;
            console.log('DEBUG: Found archived card with border-2');
            break;
          } catch (e2) {
            console.log('DEBUG: No border-2 ancestor either');
            // Last resort: get the closest div ancestor
            try {
              const divAncestor = await elements[0].findElement(By.xpath("ancestor::div[1]"));
              archivedCard = divAncestor;
              console.log('DEBUG: Using closest div ancestor as fallback');
              break;
            } catch (e3) {
              console.log('DEBUG: No div ancestor found');
            }
          }
        }
      }
      await driver.sleep(500);
    }
    
    if (archivedCard) {
      entry = { element: archivedCard, type: 'card' };
    } else {
      throw new Error('Archived row/card not found');
    }

    // Restore - Click on archived card to view it (Restore button is in the card itself)
    await step(driver, 'Restore site from Archived tab');
    const restoreBtn = await entry.element.findElement(By.xpath(".//button[contains(.,'Restore')]"));
    await safeClick(driver, restoreBtn);
    await driver.sleep(1500);
    await step(driver, 'Restored');

    // Back to Active and re-find entry
    const activeTab = await driver.wait(until.elementLocated(By.xpath("//button[contains(.,'Active')] | //button[contains(.,'Active Filters')]")), 10000);
    await safeClick(driver, activeTab);
    await driver.sleep(1500);

    entry = (await scrollFindSiteEntry(driver, UNIQUE_NAME, 10)) || await findSiteEntry(driver, UNIQUE_NAME, 3000);
    if (!entry) throw new Error('Active row/card not found after restore');

    // Archive again to allow permanent delete
    await step(driver, 'Archive again for permanent delete');
    const editBtn2 = await entry.element.findElement(By.xpath(".//button[contains(.,'Edit')]"));
    await safeClick(driver, editBtn2);
    await driver.sleep(1500);
    
    const archiveBtn2 = await driver.wait(until.elementLocated(By.xpath("//button[contains(.,'Archive')]")), 10000);
    await safeClick(driver, archiveBtn2);
    await driver.sleep(1000);
    
    const confirmArchive2 = await driver.wait(until.elementLocated(By.xpath("//button[contains(.,'Archive')]")), 10000);
    await safeClick(driver, confirmArchive2);
    await step(driver, 'Archived again');

    // Go to Archived and permanently delete
    const archivedTab2 = await driver.wait(until.elementLocated(By.xpath("//button[contains(.,'Archived')]")), 10000);
    await safeClick(driver, archivedTab2);
    await driver.sleep(1500);

    entry = (await scrollFindSiteEntry(driver, UNIQUE_NAME, 10)) || await findSiteEntry(driver, UNIQUE_NAME, 5000);
    if (!entry) throw new Error('Archived row/card not found before delete');

    await step(driver, 'Click Delete button on archived card');
    const deleteBtn = await entry.element.findElement(By.xpath(".//button[contains(.,'Delete')]"));
    await safeClick(driver, deleteBtn);
    await driver.sleep(1000);
    
    await step(driver, 'Confirm delete in modal');
    const confirmDeleteBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(.,'Delete')]")), 10000);
    await safeClick(driver, confirmDeleteBtn);
    await driver.sleep(1500);
    await step(driver, 'Deleted forever');
  });
});
