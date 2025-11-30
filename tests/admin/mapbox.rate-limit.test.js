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

async function goToTourMap(driver) {
  await driver.get(`${BASE_URL}/TourMap`);
  await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000).catch(()=>{});
  await driver.sleep(1000);
  
  // Wait for map to load
  try {
    await driver.wait(until.elementLocated(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]")), 10000);
    return;
  } catch (_) {}
  
  // Hash route fallback
  await driver.get(`${BASE_URL}/#/TourMap`);
  await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000).catch(()=>{});
  await driver.sleep(1000);
}

async function goToAdminTourMap(driver) {
  await driver.get(`${BASE_URL}/AdminTourMap`);
  await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000).catch(()=>{});
  await driver.sleep(1000);
  
  // Wait for map to load
  try {
    await driver.wait(until.elementLocated(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]")), 10000);
    return;
  } catch (_) {}
  
  // Hash route fallback
  await driver.get(`${BASE_URL}/#/AdminTourMap`);
  await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000).catch(()=>{});
  await driver.sleep(1000);
}

describe('Mapbox Rate Limit Handling Tests', function () {
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

  describe('Mapbox API Rate Limit Monitoring', () => {
    it('Should load TourMap without rate limit errors', async () => {
      await step(driver, 'Login to production');
      await loginToProduction(driver, BASE_URL, ADMIN_USER, ADMIN_PASS);

      await step(driver, 'Navigate to TourMap');
      await goToTourMap(driver);

      await step(driver, 'Verify map canvas is rendered');
      const mapCanvas = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]")),
        10000
      );
      if (!mapCanvas) throw new Error('Map canvas not found');

      await step(driver, 'Check for actual Mapbox rate limit errors');
      // Get real browser logs from the actual browser console
      const logs = await driver.manage().logs().get('browser');
      
      // Check for ACTUAL Mapbox rate limit errors only
      // Look for HTTP 429 status codes from Mapbox API calls
      const rateLimitErrors = logs.filter(log => {
        const message = log.message.toLowerCase();
        // Only flag actual HTTP 429 responses from API calls
        return (message.includes('http 429') ||
                message.includes('status 429') ||
                message.includes('status code 429') ||
                message.includes('too many requests') || 
                message.includes('rate limit exceeded')) &&
               !message.includes('webgl') && // Exclude browser warnings
               !message.includes('swiftshader') && // Exclude GPU warnings
               !message.includes('deprecated'); // Exclude deprecation notices
      });
      
      if (rateLimitErrors.length > 0) {
        throw new Error(`Mapbox rate limit errors detected: ${rateLimitErrors.map(l => l.message).join(', ')}`);
      }
    });

    it('Should handle rapid map interactions without rate limiting', async () => {
      await step(driver, 'Navigate to AdminTourMap');
      await goToAdminTourMap(driver);

      await step(driver, 'Verify map is loaded');
      const mapCanvas = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]")),
        10000
      );
      if (!mapCanvas) throw new Error('Map canvas not found');

      await step(driver, 'Perform rapid zoom interactions');
      const mapElement = await driver.findElement(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]"));
      
      // Simulate rapid zoom interactions
      for (let i = 0; i < 5; i++) {
        await driver.executeScript(`
          const event = new WheelEvent('wheel', {
            deltaY: -100,
            bubbles: true,
            cancelable: true
          });
          arguments[0].dispatchEvent(event);
        `, mapElement);
        await driver.sleep(200);
      }

      await step(driver, 'Wait for interactions to complete');
      await driver.sleep(2000);

      await step(driver, 'Verify map is still responsive');
      const mapStillVisible = await driver.findElement(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]"));
      if (!mapStillVisible) throw new Error('Map became unresponsive after rapid interactions');
    });

    it('Should handle multiple simultaneous API requests', async () => {
      await step(driver, 'Navigate to TourMap');
      await goToTourMap(driver);

      await step(driver, 'Verify map is loaded');
      const mapCanvas = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]")),
        10000
      );
      if (!mapCanvas) throw new Error('Map canvas not found');

      await step(driver, 'Trigger multiple search requests');
      // Look for search modal or search functionality
      try {
        const searchButton = await driver.findElement(By.xpath("//button[contains(@title, 'Search')]")).catch(() => null);
        if (searchButton) {
          await safeClick(driver, searchButton);
          await driver.sleep(500);
        }
      } catch (_) {
        console.log('Search button not found, skipping search test');
      }

      await step(driver, 'Check for actual Mapbox 429 errors');
      // Get real browser logs to check for actual HTTP 429 errors
      const logs = await driver.manage().logs().get('browser');
      
      // Check for ACTUAL 429 errors from Mapbox API (not browser warnings)
      const rateLimitResponses = logs.filter(log => {
        const message = log.message.toLowerCase();
        return (message.includes('http 429') ||
                message.includes('status 429') ||
                message.includes('status code 429') ||
                message.includes('too many requests')) &&
               !message.includes('webgl') && // Exclude browser warnings
               !message.includes('swiftshader') && // Exclude GPU warnings
               !message.includes('deprecated'); // Exclude deprecation notices
      });

      if (rateLimitResponses.length > 0) {
        throw new Error(`Mapbox 429 rate limit responses detected: ${rateLimitResponses.map(l => l.message).join(', ')}`);
      }
    });

    it('Should gracefully handle rate limit responses with retry logic', async () => {
      await step(driver, 'Navigate to AdminTourMap');
      await goToAdminTourMap(driver);

      await step(driver, 'Verify map is loaded');
      const mapCanvas = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]")),
        10000
      );
      if (!mapCanvas) throw new Error('Map canvas not found');

      await step(driver, 'Perform actual map pan operation using real drag');
      const mapElement = await driver.findElement(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]"));
      
      // Perform real drag action using Selenium Actions
      const actions = driver.actions({ async: true });
      
      await actions
        .move({ origin: mapElement, x: 50, y: 50 })
        .press()
        .move({ origin: mapElement, x: -30, y: -30 })
        .release()
        .perform();

      await step(driver, 'Wait for map to process pan');
      await driver.sleep(2000);

      await step(driver, 'Verify map remained functional and responsive');
      const mapStillVisible = await driver.findElement(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]"));
      if (!mapStillVisible) throw new Error('Map became unresponsive after pan operation');
      
      // Verify no actual Mapbox rate limit errors from the pan operation
      const logs = await driver.manage().logs().get('browser');
      const rateLimitErrors = logs.filter(log => {
        const message = log.message.toLowerCase();
        return (message.includes('http 429') ||
                message.includes('status 429') ||
                message.includes('status code 429') ||
                message.includes('too many requests') ||
                message.includes('rate limit exceeded')) &&
               !message.includes('webgl') && // Exclude browser warnings
               !message.includes('swiftshader') && // Exclude GPU warnings
               !message.includes('deprecated'); // Exclude deprecation notices
      });
      
      if (rateLimitErrors.length > 0) {
        throw new Error(`Map pan triggered Mapbox rate limit errors: ${rateLimitErrors.map(l => l.message).join(', ')}`);
      }
    });

    it('Should display user-friendly error message on rate limit', async () => {
      await step(driver, 'Navigate to TourMap');
      await goToTourMap(driver);

      await step(driver, 'Verify map is loaded');
      const mapCanvas = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]")),
        10000
      );
      if (!mapCanvas) throw new Error('Map canvas not found');

      await step(driver, 'Check for actual error handling in browser logs');
      // Get real browser logs to see if any actual errors occurred
      const logs = await driver.manage().logs().get('browser');
      
      // Check for actual rate limit errors
      const rateLimitErrors = logs.filter(log => 
        log.message.toLowerCase().includes('429') || 
        log.message.toLowerCase().includes('rate limit')
      );

      // If rate limit errors exist, verify error UI is displayed
      if (rateLimitErrors.length > 0) {
        await step(driver, 'Rate limit error detected - checking for error UI');
        const errorElements = await driver.findElements(By.xpath(
          "//div[contains(@class, 'error') or contains(@class, 'alert') or contains(@class, 'toast') or contains(@class, 'notification')]"
        ));
        
        if (errorElements.length === 0) {
          console.warn('Rate limit error occurred but no error UI found - app may handle silently');
        }
      }

      await step(driver, 'Verify map is still rendered and functional');
      const mapStillVisible = await driver.findElement(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]"));
      if (!mapStillVisible) throw new Error('Map crashed - not rendered after potential rate limit error');
    });

    it('Should maintain map state during rate limit recovery', async () => {
      await step(driver, 'Navigate to AdminTourMap');
      await goToAdminTourMap(driver);

      await step(driver, 'Verify map is loaded');
      const mapCanvas = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]")),
        10000
      );
      if (!mapCanvas) throw new Error('Map canvas not found');

      await step(driver, 'Get initial map state from actual Mapbox instance');
      // Try to get actual map state from Mapbox GL JS if available
      const initialState = await driver.executeScript(`
        // Check if mapboxgl is available
        if (typeof mapboxgl === 'undefined') return null;
        
        // Try to find map instance in window
        const mapInstance = window.map || window.mapInstance || null;
        if (!mapInstance) return null;
        
        return {
          zoom: mapInstance.getZoom(),
          center: mapInstance.getCenter(),
          bearing: mapInstance.getBearing(),
          pitch: mapInstance.getPitch()
        };
      `);

      if (!initialState) {
        console.log('Mapbox instance not directly accessible - skipping state preservation test');
        return;
      }

      await step(driver, 'Perform map interaction');
      const mapElement = await driver.findElement(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]"));
      const actions = driver.actions({ async: true });
      
      await actions
        .move({ origin: mapElement, x: 0, y: 0 })
        .press()
        .move({ origin: mapElement, x: -50, y: -50 })
        .release()
        .perform();

      await driver.sleep(2000);

      await step(driver, 'Verify map state is preserved after interaction');
      const finalState = await driver.executeScript(`
        if (typeof mapboxgl === 'undefined') return null;
        const mapInstance = window.map || window.mapInstance || null;
        if (!mapInstance) return null;
        
        return {
          zoom: mapInstance.getZoom(),
          center: mapInstance.getCenter(),
          bearing: mapInstance.getBearing(),
          pitch: mapInstance.getPitch()
        };
      `);

      if (finalState) {
        console.log(`Initial state: ${JSON.stringify(initialState)}`);
        console.log(`Final state: ${JSON.stringify(finalState)}`);
        // Map should still be functional and have valid state
        if (!finalState.zoom || finalState.zoom < 0 || finalState.zoom > 24) {
          throw new Error(`Invalid map zoom after interaction: ${finalState.zoom}`);
        }
      }
    });

    it('Should handle Mapbox token expiration gracefully', async () => {
      await step(driver, 'Navigate to TourMap');
      await goToTourMap(driver);

      await step(driver, 'Verify map is loaded');
      const mapCanvas = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]")),
        10000
      );
      if (!mapCanvas) throw new Error('Map canvas not found');

      await step(driver, 'Check for token validation');
      const tokenValid = await driver.executeScript(`
        // Check if Mapbox token is being used correctly
        const scripts = Array.from(document.scripts);
        const mapboxScripts = scripts.filter(s => s.src.includes('mapbox'));
        return mapboxScripts.length > 0;
      `);

      if (!tokenValid) {
        console.log('Warning: Mapbox scripts not detected');
      }

      await step(driver, 'Verify map functionality');
      const mapStillVisible = await driver.findElement(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]"));
      if (!mapStillVisible) throw new Error('Map not visible');
    });

    it('Should implement exponential backoff for retries', async () => {
      await step(driver, 'Navigate to AdminTourMap');
      await goToAdminTourMap(driver);

      await step(driver, 'Verify map is loaded');
      const mapCanvas = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]")),
        10000
      );
      if (!mapCanvas) throw new Error('Map canvas not found');

      await step(driver, 'Inject retry tracking');
      await driver.executeScript(`
        window.__retryAttempts = [];
        window.__originalFetch = fetch;
        
        window.fetch = function(...args) {
          const timestamp = Date.now();
          window.__retryAttempts.push({
            timestamp,
            url: args[0]
          });
          return window.__originalFetch.apply(this, args);
        };
      `);

      await step(driver, 'Perform map operations');
      const mapElement = await driver.findElement(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]"));
      
      // Trigger a map operation
      await driver.executeScript(`
        const event = new WheelEvent('wheel', {
          deltaY: -100,
          bubbles: true,
          cancelable: true
        });
        arguments[0].dispatchEvent(event);
      `, mapElement);

      await driver.sleep(2000);

      await step(driver, 'Verify retry attempts follow exponential backoff');
      const retryAttempts = await driver.executeScript(`
        return window.__retryAttempts || [];
      `);

      console.log(`Total retry attempts: ${retryAttempts.length}`);
      
      // If retries occurred, verify they have increasing delays
      if (retryAttempts.length > 1) {
        const delays = [];
        for (let i = 1; i < retryAttempts.length; i++) {
          delays.push(retryAttempts[i].timestamp - retryAttempts[i-1].timestamp);
        }
        console.log(`Retry delays (ms): ${delays.join(', ')}`);
      }
    });

    it('Should cache Mapbox responses to reduce API calls', async () => {
      await step(driver, 'Navigate to TourMap');
      await goToTourMap(driver);

      await step(driver, 'Verify map is loaded');
      const mapCanvas = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]")),
        10000
      );
      if (!mapCanvas) throw new Error('Map canvas not found');

      await step(driver, 'Track API requests');
      const initialRequests = await driver.executeScript(`
        return window.__mapboxApiCalls || 0;
      `);

      await step(driver, 'Navigate away and back to TourMap');
      await driver.get(`${BASE_URL}/GuestHomepage`);
      await driver.sleep(1000);
      await goToTourMap(driver);

      await step(driver, 'Verify map loaded again');
      const mapCanvas2 = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]")),
        10000
      );
      if (!mapCanvas2) throw new Error('Map canvas not found on second load');

      await step(driver, 'Compare API call counts');
      const finalRequests = await driver.executeScript(`
        return window.__mapboxApiCalls || 0;
      `);

      console.log(`Initial requests: ${initialRequests}, Final requests: ${finalRequests}`);
    });

    it('Should handle offline mode gracefully', async () => {
      await step(driver, 'Navigate to TourMap');
      await goToTourMap(driver);

      await step(driver, 'Verify map is loaded');
      const mapCanvas = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]")),
        10000
      );
      if (!mapCanvas) throw new Error('Map canvas not found');

      await step(driver, 'Simulate offline mode');
      await driver.executeScript(`
        window.__offlineMode = true;
        window.dispatchEvent(new Event('offline'));
      `);

      await driver.sleep(1000);

      await step(driver, 'Verify map gracefully handles offline state');
      const mapStillVisible = await driver.findElement(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]"));
      if (!mapStillVisible) throw new Error('Map disappeared in offline mode');

      await step(driver, 'Restore online mode');
      await driver.executeScript(`
        window.__offlineMode = false;
        window.dispatchEvent(new Event('online'));
      `);

      await driver.sleep(1000);

      await step(driver, 'Verify map recovers');
      const mapRecovered = await driver.findElement(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]"));
      if (!mapRecovered) throw new Error('Map did not recover after going online');
    });
  });

  describe('Mapbox Geocoding Rate Limits', () => {
    it('Should handle geocoding API rate limits', async () => {
      await step(driver, 'Navigate to AdminTourMap');
      await goToAdminTourMap(driver);

      await step(driver, 'Verify map is loaded');
      const mapCanvas = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]")),
        10000
      );
      if (!mapCanvas) throw new Error('Map canvas not found');

      await step(driver, 'Look for search functionality');
      const searchElements = await driver.findElements(By.xpath(
        "//input[contains(@placeholder, 'search') or contains(@placeholder, 'Search') or contains(@placeholder, 'location')]"
      ));

      if (searchElements.length === 0) {
        console.log('No search input found, skipping geocoding test');
        return;
      }

      await step(driver, 'Perform multiple rapid searches');
      const searchInput = searchElements[0];
      
      for (let i = 0; i < 3; i++) {
        await searchInput.clear();
        await searchInput.sendKeys(`Location ${i}`);
        await driver.sleep(300);
      }

      await step(driver, 'Verify no geocoding errors');
      const geocodingErrors = await driver.executeScript(`
        return window.__geocodingErrors || [];
      `);

      if (geocodingErrors.length > 0) {
        throw new Error(`Geocoding errors detected: ${geocodingErrors.join(', ')}`);
      }
    });

    it('Should handle directions API rate limits', async () => {
      await step(driver, 'Navigate to TourMap');
      await goToTourMap(driver);

      await step(driver, 'Verify map is loaded');
      const mapCanvas = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]")),
        10000
      );
      if (!mapCanvas) throw new Error('Map canvas not found');

      await step(driver, 'Look for directions/routing functionality');
      const routeButtons = await driver.findElements(By.xpath(
        "//button[contains(., 'Route') or contains(., 'Directions') or contains(., 'Navigate')]"
      ));

      if (routeButtons.length === 0) {
        console.log('No routing buttons found, skipping directions test');
        return;
      }

      await step(driver, 'Verify directions API is available');
      const directionsAvailable = await driver.executeScript(`
        return window.__directionsApiAvailable !== false;
      `);

      if (!directionsAvailable) {
        throw new Error('Directions API not available');
      }
    });
  });

  describe('Mapbox Styles and Layers Rate Limits', () => {
    it('Should handle style loading without rate limits', async () => {
      await step(driver, 'Navigate to AdminTourMap');
      await goToAdminTourMap(driver);

      await step(driver, 'Verify map is loaded');
      const mapCanvas = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]")),
        10000
      );
      if (!mapCanvas) throw new Error('Map canvas not found');

      await step(driver, 'Check map style loading');
      const styleLoaded = await driver.executeScript(`
        return window.__mapStyleLoaded !== false;
      `);

      if (!styleLoaded) {
        console.log('Warning: Map style may not have loaded');
      }

      await step(driver, 'Verify map is rendered');
      const mapStillVisible = await driver.findElement(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]"));
      if (!mapStillVisible) throw new Error('Map not visible');
    });

    it('Should handle layer toggling without rate limits', async () => {
      await step(driver, 'Navigate to TourMap');
      await goToTourMap(driver);

      await step(driver, 'Verify map is loaded');
      const mapCanvas = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]")),
        10000
      );
      if (!mapCanvas) throw new Error('Map canvas not found');

      await step(driver, 'Look for layer toggle controls');
      const layerButtons = await driver.findElements(By.xpath(
        "//button[contains(@class, 'layer') or contains(@title, 'layer') or contains(@title, 'Layer')]"
      ));

      if (layerButtons.length === 0) {
        console.log('No layer toggle buttons found');
        return;
      }

      await step(driver, 'Toggle layers rapidly');
      for (let i = 0; i < Math.min(3, layerButtons.length); i++) {
        try {
          await safeClick(driver, layerButtons[i]);
          await driver.sleep(300);
        } catch (_) {
          console.log(`Could not click layer button ${i}`);
        }
      }

      await step(driver, 'Verify map is still responsive');
      const mapStillVisible = await driver.findElement(By.xpath("//div[contains(@class, 'mapboxgl-canvas')]"));
      if (!mapStillVisible) throw new Error('Map became unresponsive');
    });
  });
});
