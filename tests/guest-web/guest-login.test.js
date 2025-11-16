const { Builder, By, until, Key } = require('selenium-webdriver');
const assert = require('assert');

describe('Guest Web - Login and Continue as Guest', () => {
  let driver;
  const BASE_URL = (process.env.BASE_URL || 'https://d39zx5gyblzxjs.cloudfront.net').trim();
  const HEADLESS = process.env.HEADLESS === 'true';
  const SLOW_MS = parseInt(process.env.SLOW_MS) || 0;

  before(async () => {
    const chrome = require('selenium-webdriver/chrome');
    const options = new chrome.Options();
    
    if (HEADLESS) {
      options.addArguments('--headless');
    }
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    if (SLOW_MS > 0) {
      driver.manage().setTimeouts({ implicit: SLOW_MS });
    }
  });

  after(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  describe('Login Page Navigation', () => {
    it('should load login page successfully', async () => {
      console.log(`\nNavigating to: ${BASE_URL}/login`);
      await driver.get(`${BASE_URL}/login`);
      
      const currentUrl = await driver.getCurrentUrl();
      console.log(`Current URL: ${currentUrl}`);
      
      // Verify we're on login page
      assert(currentUrl.includes('/login'), 'Should be on login page');
      
      // Verify page title
      const pageTitle = await driver.getTitle();
      console.log(`Page Title: ${pageTitle}`);
      assert(pageTitle.includes('Juander'), 'Page title should contain "Juander"');
    });

    it('should display login form elements', async () => {
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

    it('should display "Continue as Guest" button', async () => {
      const guestButtons = await driver.findElements(By.xpath('//button[contains(text(), "Continue as Guest") or contains(text(), "Guest")]'));
      assert(guestButtons.length > 0, 'Continue as Guest button should be present');
      console.log('✅ Continue as Guest button found');
    });
  });

  describe('Guest Login Flow', () => {
    it('should navigate to login page before testing guest flow', async () => {
      console.log(`\nNavigating to: ${BASE_URL}/login`);
      await driver.get(`${BASE_URL}/login`);
      
      const currentUrl = await driver.getCurrentUrl();
      assert(currentUrl.includes('/login'), 'Should be on login page');
      console.log('✅ On login page');
    });

    it('should click "Continue as Guest" button and redirect to guest homepage', async () => {
      console.log('\nSTEP: Finding Continue as Guest button');
      
      // Find the Continue as Guest button
      const guestButtons = await driver.findElements(By.xpath('//button[contains(text(), "Continue as Guest") or contains(text(), "Guest")]'));
      assert(guestButtons.length > 0, 'Continue as Guest button should be present');
      console.log('✅ Continue as Guest button found');

      // Click the button
      console.log('STEP: Clicking Continue as Guest button');
      await guestButtons[0].click();
      
      // Wait for redirect
      console.log('STEP: Waiting for redirect to guest homepage');
      await driver.wait(until.urlContains('/GuestHomepage'), 15000);
      
      // Verify we're on guest homepage
      const currentUrl = await driver.getCurrentUrl();
      console.log(`Current URL: ${currentUrl}`);
      assert(currentUrl.includes('/GuestHomepage'), 'Should be redirected to GuestHomepage');
      console.log('✅ Successfully redirected to GuestHomepage');
    });

    it('should display guest homepage content', async () => {
      console.log('\nSTEP: Verifying guest homepage content');
      
      // Wait for page to load
      await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Home") or contains(text(), "Welcome") or contains(text(), "Guest")]')), 10000);
      
      // Get page content
      const pageSource = await driver.getPageSource();
      console.log('✅ Page loaded successfully');
      
      // Verify page is not login page
      assert(!pageSource.includes('Email Address') || !pageSource.includes('Password'), 'Should not show login form on guest homepage');
      console.log('✅ Login form not visible on guest homepage');
    });

    it('should verify guest homepage URL is correct', async () => {
      const expectedUrl = `${BASE_URL}/GuestHomepage`;
      const currentUrl = await driver.getCurrentUrl();
      
      console.log(`Expected URL: ${expectedUrl}`);
      console.log(`Current URL: ${currentUrl}`);
      
      assert.strictEqual(currentUrl, expectedUrl, `URL should be exactly ${expectedUrl}`);
      console.log('✅ URL matches expected guest homepage');
    });
  });

  describe('Guest Homepage Functional Tests', () => {
    it('should have semantic navigation elements on guest homepage', async () => {
      console.log('\nSTEP: Checking for semantic navigation elements');
      
      // Test for REAL semantic navigation - not workarounds
      const navElements = await driver.findElements(By.xpath('//nav | //header | //*[@role="navigation"]'));
      console.log(`Found ${navElements.length} semantic navigation element(s)`);
      
      // This is a REAL requirement - semantic HTML for proper structure
      assert(navElements.length > 0, 
        'REAL ISSUE: Guest homepage is missing semantic navigation elements (<nav>, <header>, or role="navigation"). This is required for proper page structure and accessibility.');
      
      console.log('✅ Semantic navigation found');
    });

    it('should have semantic main content area on guest homepage', async () => {
      console.log('\nSTEP: Checking for semantic main content');
      
      // Test for REAL semantic main content - not workarounds
      const semanticMain = await driver.findElements(By.xpath('//main | //*[@role="main"] | //section'));
      console.log(`Found ${semanticMain.length} semantic main content element(s)`);
      
      // This is a REAL requirement - semantic HTML for proper structure
      assert(semanticMain.length > 0, 
        'REAL ISSUE: Guest homepage is missing semantic main content elements (<main>, role="main", or <section>). This is required for proper page structure and accessibility.');
      
      console.log('✅ Semantic main content found');
    });

    it('should be able to interact with guest homepage', async () => {
      console.log('\nSTEP: Testing guest homepage interactivity');
      
      // Look for clickable elements
      const buttons = await driver.findElements(By.xpath('//button'));
      console.log(`Found ${buttons.length} button(s) on page`);
      
      // Look for links
      const links = await driver.findElements(By.xpath('//a'));
      console.log(`Found ${links.length} link(s) on page`);
      
      const totalInteractive = buttons.length + links.length;
      assert(totalInteractive > 0, 'Guest homepage should have interactive elements (buttons or links)');
      console.log('✅ Interactive elements found on guest homepage');
    });

    it('should verify page title on guest homepage', async () => {
      console.log('\nSTEP: Checking page title');
      
      const pageTitle = await driver.getTitle();
      console.log(`Page Title: ${pageTitle}`);
      
      // Title should not be login page
      assert(!pageTitle.includes('Login'), 'Page title should not indicate login page');
      console.log('✅ Page title is appropriate for guest homepage');
    });
  });

  describe('Guest Session Tests', () => {
    it('should maintain guest session on page reload', async () => {
      console.log('\nSTEP: Testing guest session persistence');
      
      const urlBefore = await driver.getCurrentUrl();
      console.log(`URL before reload: ${urlBefore}`);
      
      // Reload page
      await driver.navigate().refresh();
      
      // Wait for page to load
      await driver.wait(until.urlContains('/GuestHomepage'), 10000);
      
      const urlAfter = await driver.getCurrentUrl();
      console.log(`URL after reload: ${urlAfter}`);
      
      assert(urlAfter.includes('/GuestHomepage'), 'Should remain on guest homepage after reload');
      console.log('✅ Guest session maintained after page reload');
    });

    it('should not require login after continuing as guest', async () => {
      console.log('\nSTEP: Verifying no login required');
      
      const currentUrl = await driver.getCurrentUrl();
      assert(currentUrl.includes('/GuestHomepage'), 'Should still be on guest homepage');
      
      // Check that login form is not visible
      const loginForms = await driver.findElements(By.xpath('//input[@type="email" or @placeholder="Email Address"]'));
      assert(loginForms.length === 0, 'Login form should not be visible');
      console.log('✅ No login required for guest access');
    });
  });
});
