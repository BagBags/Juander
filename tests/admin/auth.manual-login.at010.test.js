const {Builder, By, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// Base URL points to CloudFront production by default
const BASE_URL = (process.env.BASE_URL || 'https://d39zx5gyblzxjs.cloudfront.net').replace(/\/$/, '');
const HEADLESS = (process.env.HEADLESS || 'true').toLowerCase() === 'true';

// AT-010 manual test data (uses admin credentials by default)
// Prefer ADMIN_USER / ADMIN_PASS env vars, with fallback to known admin account
const MANUAL_USER_EMAIL = process.env.ADMIN_USER || process.env.MANUAL_USER_EMAIL || 'juander714@gmail.com';
const MANUAL_USER_PASS = process.env.ADMIN_PASS || process.env.MANUAL_USER_PASS || 'Admin1234!';

/**
 * AT-010: Valid Manual Login (Automated)
 * Mirrors manual test steps:
 * 1. Enter Email
 * 2. Enter Password
 * 3. Click "Login"
 * Expected: User is authenticated and redirected to their dashboard.
 */

describe('Authentication  Manual Login (AT-010)', function () {
  this.timeout(60000);
  let driver;

  before(async () => {
    const options = new chrome.Options();
    if (HEADLESS) {
      options.addArguments('--headless=new');
    }
    options.addArguments('--window-size=1280,800');
    options.addArguments('--disable-gpu');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });

  after(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  it('AT-010: Valid Manual Login redirects user to their dashboard', async () => {
    if (!MANUAL_USER_EMAIL || !MANUAL_USER_PASS) {
      throw new Error('MANUAL_USER_EMAIL and MANUAL_USER_PASS (or default AT-010 credentials) must be set');
    }

    // Step 1: Navigate to login page (CloudFront)
    await driver.get(`${BASE_URL}/#/login`);
    await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000);
    await driver.sleep(1000);

    // Step 2: Enter Email
    const emailInput = await driver.wait(
      until.elementLocated(By.css('#login-email, input[type="email"]')),
      10000
    );
    await emailInput.clear();
    await emailInput.sendKeys(MANUAL_USER_EMAIL);

    // Step 3: Enter Password
    const passwordInput = await driver.wait(
      until.elementLocated(By.css('#login-password, input[type="password"]')),
      10000
    );
    await passwordInput.clear();
    await passwordInput.sendKeys(MANUAL_USER_PASS);

    // Step 4: Click "Login"
    let loginButton;
    const buttons = await driver.findElements(By.css('button, input[type="submit"]'));
    for (const btn of buttons) {
      const type = (await btn.getAttribute('type').catch(() => '')) || '';
      const text = (await btn.getText().catch(() => '')) || '';
      if (type === 'submit' || /login/i.test(text)) {
        loginButton = btn;
        break;
      }
    }

    if (!loginButton) {
      throw new Error('Login button not found on login page');
    }

    await loginButton.click();

    // Step 5: Verify user is authenticated and redirected off the login page
    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      const bodyText = await driver.findElement(By.css('body')).getText();

      const stillOnLoginUrl = /\/login|#\/login/i.test(url);
      const stillShowingLoginCopy = /Welcome Back.*Login to continue/i.test(bodyText);

      return !stillOnLoginUrl && !stillShowingLoginCopy;
    }, 20000);

    const finalUrl = await driver.getCurrentUrl();
    const finalBody = await driver.findElement(By.css('body')).getText();

    // Generic dashboard assertion: not on login, and content suggests a home/dashboard page
    const onDashboard =
      /home|dashboard|welcome/i.test(finalBody) ||
      /dashboard|home/i.test(finalUrl);

    if (!onDashboard) {
      throw new Error(`Expected to be on user dashboard after login, but got URL: ${finalUrl}`);
    }

    console.log(`✅ AT-010: User successfully logged in and redirected to dashboard (${finalUrl})`);
  });
});
