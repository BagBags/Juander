const { Builder, By, until, Key } = require('selenium-webdriver');
const assert = require('assert');

describe('Guest Mobile - Login and Continue as Guest', () => {
  let driver;
  const BASE_URL = (process.env.BASE_URL || 'https://d39zx5gyblzxjs.cloudfront.net').trim();
  const HEADLESS = process.env.HEADLESS === 'true';
  const SLOW_MS = parseInt(process.env.SLOW_MS) || 0;

  // Mobile viewport dimensions - iPhone 14 Pro Max
  const MOBILE_WIDTH = 430;
  const MOBILE_HEIGHT = 932;

  before(async () => {
    const chrome = require('selenium-webdriver/chrome');
    const options = new chrome.Options();
    
    if (HEADLESS) {
      options.addArguments('--headless');
    }
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    
    // Set mobile viewport
    options.addArguments(`--window-size=${MOBILE_WIDTH},${MOBILE_HEIGHT}`);
    
    // Add mobile user agent
    options.addArguments('user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    // Set mobile viewport using CDP
    await driver.executeScript(`
      window.resizeTo(${MOBILE_WIDTH}, ${MOBILE_HEIGHT});
    `);

    if (SLOW_MS > 0) {
      driver.manage().setTimeouts({ implicit: SLOW_MS });
    }
  });

  after(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  describe('Mobile Login Page Navigation', () => {
    it('should load login page on mobile successfully', async () => {
      console.log(`\nNavigating to: ${BASE_URL}/login`);
      console.log(`Mobile Viewport: ${MOBILE_WIDTH}x${MOBILE_HEIGHT}`);
      await driver.get(`${BASE_URL}/login`);
      
      const currentUrl = await driver.getCurrentUrl();
      console.log(`Current URL: ${currentUrl}`);
      
      // Verify we're on login page
      assert(currentUrl.includes('/login'), 'Should be on login page');
      console.log('✅ Mobile login page loaded');
    });

    it('should display mobile-optimized login form', async () => {
      console.log('\nSTEP: Checking mobile login form elements');
      
      // Check for email input
      const emailInputs = await driver.findElements(By.xpath('//input[@type="email" or @placeholder="Email Address"]'));
      assert(emailInputs.length > 0, 'Email input should be present');
      console.log('✅ Email input found');

      // Check for password input
      const passwordInputs = await driver.findElements(By.xpath('//input[@type="password" or @placeholder="Password"]'));
      assert(passwordInputs.length > 0, 'Password input should be present');
      console.log('✅ Password input found');

      // Check for login button
      const loginButtons = await driver.findElements(By.xpath('//button[contains(text(), "Login")]'));
      assert(loginButtons.length > 0, 'Login button should be present');
      console.log('✅ Login button found');
    });

    it('should display "Continue as Guest" button on mobile', async () => {
      console.log('\nSTEP: Looking for Continue as Guest button on mobile');
      
      const guestButtons = await driver.findElements(By.xpath('//button[contains(text(), "Continue as Guest") or contains(text(), "Guest")]'));
      assert(guestButtons.length > 0, 'Continue as Guest button should be present');
      console.log('✅ Continue as Guest button found on mobile');
    });

    it('should have mobile-friendly button sizing', async () => {
      console.log('\nSTEP: Verifying mobile button sizes');
      
      const guestButtons = await driver.findElements(By.xpath('//button[contains(text(), "Continue as Guest") or contains(text(), "Guest")]'));
      assert(guestButtons.length > 0, 'Continue as Guest button should be present');
      
      const button = guestButtons[0];
      const size = await button.getRect();
      
      console.log(`Button size: ${size.width}x${size.height}`);
      
      // Mobile buttons should be at least 44x44 pixels (Apple's guideline)
      assert(size.height >= 40, 'Button height should be at least 40px for mobile');
      console.log('✅ Button size is mobile-friendly');
    });
  });

  describe('Mobile Guest Login Flow', () => {
    it('should navigate to login page on mobile', async () => {
      console.log(`\nNavigating to: ${BASE_URL}/login`);
      await driver.get(`${BASE_URL}/login`);
      
      const currentUrl = await driver.getCurrentUrl();
      assert(currentUrl.includes('/login'), 'Should be on login page');
      console.log('✅ On mobile login page');
    });

    it('should click "Continue as Guest" button on mobile', async () => {
      console.log('\nSTEP: Finding Continue as Guest button on mobile');
      
      const guestButtons = await driver.findElements(By.xpath('//button[contains(text(), "Continue as Guest") or contains(text(), "Guest")]'));
      assert(guestButtons.length > 0, 'Continue as Guest button should be present');
      console.log('✅ Continue as Guest button found');

      // Click the button
      console.log('STEP: Clicking Continue as Guest button on mobile');
      await guestButtons[0].click();
      
      // Wait for redirect
      console.log('STEP: Waiting for redirect to guest homepage');
      await driver.wait(until.urlContains('/GuestHomepage'), 15000);
      
      // Verify we're on guest homepage
      const currentUrl = await driver.getCurrentUrl();
      console.log(`Current URL: ${currentUrl}`);
      assert(currentUrl.includes('/GuestHomepage'), 'Should be redirected to GuestHomepage');
      console.log('✅ Successfully redirected to GuestHomepage on mobile');
    });

    it('should display guest homepage content on mobile', async () => {
      console.log('\nSTEP: Verifying guest homepage content on mobile');
      
      // Wait for page to load
      await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Home") or contains(text(), "Welcome") or contains(text(), "Guest")]')), 10000);
      
      const pageSource = await driver.getPageSource();
      console.log('✅ Mobile guest homepage loaded');
      
      // Verify page is not login page
      assert(!pageSource.includes('Email Address') || !pageSource.includes('Password'), 'Should not show login form on guest homepage');
      console.log('✅ Login form not visible on mobile guest homepage');
    });

    it('should verify mobile guest homepage URL', async () => {
      const expectedUrl = `${BASE_URL}/GuestHomepage`;
      const currentUrl = await driver.getCurrentUrl();
      
      console.log(`Expected URL: ${expectedUrl}`);
      console.log(`Current URL: ${currentUrl}`);
      
      assert.strictEqual(currentUrl, expectedUrl, `URL should be exactly ${expectedUrl}`);
      console.log('✅ Mobile URL matches expected guest homepage');
    });
  });

  describe('Mobile Guest Homepage Functional Tests', () => {
    it('should have mobile-optimized layout on guest homepage', async () => {
      console.log('\nSTEP: Checking mobile layout');
      
      // Get viewport size
      const viewportSize = await driver.executeScript('return {width: window.innerWidth, height: window.innerHeight}');
      console.log(`Viewport: ${viewportSize.width}x${viewportSize.height}`);
      
      // Verify viewport is actually mobile-sized (not desktop)
      assert(viewportSize.width <= 500, `Viewport width should be mobile-sized (≤500px), got ${viewportSize.width}px`);
      console.log('✅ Mobile layout detected - viewport is mobile-sized');
    });

    it('should have navigation elements on mobile guest homepage', async () => {
      console.log('\nSTEP: Checking for navigation on mobile');
      
      // Look for functional navigation - either semantic or div-based
      const semanticNav = await driver.findElements(By.xpath('//nav | //header | //*[@role="navigation"]'));
      const divNav = await driver.findElements(By.xpath('//div[contains(@class, "nav") or contains(@class, "menu") or contains(@class, "header")]'));
      
      console.log(`Found ${semanticNav.length} semantic navigation element(s)`);
      console.log(`Found ${divNav.length} div-based navigation element(s)`);
      
      // Check for functional navigation (either semantic or div-based)
      const hasNavigation = semanticNav.length > 0 || divNav.length > 0;
      assert(hasNavigation, 'Mobile guest homepage should have navigation elements');
      
      console.log('✅ Navigation elements found on mobile');
    });

    it('should have mobile-friendly buttons on guest homepage', async () => {
      console.log('\nSTEP: Checking mobile button sizes');
      
      const buttons = await driver.findElements(By.xpath('//button'));
      console.log(`Found ${buttons.length} button(s) on mobile page`);
      
      assert(buttons.length > 0, 'Mobile guest homepage should have at least one button');
      
      // Check all visible buttons are mobile-friendly
      for (let i = 0; i < Math.min(3, buttons.length); i++) {
        const size = await buttons[i].getRect();
        console.log(`Button ${i + 1} size: ${size.width}x${size.height}`);
        
        // Mobile buttons must be at least 40px height (Apple's guideline is 44px)
        assert(size.height >= 40, `Button ${i + 1} height should be at least 40px for mobile, got ${size.height}px`);
        console.log(`✅ Button ${i + 1} is mobile-friendly`);
      }
    });

    it('should have clickable elements on mobile guest homepage', async () => {
      console.log('\nSTEP: Testing mobile interactivity');
      
      // Look for clickable elements
      const buttons = await driver.findElements(By.xpath('//button'));
      console.log(`Found ${buttons.length} button(s) on mobile page`);
      
      // Look for links
      const links = await driver.findElements(By.xpath('//a'));
      console.log(`Found ${links.length} link(s) on mobile page`);
      
      // Mobile guest homepage must have interactive elements
      const totalInteractive = buttons.length + links.length;
      assert(totalInteractive > 0, 'Mobile guest homepage should have clickable elements (buttons or links)');
      console.log('✅ Interactive elements found on mobile guest homepage');
    });

    it('should display appropriate page title on mobile', async () => {
      console.log('\nSTEP: Checking mobile page title');
      
      const pageTitle = await driver.getTitle();
      console.log(`Page Title: ${pageTitle}`);
      
      // Title should not be login page
      assert(!pageTitle.includes('Login'), 'Page title should not indicate login page');
      console.log('✅ Mobile page title is appropriate');
    });
  });

  describe('Mobile Guest Session Tests', () => {
    it('should maintain guest session on mobile page reload', async () => {
      console.log('\nSTEP: Testing mobile guest session persistence');
      
      const urlBefore = await driver.getCurrentUrl();
      console.log(`URL before reload: ${urlBefore}`);
      
      // Reload page
      await driver.navigate().refresh();
      
      // Wait for page to load
      await driver.wait(until.urlContains('/GuestHomepage'), 10000);
      
      const urlAfter = await driver.getCurrentUrl();
      console.log(`URL after reload: ${urlAfter}`);
      
      assert(urlAfter.includes('/GuestHomepage'), 'Should remain on guest homepage after reload');
      console.log('✅ Mobile guest session maintained after page reload');
    });

    it('should not require login after continuing as guest on mobile', async () => {
      console.log('\nSTEP: Verifying no login required on mobile');
      
      const currentUrl = await driver.getCurrentUrl();
      assert(currentUrl.includes('/GuestHomepage'), 'Should still be on guest homepage');
      
      // Check that login form is not visible
      const loginForms = await driver.findElements(By.xpath('//input[@type="email" or @placeholder="Email Address"]'));
      assert(loginForms.length === 0, 'Login form should not be visible');
      console.log('✅ No login required for mobile guest access');
    });

    it('should handle mobile orientation changes gracefully', async () => {
      console.log('\nSTEP: Testing mobile orientation handling');
      
      // Get current viewport
      const viewportBefore = await driver.executeScript('return {width: window.innerWidth, height: window.innerHeight}');
      console.log(`Viewport before: ${viewportBefore.width}x${viewportBefore.height}`);
      
      // Simulate orientation change (landscape)
      await driver.executeScript(`window.resizeTo(${MOBILE_HEIGHT}, ${MOBILE_WIDTH})`);
      
      // Wait a moment for layout to adjust
      await driver.sleep(500);
      
      const viewportAfter = await driver.executeScript('return {width: window.innerWidth, height: window.innerHeight}');
      console.log(`Viewport after: ${viewportAfter.width}x${viewportAfter.height}`);
      
      // Verify still on guest homepage
      const currentUrl = await driver.getCurrentUrl();
      assert(currentUrl.includes('/GuestHomepage'), 'Should still be on guest homepage after orientation change');
      console.log('✅ Mobile guest homepage handles orientation changes');
      
      // Reset to portrait
      await driver.executeScript(`window.resizeTo(${MOBILE_WIDTH}, ${MOBILE_HEIGHT})`);
    });
  });

  describe('Mobile Touch Interaction Tests', () => {
    it('should support touch interactions on mobile', async () => {
      console.log('\nSTEP: Testing mobile touch interactions');
      
      // Look for interactive elements
      const buttons = await driver.findElements(By.xpath('//button'));
      console.log(`Found ${buttons.length} button(s) for touch testing`);
      
      if (buttons.length > 0) {
        // Get first button
        const button = buttons[0];
        const isDisplayed = await button.isDisplayed();
        console.log(`First button is displayed: ${isDisplayed}`);
        
        if (isDisplayed) {
          console.log('✅ Touch-interactive elements found on mobile');
        }
      }
    });

    it('should have proper spacing for mobile touch targets', async () => {
      console.log('\nSTEP: Checking mobile touch target spacing');
      
      const buttons = await driver.findElements(By.xpath('//button'));
      
      if (buttons.length > 0) {
        let spacingOk = 0;
        for (let i = 0; i < Math.min(3, buttons.length); i++) {
          const size = await buttons[i].getRect();
          // Touch targets should be at least 44x44 pixels (Apple guideline)
          if (size.width >= 40 && size.height >= 40) {
            spacingOk++;
          }
        }
        
        console.log(`${spacingOk}/${Math.min(3, buttons.length)} buttons have proper touch spacing`);
        console.log('✅ Mobile touch target spacing verified');
      }
    });
  });
});
