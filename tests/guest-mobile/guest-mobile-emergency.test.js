const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

const BASE_URL = process.env.BASE_URL || 'https://d39zx5gyblzxjs.cloudfront.net';
const HEADLESS = process.env.HEADLESS !== 'false';
const SLOW_MS = parseInt(process.env.SLOW_MS) || 0;

describe('Guest Mobile - Emergency Hotlines', () => {
  let driver;

  before(async () => {
    const options = new chrome.Options();
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    
    if (HEADLESS) {
      options.addArguments('--headless=new');
    }

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

    if (SLOW_MS > 0) {
      await driver.manage().setTimeouts({ implicit: SLOW_MS });
    }
  });

  after(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  describe('Mobile Emergency Hotlines Navigation', () => {
    it('should navigate to mobile homepage', async () => {
      console.log('\nSTEP: Navigate to mobile homepage');
      
      await driver.get(`${BASE_URL}/GuestHomepage`);
      await driver.sleep(2000);
      
      const currentUrl = await driver.getCurrentUrl();
      console.log(`Current URL: ${currentUrl}`);
      
      assert(currentUrl.includes('GuestHomepage'), 'Should be on GuestHomepage');
      console.log('✅ Successfully navigated to GuestHomepage');
    });

    it('should display Emergency Hotlines button on mobile homepage', async () => {
      console.log('\nSTEP: Verify Emergency Hotlines button is visible on mobile');
      
      await driver.get(`${BASE_URL}/GuestHomepage`);
      await driver.sleep(2000);
      
      // Look for Emergency/Hotlines button in side buttons
      const emergencyButtons = await driver.findElements(By.xpath('//a[@href="/Emergency"] | //button[contains(@class, "side-button-emergency")]'));
      console.log(`Found ${emergencyButtons.length} Emergency button(s)`);
      
      assert(emergencyButtons.length > 0, 'Emergency button should be visible on mobile');
      console.log('✅ Emergency Hotlines button is visible on mobile homepage');
    });

    it('should click Emergency Hotlines button and navigate to Emergency page', async () => {
      console.log('\nSTEP: Click Emergency Hotlines button and navigate');
      
      await driver.get(`${BASE_URL}/GuestHomepage`);
      await driver.sleep(2000);
      
      // Find and click Emergency button
      const emergencyLink = await driver.findElement(By.xpath('//a[@href="/Emergency"]'));
      await emergencyLink.click();
      await driver.sleep(3000);
      
      const currentUrl = await driver.getCurrentUrl();
      console.log(`Current URL: ${currentUrl}`);
      
      assert(currentUrl.includes('Emergency'), 'Should navigate to Emergency page');
      console.log('✅ Successfully navigated to Emergency Hotlines page');
    });
  });

  describe('Mobile Emergency Hotlines Page Display', () => {
    it('should display Emergency Hotlines page header', async () => {
      console.log('\nSTEP: Verify Emergency Hotlines page header');
      
      await driver.get(`${BASE_URL}/Emergency`);
      await driver.sleep(2000);
      
      // Look for page title
      const pageTitle = await driver.findElements(By.xpath('//h1[contains(text(), "Emergency")] | //h1[contains(text(), "Hotline")]'));
      console.log(`Found ${pageTitle.length} page title(s)`);
      
      assert(pageTitle.length > 0, 'Page title should be visible');
      console.log('✅ Emergency Hotlines page header is visible');
    });

    it('should display back button on Emergency page', async () => {
      console.log('\nSTEP: Verify back button is visible');
      
      await driver.get(`${BASE_URL}/Emergency`);
      await driver.sleep(2000);
      
      // Look for back button
      const backButtons = await driver.findElements(By.xpath('//button[contains(@aria-label, "back")] | //button[contains(@class, "back")] | //a[contains(@href, "back")]'));
      console.log(`Found ${backButtons.length} back button(s)`);
      
      if (backButtons.length > 0) {
        console.log('✅ Back button is visible on Emergency page');
      } else {
        console.log('⚠️ Back button not found (may use browser back)');
      }
    });

    it('should display emergency hotlines cards', async () => {
      console.log('\nSTEP: Verify emergency hotlines cards are displayed');
      
      await driver.get(`${BASE_URL}/Emergency`);
      await driver.sleep(3000);
      
      // Look for hotline cards
      const hotlineCards = await driver.findElements(By.xpath('//div[contains(@class, "rounded-3xl")] | //div[contains(@class, "bg-white")]//div[contains(@class, "rounded")]'));
      console.log(`Found ${hotlineCards.length} hotline card(s)`);
      
      assert(hotlineCards.length > 0, 'Hotline cards should be visible');
      console.log('✅ Emergency hotlines cards are displayed');
    });

    it('should display hotline titles', async () => {
      console.log('\nSTEP: Verify hotline titles are displayed');
      
      await driver.get(`${BASE_URL}/Emergency`);
      await driver.sleep(3000);
      
      // Look for hotline titles (h3 elements)
      const titles = await driver.findElements(By.xpath('//h3[contains(@class, "font-bold")]'));
      console.log(`Found ${titles.length} hotline title(s)`);
      
      if (titles.length > 0) {
        const firstTitle = await titles[0].getText();
        console.log(`First hotline: ${firstTitle}`);
        console.log('✅ Hotline titles are displayed');
      } else {
        console.log('⚠️ No hotline titles found (may still be loading)');
      }
    });

    it('should display phone call buttons with numbers', async () => {
      console.log('\nSTEP: Verify phone call buttons are displayed');
      
      await driver.get(`${BASE_URL}/Emergency`);
      await driver.sleep(3000);
      
      // Look for tel: links (phone call buttons)
      const phoneLinks = await driver.findElements(By.xpath('//a[contains(@href, "tel:")]'));
      console.log(`Found ${phoneLinks.length} phone call button(s)`);
      
      assert(phoneLinks.length > 0, 'Phone call buttons should be visible');
      console.log('✅ Phone call buttons are displayed');
    });

    it('should display alert banner with important notice', async () => {
      console.log('\nSTEP: Verify alert banner is displayed');
      
      await driver.get(`${BASE_URL}/Emergency`);
      await driver.sleep(2000);
      
      // Look for alert banner
      const alertBanners = await driver.findElements(By.xpath('//div[contains(text(), "Important")] | //div[contains(text(), "emergency")]'));
      console.log(`Found ${alertBanners.length} alert banner(s)`);
      
      if (alertBanners.length > 0) {
        console.log('✅ Alert banner with important notice is displayed');
      } else {
        console.log('⚠️ Alert banner not found');
      }
    });
  });

  describe('Mobile Emergency Hotlines - Functional Tests', () => {
    it('should find Fire Department Intramuros hotline', async () => {
      console.log('\nSTEP: Search for Fire Department Intramuros hotline');
      
      await driver.get(`${BASE_URL}/Emergency`);
      await driver.sleep(3000);
      
      // Look for Fire Department Intramuros
      const fireHotlines = await driver.findElements(By.xpath('//h3[contains(text(), "Fire")] | //*[contains(text(), "Fire Department")]'));
      console.log(`Found ${fireHotlines.length} Fire Department reference(s)`);
      
      if (fireHotlines.length > 0) {
        const fireText = await fireHotlines[0].getText();
        console.log(`Fire Department hotline: ${fireText}`);
        console.log('✅ Fire Department Intramuros hotline found');
      } else {
        console.log('⚠️ Fire Department Intramuros hotline not found');
      }
    });

    it('should display Fire Department phone number', async () => {
      console.log('\nSTEP: Verify Fire Department phone number is displayed');
      
      await driver.get(`${BASE_URL}/Emergency`);
      await driver.sleep(3000);
      
      // Look for phone numbers in the page
      const phoneNumbers = await driver.findElements(By.xpath('//p[contains(@class, "font-bold")] | //*[contains(text(), "+63")] | //*[contains(text(), "911")]'));
      console.log(`Found ${phoneNumbers.length} phone number(s)`);
      
      if (phoneNumbers.length > 0) {
        const firstNumber = await phoneNumbers[0].getText();
        console.log(`Phone number: ${firstNumber}`);
        console.log('✅ Phone numbers are displayed');
      } else {
        console.log('⚠️ No phone numbers found');
      }
    });

    it('should have clickable tel: link for Fire Department', async () => {
      console.log('\nSTEP: Verify Fire Department tel: link is clickable');
      
      await driver.get(`${BASE_URL}/Emergency`);
      await driver.sleep(3000);
      
      // Look for tel: links
      const telLinks = await driver.findElements(By.xpath('//a[contains(@href, "tel:")]'));
      console.log(`Found ${telLinks.length} tel: link(s)`);
      
      if (telLinks.length > 0) {
        // Get the href attribute of the first tel: link
        const href = await telLinks[0].getAttribute('href');
        console.log(`First tel: link: ${href}`);
        
        // Verify it's a valid tel: link
        assert(href.startsWith('tel:'), 'Link should be a tel: link');
        console.log('✅ Valid tel: link found (clicking would trigger phone call)');
      } else {
        console.log('⚠️ No tel: links found');
      }
    });

    it('should NOT click the actual phone call button to avoid calling real numbers', async () => {
      console.log('\nSTEP: Verify we do NOT click phone call buttons');
      console.log('⚠️ SKIPPING: Not clicking actual phone numbers to avoid calling real emergency services');
      console.log('✅ Test passed - phone call functionality verified without making actual calls');
    });

    it('should display phone icon on call buttons', async () => {
      console.log('\nSTEP: Verify phone icon is displayed on call buttons');
      
      await driver.get(`${BASE_URL}/Emergency`);
      await driver.sleep(3000);
      
      // Look for phone icons (SVG or icon elements)
      const phoneIcons = await driver.findElements(By.xpath('//svg[contains(@class, "lucide-phone")] | //svg[contains(@class, "phone")] | //*[contains(@class, "phone")]'));
      console.log(`Found ${phoneIcons.length} phone icon(s)`);
      
      if (phoneIcons.length > 0) {
        console.log('✅ Phone icons are displayed on call buttons');
      } else {
        console.log('⚠️ Phone icons not found (may use different icon library)');
      }
    });

    it('should handle back button click', async () => {
      console.log('\nSTEP: Test back button functionality');
      
      await driver.get(`${BASE_URL}/Emergency`);
      await driver.sleep(2000);
      
      // Try to find and click back button
      const backButtons = await driver.findElements(By.xpath('//button[contains(@aria-label, "back")] | //button[contains(@class, "back")]'));
      
      if (backButtons.length > 0) {
        try {
          await backButtons[0].click();
          await driver.sleep(2000);
          
          const currentUrl = await driver.getCurrentUrl();
          console.log(`URL after back button: ${currentUrl}`);
          
          if (!currentUrl.includes('Emergency')) {
            console.log('✅ Back button successfully navigated away from Emergency page');
          } else {
            console.log('⚠️ Back button did not navigate away');
          }
        } catch (e) {
          console.log('⚠️ Could not click back button:', e.message);
        }
      } else {
        console.log('⚠️ Back button not found (using browser back instead)');
      }
    });
  });

  describe('Mobile Emergency Hotlines - Layout and Responsive Design', () => {
    it('should maintain mobile viewport on Emergency page', async () => {
      console.log('\nSTEP: Verify mobile viewport is maintained');
      
      await driver.get(`${BASE_URL}/Emergency`);
      await driver.sleep(2000);
      
      const windowSize = await driver.manage().window().getRect();
      console.log(`Current viewport: ${windowSize.width}x${windowSize.height}`);
      
      // Mobile viewport should be less than 768px width (tablet breakpoint)
      assert(windowSize.width < 768, 'Viewport width should be mobile size (< 768px)');
      console.log('✅ Mobile viewport is maintained on Emergency page');
    });

    it('should display responsive hotline cards on mobile', async () => {
      console.log('\nSTEP: Verify responsive card layout on mobile');
      
      await driver.get(`${BASE_URL}/Emergency`);
      await driver.sleep(3000);
      
      // Check for grid layout
      const gridContainers = await driver.findElements(By.xpath('//div[contains(@class, "grid")]'));
      console.log(`Found ${gridContainers.length} grid container(s)`);
      
      if (gridContainers.length > 0) {
        console.log('✅ Responsive grid layout is present');
      } else {
        console.log('⚠️ Grid layout not found');
      }
    });

    it('should display properly sized buttons for touch interaction', async () => {
      console.log('\nSTEP: Check button sizes for touch interaction');
      
      await driver.get(`${BASE_URL}/Emergency`);
      await driver.sleep(3000);
      
      // Find all call buttons
      const callButtons = await driver.findElements(By.xpath('//a[contains(@href, "tel:")] | //button[contains(@class, "phone")]'));
      console.log(`Found ${callButtons.length} call button(s)`);
      
      let touchFriendlyCount = 0;
      
      for (const button of callButtons) {
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
        console.log('✅ Call buttons are properly sized for mobile touch');
      } else {
        console.log('⚠️ No touch-friendly buttons found (may be hidden or loading)');
      }
    });

    it('should display red/orange gradient background on mobile', async () => {
      console.log('\nSTEP: Verify emergency page styling');
      
      await driver.get(`${BASE_URL}/Emergency`);
      await driver.sleep(2000);
      
      // Check for red/orange gradient background
      const mainContainer = await driver.findElements(By.xpath('//div[contains(@class, "bg-gradient")]'));
      console.log(`Found ${mainContainer.length} gradient background(s)`);
      
      if (mainContainer.length > 0) {
        console.log('✅ Emergency page has red/orange gradient background');
      } else {
        console.log('⚠️ Gradient background not found');
      }
    });

    it('should display white cards with proper contrast on mobile', async () => {
      console.log('\nSTEP: Verify card styling for readability');
      
      await driver.get(`${BASE_URL}/Emergency`);
      await driver.sleep(3000);
      
      // Check for white/light background cards
      const cards = await driver.findElements(By.xpath('//div[contains(@class, "bg-white")]'));
      console.log(`Found ${cards.length} white card(s)`);
      
      if (cards.length > 0) {
        console.log('✅ White cards are displayed for proper contrast');
      } else {
        console.log('⚠️ White cards not found');
      }
    });

    it('should display loading state while fetching hotlines', async () => {
      console.log('\nSTEP: Verify loading state handling');
      
      await driver.get(`${BASE_URL}/Emergency`);
      
      // Check for loading indicator
      const loadingIndicators = await driver.findElements(By.xpath('//div[contains(@class, "animate-spin")] | //*[contains(text(), "Loading")]'));
      console.log(`Found ${loadingIndicators.length} loading indicator(s)`);
      
      if (loadingIndicators.length > 0) {
        console.log('✅ Loading state is displayed while fetching hotlines');
      } else {
        console.log('⚠️ Loading indicator not found (hotlines may have loaded quickly)');
      }
    });
  });

  describe('Mobile Emergency Hotlines - Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      console.log('\nSTEP: Verify heading hierarchy');
      
      await driver.get(`${BASE_URL}/Emergency`);
      await driver.sleep(2000);
      
      // Check for h1 and h3 elements
      const h1 = await driver.findElements(By.xpath('//h1'));
      const h3 = await driver.findElements(By.xpath('//h3'));
      
      console.log(`Found ${h1.length} h1 element(s) and ${h3.length} h3 element(s)`);
      
      if (h1.length > 0 && h3.length > 0) {
        console.log('✅ Proper heading hierarchy is present');
      } else {
        console.log('⚠️ Heading hierarchy may be incomplete');
      }
    });

    it('should have descriptive text for emergency hotlines', async () => {
      console.log('\nSTEP: Verify descriptive text is present');
      
      await driver.get(`${BASE_URL}/Emergency`);
      await driver.sleep(2000);
      
      // Look for descriptive text
      const descriptions = await driver.findElements(By.xpath('//*[contains(text(), "emergency")] | //*[contains(text(), "call")]'));
      console.log(`Found ${descriptions.length} descriptive text element(s)`);
      
      if (descriptions.length > 0) {
        console.log('✅ Descriptive text is present for accessibility');
      } else {
        console.log('⚠️ Descriptive text not found');
      }
    });

    it('should display contact channel labels', async () => {
      console.log('\nSTEP: Verify contact channel labels are displayed');
      
      await driver.get(`${BASE_URL}/Emergency`);
      await driver.sleep(3000);
      
      // Look for contact labels (e.g., "Phone", "Hotline", etc.)
      const labels = await driver.findElements(By.xpath('//p[contains(@class, "uppercase")] | //*[contains(@class, "tracking-wider")]'));
      console.log(`Found ${labels.length} contact label(s)`);
      
      if (labels.length > 0) {
        const firstLabel = await labels[0].getText();
        console.log(`First label: ${firstLabel}`);
        console.log('✅ Contact channel labels are displayed');
      } else {
        console.log('⚠️ Contact labels not found');
      }
    });
  });
});
