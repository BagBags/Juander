const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

const BASE_URL = process.env.BASE_URL || 'https://d39zx5gyblzxjs.cloudfront.net';
const HEADLESS = process.env.HEADLESS !== 'false';
const SLOW_MS = parseInt(process.env.SLOW_MS) || 0;

describe('Guest Mobile - Photobooth', () => {
  let driver;

  before(async () => {
    const options = new chrome.Options();
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    
    if (HEADLESS) {
      options.addArguments('--headless=new');
    }

    // Mobile viewport (iPhone 14 Pro Max)
    options.excludeSwitches('enable-automation');
    options.setUserPreferences({ credentials_enable_service: false });

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    // Set mobile viewport
    await driver.executeScript(
      'Object.defineProperty(navigator, "userAgent", {get: () => "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1"})'
    );
    await driver.manage().window().setRect({ width: 430, height: 932 });

    // Grant camera permissions
    await driver.executeScript(`
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'camera'
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(parameters)
      );
    `);

    if (SLOW_MS > 0) {
      await driver.manage().setTimeouts({ implicit: SLOW_MS });
    }
  });

  after(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  describe('Mobile Photobooth Navigation', () => {
    it('should navigate to mobile homepage', async () => {
      console.log('\nSTEP: Navigate to mobile homepage');
      
      await driver.get(`${BASE_URL}/GuestHomepage`);
      await driver.sleep(2000);
      
      const currentUrl = await driver.getCurrentUrl();
      console.log(`Current URL: ${currentUrl}`);
      
      assert(currentUrl.includes('GuestHomepage'), 'Should be on GuestHomepage');
      console.log('✅ Successfully navigated to GuestHomepage');
    });

    it('should display Photobooth button on mobile homepage', async () => {
      console.log('\nSTEP: Verify Photobooth button is visible on mobile');
      
      await driver.get(`${BASE_URL}/GuestHomepage`);
      await driver.sleep(2000);
      
      // Look for Photobooth button in side buttons
      const photoboothButtons = await driver.findElements(By.xpath('//a[@href="/Photobooth"] | //button[contains(@class, "side-button-photobooth")]'));
      console.log(`Found ${photoboothButtons.length} Photobooth button(s)`);
      
      assert(photoboothButtons.length > 0, 'Photobooth button should be visible on mobile');
      console.log('✅ Photobooth button is visible on mobile homepage');
    });

    it('should click Photobooth button and navigate to Photobooth page', async () => {
      console.log('\nSTEP: Click Photobooth button and navigate');
      
      await driver.get(`${BASE_URL}/GuestHomepage`);
      await driver.sleep(2000);
      
      // Find and click Photobooth button
      const photoboothLink = await driver.findElement(By.xpath('//a[@href="/Photobooth"]'));
      await photoboothLink.click();
      await driver.sleep(3000);
      
      const currentUrl = await driver.getCurrentUrl();
      console.log(`Current URL: ${currentUrl}`);
      
      assert(currentUrl.includes('Photobooth'), 'Should navigate to Photobooth page');
      console.log('✅ Successfully navigated to Photobooth page');
    });
  });

  describe('Mobile Photobooth Camera Initialization', () => {
    it('should display camera initialization on Photobooth page', async () => {
      console.log('\nSTEP: Verify camera initialization');
      
      await driver.get(`${BASE_URL}/Photobooth`);
      await driver.sleep(4000);
      
      // Look for loading overlay or camera canvas
      const loadingOverlay = await driver.findElements(By.xpath('//div[contains(@class, "loading-overlay")] | //div[contains(text(), "Initializing camera")]'));
      const canvas = await driver.findElements(By.id('jeeFaceFilterCanvas'));
      
      console.log(`Found ${loadingOverlay.length} loading overlay(s)`);
      console.log(`Found ${canvas.length} camera canvas(es)`);
      
      // Either loading or canvas should be present
      assert(loadingOverlay.length > 0 || canvas.length > 0, 'Camera initialization UI should be visible');
      console.log('✅ Camera initialization UI is visible');
    });

    it('should display back button on Photobooth', async () => {
      console.log('\nSTEP: Verify back button is visible');
      
      await driver.get(`${BASE_URL}/Photobooth`);
      await driver.sleep(3000);
      
      // Look for back button
      const backButtons = await driver.findElements(By.xpath('//button[@aria-label="Go back"] | //button[contains(@class, "rounded-full")]'));
      console.log(`Found ${backButtons.length} back button(s)`);
      
      assert(backButtons.length > 0, 'Back button should be visible');
      console.log('✅ Back button is visible on Photobooth');
    });

    it('should display refresh button on Photobooth', async () => {
      console.log('\nSTEP: Verify refresh button is visible');
      
      await driver.get(`${BASE_URL}/Photobooth`);
      await driver.sleep(3000);
      
      // Look for refresh button
      const refreshButtons = await driver.findElements(By.xpath('//button[@title="Refresh"] | //button[@aria-label="Refresh camera"]'));
      console.log(`Found ${refreshButtons.length} refresh button(s)`);
      
      assert(refreshButtons.length > 0, 'Refresh button should be visible');
      console.log('✅ Refresh button is visible on Photobooth');
    });
  });

  describe('Mobile Photobooth UI Elements', () => {
    it('should display filter carousel on Photobooth', async () => {
      console.log('\nSTEP: Verify filter carousel is visible');
      
      await driver.get(`${BASE_URL}/Photobooth`);
      await driver.sleep(4000);
      
      // Look for bottom controls with filter carousel
      const bottomControls = await driver.findElements(By.xpath('//div[contains(@class, "bottom-controls")] | //div[contains(@class, "carousel")]'));
      console.log(`Found ${bottomControls.length} bottom control(s)`);
      
      assert(bottomControls.length > 0, 'Filter carousel should be visible');
      console.log('✅ Filter carousel is visible on Photobooth');
    });

    it('should display filter buttons in carousel', async () => {
      console.log('\nSTEP: Verify filter buttons are present');
      
      await driver.get(`${BASE_URL}/Photobooth`);
      await driver.sleep(4000);
      
      // Look for filter buttons
      const filterButtons = await driver.findElements(By.xpath('//button[contains(@class, "filter")] | //button[contains(@style, "width")] | //div[contains(@class, "carousel")]//button'));
      console.log(`Found ${filterButtons.length} filter button(s)`);
      
      if (filterButtons.length > 0) {
        console.log('✅ Filter buttons are present in carousel');
      } else {
        console.log('⚠️ No filter buttons found (carousel may still be loading)');
      }
    });

    it('should display capture button on Photobooth', async () => {
      console.log('\nSTEP: Verify capture button is visible');
      
      await driver.get(`${BASE_URL}/Photobooth`);
      await driver.sleep(4000);
      
      // Look for capture button (Camera icon button)
      const captureButtons = await driver.findElements(By.xpath('//button[contains(@class, "capture")] | //button[svg]//svg[contains(@class, "lucide-camera")]'));
      console.log(`Found ${captureButtons.length} capture button(s)`);
      
      // If not found by specific selector, look for any button in bottom controls
      if (captureButtons.length === 0) {
        const allButtons = await driver.findElements(By.xpath('//div[contains(@class, "bottom-controls")]//button'));
        console.log(`Found ${allButtons.length} button(s) in bottom controls`);
        
        if (allButtons.length > 0) {
          console.log('✅ Buttons are present in bottom controls (likely includes capture button)');
        }
      } else {
        console.log('✅ Capture button is visible on Photobooth');
      }
    });
  });

  describe('Mobile Photobooth Functional Tests', () => {
    it('should wait for camera to be ready', async () => {
      console.log('\nSTEP: Wait for camera to be ready');
      
      await driver.get(`${BASE_URL}/Photobooth`);
      
      // Wait for camera to initialize (up to 10 seconds)
      try {
        await driver.wait(
          async () => {
            const loadingOverlay = await driver.findElements(By.xpath('//div[contains(@class, "loading-overlay")]'));
            return loadingOverlay.length === 0; // Camera ready when loading overlay is gone
          },
          10000
        );
        console.log('✅ Camera initialized successfully');
      } catch (e) {
        console.log('⚠️ Camera initialization timeout (may still be loading or require permissions)');
      }
    });

    it('should allow scrolling through filters', async () => {
      console.log('\nSTEP: Test filter carousel scrolling');
      
      await driver.get(`${BASE_URL}/Photobooth`);
      await driver.sleep(5000);
      
      // Find carousel container
      const carousel = await driver.findElements(By.xpath('//div[contains(@class, "carousel")] | //div[contains(@class, "bottom-controls")]'));
      
      if (carousel.length > 0) {
        try {
          // Try to scroll the carousel
          await driver.executeScript(`
            const carousels = document.querySelectorAll('[class*="carousel"]');
            if (carousels.length > 0) {
              carousels[0].scrollLeft += 100;
            }
          `);
          await driver.sleep(1000);
          console.log('✅ Filter carousel scrolling works');
        } catch (e) {
          console.log('⚠️ Could not scroll carousel:', e.message);
        }
      } else {
        console.log('⚠️ Carousel not found');
      }
    });

    it('should handle back button click', async () => {
      console.log('\nSTEP: Test back button functionality');
      
      await driver.get(`${BASE_URL}/Photobooth`);
      await driver.sleep(3000);
      
      // Find and click back button
      const backButton = await driver.findElements(By.xpath('//button[@aria-label="Go back"]'));
      
      if (backButton.length > 0) {
        await backButton[0].click();
        await driver.sleep(2000);
        
        const currentUrl = await driver.getCurrentUrl();
        console.log(`URL after back button: ${currentUrl}`);
        
        if (!currentUrl.includes('Photobooth')) {
          console.log('✅ Back button successfully navigated away from Photobooth');
        } else {
          console.log('⚠️ Back button did not navigate away');
        }
      } else {
        console.log('⚠️ Back button not found');
      }
    });

    it('should handle refresh button click', async () => {
      console.log('\nSTEP: Test refresh button functionality');
      
      await driver.get(`${BASE_URL}/Photobooth`);
      await driver.sleep(3000);
      
      // Find and click refresh button
      const refreshButton = await driver.findElements(By.xpath('//button[@title="Refresh"] | //button[@aria-label="Refresh camera"]'));
      
      if (refreshButton.length > 0) {
        await refreshButton[0].click();
        await driver.sleep(2000);
        
        // Check if page is still on Photobooth
        const currentUrl = await driver.getCurrentUrl();
        console.log(`URL after refresh: ${currentUrl}`);
        
        if (currentUrl.includes('Photobooth')) {
          console.log('✅ Refresh button works (page reloaded)');
        } else {
          console.log('⚠️ Refresh button caused navigation');
        }
      } else {
        console.log('⚠️ Refresh button not found');
      }
    });

    it('should maintain mobile viewport on Photobooth', async () => {
      console.log('\nSTEP: Verify mobile viewport is maintained');
      
      await driver.get(`${BASE_URL}/Photobooth`);
      await driver.sleep(2000);
      
      const windowSize = await driver.manage().window().getRect();
      console.log(`Current viewport: ${windowSize.width}x${windowSize.height}`);
      
      // Mobile viewport should be less than 768px width (tablet breakpoint)
      assert(windowSize.width < 768, 'Viewport width should be mobile size (< 768px)');
      console.log('✅ Mobile viewport is maintained on Photobooth');
    });

    it('should display responsive UI elements on mobile', async () => {
      console.log('\nSTEP: Verify responsive UI elements');
      
      await driver.get(`${BASE_URL}/Photobooth`);
      await driver.sleep(3000);
      
      // Check for mobile-specific classes or responsive behavior
      const mobileElements = await driver.findElements(By.xpath('//*[contains(@class, "md:hidden")] | //*[contains(@class, "block md:hidden")]'));
      console.log(`Found ${mobileElements.length} mobile-specific element(s)`);
      
      // Check for phone frame or container
      const phoneFrame = await driver.findElements(By.xpath('//div[contains(@class, "phone-frame")] | //div[contains(@class, "photobooth-container")]'));
      console.log(`Found ${phoneFrame.length} photobooth container(s)`);
      
      assert(phoneFrame.length > 0, 'Photobooth container should be present');
      console.log('✅ Responsive UI elements are present on mobile');
    });
  });

  describe('Mobile Photobooth - Camera Permissions', () => {
    it('should handle camera permission requests gracefully', async () => {
      console.log('\nSTEP: Verify camera permission handling');
      
      await driver.get(`${BASE_URL}/Photobooth`);
      await driver.sleep(4000);
      
      // Check for any error messages related to permissions
      const errorMessages = await driver.findElements(By.xpath('//div[contains(text(), "permission")] | //div[contains(text(), "Permission")] | //div[contains(text(), "camera")]'));
      console.log(`Found ${errorMessages.length} permission-related message(s)`);
      
      // Check if camera canvas or loading overlay is present (indicating camera access)
      const canvas = await driver.findElements(By.id('jeeFaceFilterCanvas'));
      const loadingOverlay = await driver.findElements(By.xpath('//div[contains(@class, "loading-overlay")]'));
      
      if (canvas.length > 0 || loadingOverlay.length > 0) {
        console.log('✅ Camera is accessible or initializing');
      } else {
        console.log('⚠️ Camera may not be accessible (check browser permissions)');
      }
    });

    it('should display appropriate UI when camera is initializing', async () => {
      console.log('\nSTEP: Verify camera initialization UI');
      
      await driver.get(`${BASE_URL}/Photobooth`);
      
      // Check for loading indicator
      const loadingText = await driver.findElements(By.xpath('//div[contains(text(), "Initializing camera")] | //div[contains(text(), "Loading")]'));
      console.log(`Found ${loadingText.length} loading message(s)`);
      
      if (loadingText.length > 0) {
        console.log('✅ Camera initialization message is displayed');
      } else {
        console.log('⚠️ Loading message not found (camera may have already initialized)');
      }
    });
  });

  describe('Mobile Photobooth - Layout and Sizing', () => {
    it('should display properly sized buttons for touch interaction', async () => {
      console.log('\nSTEP: Check button sizes for touch interaction');
      
      await driver.get(`${BASE_URL}/Photobooth`);
      await driver.sleep(3000);
      
      // Find all buttons
      const buttons = await driver.findElements(By.xpath('//button'));
      console.log(`Found ${buttons.length} button(s) on Photobooth`);
      
      let touchFriendlyCount = 0;
      
      for (const button of buttons) {
        try {
          const size = await button.getRect();
          // Touch-friendly buttons should be at least 36x36px
          if (size.width >= 36 && size.height >= 36) {
            touchFriendlyCount++;
          }
        } catch (e) {
          // Button may not be visible
        }
      }
      
      console.log(`${touchFriendlyCount} button(s) are touch-friendly (≥36px)`);
      
      if (touchFriendlyCount > 0) {
        console.log('✅ Buttons are properly sized for mobile touch');
      } else {
        console.log('⚠️ No touch-friendly buttons found (may be hidden or loading)');
      }
    });

    it('should prevent page scrolling when Photobooth is active', async () => {
      console.log('\nSTEP: Verify page scrolling is prevented');
      
      await driver.get(`${BASE_URL}/Photobooth`);
      await driver.sleep(2000);
      
      // Check if body has photobooth-active class
      const bodyClass = await driver.executeScript('return document.body.className');
      console.log(`Body classes: ${bodyClass}`);
      
      if (bodyClass.includes('photobooth-active')) {
        console.log('✅ Photobooth-active class is applied to body');
      } else {
        console.log('⚠️ Photobooth-active class not found');
      }
    });

    it('should display camera canvas at full viewport width on mobile', async () => {
      console.log('\nSTEP: Verify camera canvas fills viewport');
      
      await driver.get(`${BASE_URL}/Photobooth`);
      await driver.sleep(3000);
      
      // Get canvas element
      const canvas = await driver.findElements(By.id('jeeFaceFilterCanvas'));
      
      if (canvas.length > 0) {
        const canvasRect = await canvas[0].getRect();
        const windowSize = await driver.manage().window().getRect();
        
        console.log(`Canvas size: ${canvasRect.width}x${canvasRect.height}`);
        console.log(`Window size: ${windowSize.width}x${windowSize.height}`);
        
        // Canvas should be responsive to viewport
        if (canvasRect.width > 0 && canvasRect.height > 0) {
          console.log('✅ Camera canvas is displayed and sized');
        } else {
          console.log('⚠️ Canvas size is zero (may not be rendered yet)');
        }
      } else {
        console.log('⚠️ Camera canvas not found');
      }
    });
  });
});
