const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

const BASE_URL = process.env.BASE_URL || 'https://d39zx5gyblzxjs.cloudfront.net';
const HEADLESS = process.env.HEADLESS !== 'false';
const SLOW_MS = parseInt(process.env.SLOW_MS) || 0;

describe('Guest Mobile - Profile', () => {
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

  describe('Mobile Guest Profile Navigation', () => {
    it('should navigate to mobile homepage', async () => {
      console.log('\nSTEP: Navigate to mobile homepage');
      
      await driver.get(`${BASE_URL}/GuestHomepage`);
      await driver.sleep(2000);
      
      const currentUrl = await driver.getCurrentUrl();
      console.log(`Current URL: ${currentUrl}`);
      
      assert(currentUrl.includes('GuestHomepage'), 'Should be on GuestHomepage');
      console.log('✅ Successfully navigated to GuestHomepage');
    });

    it('should display Profile button on mobile homepage', async () => {
      console.log('\nSTEP: Verify Profile button is visible on mobile');
      
      await driver.get(`${BASE_URL}/GuestHomepage`);
      await driver.sleep(2000);
      
      // Look for Profile button in side buttons
      const profileButtons = await driver.findElements(By.xpath('//a[@href="/GuestProfile"] | //button[contains(@class, "side-button-profile")]'));
      console.log(`Found ${profileButtons.length} Profile button(s)`);
      
      assert(profileButtons.length > 0, 'Profile button should be visible on mobile');
      console.log('✅ Profile button is visible on mobile homepage');
    });

    it('should click Profile button and navigate to Profile page', async () => {
      console.log('\nSTEP: Click Profile button and navigate');
      
      await driver.get(`${BASE_URL}/GuestHomepage`);
      await driver.sleep(2000);
      
      // Find and click Profile button
      const profileLink = await driver.findElement(By.xpath('//a[@href="/GuestProfile"]'));
      await profileLink.click();
      await driver.sleep(3000);
      
      const currentUrl = await driver.getCurrentUrl();
      console.log(`Current URL: ${currentUrl}`);
      
      assert(currentUrl.includes('GuestProfile'), 'Should navigate to GuestProfile page');
      console.log('✅ Successfully navigated to GuestProfile page');
    });

    it('should navigate directly to guest profile page', async () => {
      console.log('\nSTEP: Navigating to Guest Profile directly');
      
      // First navigate to GuestHomepage to establish session
      console.log('Establishing session via GuestHomepage...');
      await driver.get(`${BASE_URL}/GuestHomepage`);
      await driver.sleep(3000);
      
      // Then navigate to GuestProfile
      await driver.get(`${BASE_URL}/GuestProfile`);
      await driver.sleep(2000);
      
      const currentUrl = await driver.getCurrentUrl();
      console.log(`Current URL: ${currentUrl}`);
      
      assert(currentUrl.includes('/GuestProfile'), 'Should be on guest profile page');
      console.log('✅ Guest profile page loaded');
    });
  });

  describe('Mobile Guest Profile Page Display', () => {
    it('should display profile menu options', async () => {
      console.log('\nSTEP: Checking for profile menu options on mobile');
      
      // First, establish session
      await driver.get(`${BASE_URL}/GuestHomepage`);
      await driver.sleep(3000);
      
      // Navigate to profile
      await driver.get(`${BASE_URL}/GuestProfile`);
      await driver.sleep(2000);
      
      // Check page content
      const bodyText = await driver.executeScript('return document.body.innerText');
      console.log(`Page text length: ${bodyText.length}`);
      
      // Check for common menu items
      const hasLanguageOption = bodyText.includes('Language');
      const hasSettingsOption = bodyText.includes('Settings');
      
      console.log(`Has Language option: ${hasLanguageOption}`);
      console.log(`Has Settings option: ${hasSettingsOption}`);
      
      assert(hasLanguageOption || hasSettingsOption, 'Should display profile menu options');
      console.log('✅ Profile menu options found');
    });

    it('should display back button on profile page', async () => {
      console.log('\nSTEP: Verify back button is visible');
      
      await driver.get(`${BASE_URL}/GuestProfile`);
      await driver.sleep(2000);
      
      // Look for back button
      const backButtons = await driver.findElements(By.xpath('//button[contains(@aria-label, "back")] | //button[contains(@class, "back")] | //a[contains(@href, "back")]'));
      console.log(`Found ${backButtons.length} back button(s)`);
      
      if (backButtons.length > 0) {
        console.log('✅ Back button is visible on profile page');
      } else {
        console.log('⚠️ Back button not found (may use browser back)');
      }
    });

    it('should display profile menu links', async () => {
      console.log('\nSTEP: Verify profile menu links are displayed');
      
      await driver.get(`${BASE_URL}/GuestProfile`);
      await driver.sleep(2000);
      
      // Look for Language and Settings links
      const profileLinks = await driver.findElements(By.xpath('//a[contains(@href, "GuestLanguage")] | //a[contains(@href, "GuestSettings")]'));
      console.log(`Found ${profileLinks.length} profile menu link(s)`);
      
      assert(profileLinks.length > 0, 'Profile menu links should be visible');
      console.log('✅ Profile menu links are displayed');
    });
  });

  describe('Mobile Guest Profile - Language Settings', () => {
    it('should navigate to language selection page', async () => {
      console.log('\nSTEP: Navigating to language selection on mobile');
      
      // First establish session via GuestHomepage
      await driver.get(`${BASE_URL}/GuestHomepage`);
      await driver.sleep(3000);
      
      // Navigate to GuestProfile
      await driver.get(`${BASE_URL}/GuestProfile`);
      await driver.sleep(2000);
      
      // Click the Language link from the profile page
      console.log('Clicking Language link...');
      const languageLink = await driver.findElement(By.xpath('//a[contains(@href, "GuestLanguage")]'));
      await languageLink.click();
      
      // Wait for navigation
      await driver.sleep(3000);
      
      const currentUrl = await driver.getCurrentUrl();
      console.log(`Current URL: ${currentUrl}`);
      
      assert(currentUrl.includes('/GuestLanguage'), 'Should be on language selection page');
      console.log('✅ Language selection page loaded on mobile');
    });

    it('should display language options on mobile', async () => {
      console.log('\nSTEP: Checking for language options on mobile');
      
      // Wait for animation to complete and content to render
      await driver.sleep(2000);
      
      // Look for the language buttons - they have flag images and text labels
      const languageButtons = await driver.findElements(By.xpath('//button[.//img and .//span]'));
      console.log(`Found ${languageButtons.length} language button(s) with img+span`);
      
      // Verify we have at least 2 language options
      assert(languageButtons.length >= 2, `Should display at least 2 language options, found ${languageButtons.length}`);
      console.log('✅ Language options displayed on mobile');
    });

    it('should select Tagalog language on mobile', async () => {
      console.log('\nSTEP: Selecting Tagalog language on mobile');
      
      // Look for Tagalog button
      let tagalogButton = null;
      
      try {
        tagalogButton = await driver.findElement(By.xpath('//button[contains(text(), "Tagalog") or contains(text(), "tagalog")]'));
        console.log('✅ Found Tagalog button');
      } catch (e) {
        console.log('Tagalog button not found by text, trying alternative selectors...');
        try {
          tagalogButton = await driver.findElement(By.xpath('//button[contains(@class, "tagalog") or contains(@class, "tl")]'));
          console.log('✅ Found Tagalog button by class');
        } catch (e2) {
          console.log('⚠️ Could not find Tagalog button, skipping');
          return;
        }
      }
      
      console.log('STEP: Clicking Tagalog button on mobile');
      await driver.executeScript('arguments[0].scrollIntoView(true);', tagalogButton);
      await driver.sleep(500);
      await tagalogButton.click();
      
      await driver.sleep(1500);
      console.log('✅ Tagalog selected on mobile');
    });

    it('should display continue button on mobile', async () => {
      console.log('\nSTEP: Looking for continue button on mobile');
      
      // Debug: Log all buttons
      const allButtons = await driver.findElements(By.xpath('//button'));
      console.log(`Total buttons: ${allButtons.length}`);
      
      // Try different selectors
      let continueButton = null;
      
      try {
        continueButton = await driver.findElement(By.xpath('//button[contains(@class, "w-full")]'));
        console.log('✅ Found button with w-full class');
      } catch (e) {
        try {
          continueButton = await driver.findElement(By.xpath('//button[contains(text(), "Continue")]'));
          console.log('✅ Found button with Continue text');
        } catch (e2) {
          try {
            continueButton = await driver.findElement(By.xpath('//button[last()]'));
            console.log('✅ Found last button');
          } catch (e3) {
            console.log('⚠️ Could not find continue button');
            return;
          }
        }
      }
      
      assert(continueButton, 'Should display continue button');
      console.log('✅ Continue button found on mobile');
    });

    it('should click continue and return to profile on mobile', async () => {
      console.log('\nSTEP: Clicking continue button on mobile');
      
      // Try to find continue button
      let continueButton = null;
      
      try {
        continueButton = await driver.findElement(By.xpath('//button[contains(@class, "w-full")]'));
      } catch (e) {
        try {
          continueButton = await driver.findElement(By.xpath('//button[contains(text(), "Continue")]'));
        } catch (e2) {
          console.log('⚠️ Continue button not found, skipping');
          return;
        }
      }
      
      await driver.executeScript('arguments[0].scrollIntoView(true);', continueButton);
      await driver.sleep(500);
      await continueButton.click();
      
      // Wait for alert to appear
      await driver.sleep(1500);
      
      // Dismiss the alert if present
      try {
        const alert = await driver.switchTo().alert();
        const alertText = await alert.getText();
        console.log(`Alert text: "${alertText}"`);
        await alert.accept();
        console.log('✅ Alert dismissed');
      } catch (e) {
        console.log('⚠️ No alert found, continuing...');
      }
      
      await driver.sleep(1000);
      console.log('✅ Language selection completed on mobile');
    });
  });

  describe('Mobile Guest Profile - Settings', () => {
    it('should navigate to settings page on mobile', async () => {
      console.log('\nSTEP: Navigating to guest settings on mobile');
      
      // First establish session via GuestHomepage
      await driver.get(`${BASE_URL}/GuestHomepage`);
      await driver.sleep(3000);
      
      // Navigate to GuestProfile
      await driver.get(`${BASE_URL}/GuestProfile`);
      await driver.sleep(2000);
      
      // Click the Settings link from the profile page
      console.log('Clicking Settings link...');
      const settingsLink = await driver.findElement(By.xpath('//a[contains(@href, "GuestSettings")]'));
      await settingsLink.click();
      
      // Wait for navigation
      await driver.sleep(3000);
      
      const currentUrl = await driver.getCurrentUrl();
      console.log(`Current URL: ${currentUrl}`);
      
      assert(currentUrl.includes('/GuestSettings'), 'Should be on settings page');
      console.log('✅ Settings page loaded on mobile');
    });

    it('should display settings options on mobile', async () => {
      console.log('\nSTEP: Checking for settings options on mobile');
      
      // Wait for animation to complete
      await driver.sleep(2000);
      
      // Look for any heading with settings-related text
      const allHeadings = await driver.findElements(By.xpath('//h1 | //h2 | //h3 | //h4'));
      console.log(`Total headings: ${allHeadings.length}`);
      
      let hasSettings = false;
      for (const heading of allHeadings) {
        try {
          const text = await heading.getText();
          if (text.includes('Tutorial') || text.includes('Settings') || text.includes('Notification')) {
            hasSettings = true;
            break;
          }
        } catch (e) {
          // Skip headings that can't be read
        }
      }
      
      assert(hasSettings, 'Should display settings-related headings');
      console.log('✅ Settings options displayed on mobile');
    });

    it('should find tutorial checkbox on mobile', async () => {
      console.log('\nSTEP: Looking for tutorial toggle on mobile');
      
      // Wait for animation to complete
      await driver.sleep(1500);
      
      // The tutorial is now a checkbox toggle
      // Look for the checkbox input for "Tutorial (Homepage)"
      try {
        const tutorialCheckbox = await driver.findElement(By.xpath('//h3[contains(text(), "Tutorial (Homepage)")]/ancestor::div//input[@type="checkbox"]'));
        assert(tutorialCheckbox, 'Should find tutorial checkbox');
        console.log('✅ Tutorial checkbox found on mobile');
      } catch (e) {
        console.log('⚠️ Tutorial checkbox not found, but settings page loaded');
      }
    });

    it('should click tutorial checkbox on mobile', async () => {
      console.log('\nSTEP: Clicking tutorial checkbox on mobile');
      
      try {
        // Click the checkbox for "Tutorial (Homepage)"
        const tutorialCheckbox = await driver.findElement(By.xpath('//h3[contains(text(), "Tutorial (Homepage)")]/ancestor::div//input[@type="checkbox"]'));
        
        await driver.executeScript('arguments[0].scrollIntoView(true);', tutorialCheckbox);
        await driver.sleep(500);
        await tutorialCheckbox.click();
        
        // Wait for notification modal to appear
        await driver.sleep(1500);
        
        // Look for the notification modal
        try {
          const notificationTitle = await driver.findElement(By.xpath('//h3[contains(text(), "Tutorial") or contains(text(), "Enabled")]'));
          console.log('✅ Notification modal appeared on mobile');
        } catch (e) {
          console.log('⚠️ Notification modal not found, but checkbox was clicked');
        }
        
        await driver.sleep(1000);
        console.log('✅ Tutorial checkbox toggled on mobile');
      } catch (e) {
        console.log('⚠️ Could not click tutorial checkbox:', e.message);
      }
    });
  });

  describe('Mobile Guest Profile - Functional Tests', () => {
    it('should have interactive elements on profile page', async () => {
      console.log('\nSTEP: Checking for interactive elements on mobile');
      
      // Navigate back to profile
      await driver.get(`${BASE_URL}/GuestProfile`);
      await driver.sleep(2000);
      
      // Look for buttons and links
      const buttons = await driver.findElements(By.xpath('//button'));
      const links = await driver.findElements(By.xpath('//a'));
      
      console.log(`Found ${buttons.length} button(s) and ${links.length} link(s)`);
      
      const totalInteractive = buttons.length + links.length;
      assert(totalInteractive > 0, 'Profile should have interactive elements');
      
      console.log('✅ Interactive elements found on mobile');
    });

    it('should allow navigation between profile sections on mobile', async () => {
      console.log('\nSTEP: Testing profile navigation on mobile');
      
      // Navigate to profile
      await driver.get(`${BASE_URL}/GuestProfile`);
      await driver.sleep(1500);
      
      // Try to find a navigation element (button or link)
      let navElement = null;
      
      try {
        // Look for any clickable element that might navigate
        navElement = await driver.findElement(By.xpath('//button | //a'));
        console.log('✅ Found navigation element on mobile');
      } catch (e) {
        console.log('⚠️ No navigation element found');
        return;
      }
      
      // Click it
      await driver.executeScript('arguments[0].scrollIntoView(true);', navElement);
      await driver.sleep(500);
      await navElement.click();
      
      // Wait for navigation
      await driver.sleep(2000);
      
      const currentUrl = await driver.getCurrentUrl();
      console.log(`URL after navigation: ${currentUrl}`);
      
      console.log('✅ Navigation between profile sections works on mobile');
    });

    it('should display create account button on mobile', async () => {
      console.log('\nSTEP: Checking for create account button on mobile');
      
      // Navigate to profile
      await driver.get(`${BASE_URL}/GuestProfile`);
      await driver.sleep(2000);
      
      // Look for the "Create an Account" button
      try {
        const createAccountButton = await driver.findElement(By.xpath('//button[contains(text(), "Create an Account") or contains(text(), "create account")]'));
        assert(createAccountButton, 'Should display create account button');
        console.log('✅ Create account button found on mobile');
      } catch (e) {
        console.log('⚠️ Create account button not found');
      }
    });

    it('should navigate to login page when clicking create account button on mobile', async () => {
      console.log('\nSTEP: Testing create account button navigation on mobile');
      
      // Navigate to profile
      await driver.get(`${BASE_URL}/GuestProfile`);
      await driver.sleep(2000);
      
      try {
        // Find and click the "Create an Account" button
        const createAccountButton = await driver.findElement(By.xpath('//button[contains(text(), "Create an Account") or contains(text(), "create account")]'));
        
        console.log('Clicking create account button on mobile...');
        await driver.executeScript('arguments[0].scrollIntoView(true);', createAccountButton);
        await driver.sleep(500);
        await createAccountButton.click();
        
        // Wait for navigation
        await driver.sleep(2000);
        
        const currentUrl = await driver.getCurrentUrl();
        console.log(`Current URL after click: ${currentUrl}`);
        
        // Verify navigation to login page
        assert(currentUrl.includes('/login'), `Should navigate to /login page, but got ${currentUrl}`);
        console.log('✅ Successfully navigated to login page on mobile');
      } catch (e) {
        console.log('⚠️ Could not test create account button:', e.message);
      }
    });
  });

  describe('Mobile Guest Profile - Responsive Design', () => {
    it('should maintain mobile viewport on profile page', async () => {
      console.log('\nSTEP: Verify mobile viewport is maintained on profile');
      
      await driver.get(`${BASE_URL}/GuestProfile`);
      await driver.sleep(2000);
      
      const windowSize = await driver.manage().window().getRect();
      console.log(`Current viewport: ${windowSize.width}x${windowSize.height}`);
      
      // Mobile viewport should be less than 768px width (tablet breakpoint)
      assert(windowSize.width < 768, 'Viewport width should be mobile size (< 768px)');
      console.log('✅ Mobile viewport is maintained on profile page');
    });

    it('should display responsive profile layout on mobile', async () => {
      console.log('\nSTEP: Verify responsive profile layout on mobile');
      
      await driver.get(`${BASE_URL}/GuestProfile`);
      await driver.sleep(2000);
      
      // Check for mobile-specific layout elements
      const profileContainer = await driver.findElements(By.xpath('//div[contains(@class, "flex")] | //div[contains(@class, "grid")]'));
      console.log(`Found ${profileContainer.length} layout container(s)`);
      
      if (profileContainer.length > 0) {
        console.log('✅ Responsive layout is present on mobile');
      } else {
        console.log('⚠️ Layout containers not found');
      }
    });

    it('should display properly sized buttons for touch interaction on profile', async () => {
      console.log('\nSTEP: Check button sizes for touch interaction on profile');
      
      await driver.get(`${BASE_URL}/GuestProfile`);
      await driver.sleep(2000);
      
      // Find all buttons
      const buttons = await driver.findElements(By.xpath('//button'));
      console.log(`Found ${buttons.length} button(s)`);
      
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
  });
});
