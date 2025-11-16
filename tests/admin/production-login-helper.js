const {By, until} = require('selenium-webdriver');

async function loginToProduction(driver, baseUrl, adminUser, adminPass) {
  // Navigate to the login URL (path-based routing)
  console.log(`Navigating to: ${baseUrl}/login`);
  await driver.get(`${baseUrl}/login`);
  await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000);
  await driver.sleep(2000); // Give more time for React to load

  // Check if we're on login page
  const currentUrl = await driver.getCurrentUrl();
  const bodyText = await driver.findElement(By.css('body')).getText();
  console.log(`Current URL: ${currentUrl}`);
  console.log(`Page content: ${bodyText.slice(0, 300)}`);
  
  // If we're already authenticated (redirected to an admin page), skip re-login
  const looksAuthenticated = /Admin Home|Logged in as|Admin Dashboard/i.test(bodyText) ||
                             /\/Admin(Home|ManageContent|TourMap|Photobooth)/i.test(currentUrl);
  if (looksAuthenticated) {
    console.log('Already authenticated; skipping login.');
    return;
  }
  
  if (!/login|sign in|email|password/i.test(bodyText)) {
    throw new Error(`Not on login page. URL: ${currentUrl}, Content: ${bodyText.slice(0, 200)}`);
  }

  if (!adminUser || !adminPass) {
    throw new Error('ADMIN_USER and ADMIN_PASS environment variables must be set');
  }

  // Debug: List all inputs and buttons
  const allInputs = await driver.findElements(By.css('input'));
  console.log(`Found ${allInputs.length} inputs`);
  let allButtons = await driver.findElements(By.css('button'));
  console.log(`Found ${allButtons.length} buttons`);

  // Fill email using production selector
  console.log('Looking for email input...');
  const emailInput = await driver.wait(until.elementLocated(By.css('#login-email')), 10000);
  await emailInput.clear();
  await emailInput.sendKeys(adminUser);
  console.log('Email filled');

  // Fill password using production selector  
  console.log('Looking for password input...');
  const passwordInput = await driver.wait(until.elementLocated(By.css('#login-password')), 10000);
  await passwordInput.clear();
  await passwordInput.sendKeys(adminPass);
  console.log('Password filled');

  // Click login button robustly by visible text
  console.log('Looking for login button...');

  // Prefer an XPath that matches button by its text content
  let loginButton;
  try {
    loginButton = await driver.wait(
      until.elementLocated(By.xpath("//button[normalize-space(text())='Login']")),
      10000
    );
  } catch (_) {
    // Fallback: scan all buttons and match by text contains 'Login'
    allButtons = await driver.findElements(By.css('button'));
    for (let i = 0; i < allButtons.length; i++) {
      const btn = allButtons[i];
      const text = (await btn.getText().catch(() => '')) || '';
      const type = await btn.getAttribute('type').catch(() => '');
      console.log(`Button ${i + 1}: type="${type}", text="${text}"`);
      if (/^\s*Login\s*$/i.test(text)) {
        loginButton = btn;
        console.log(`Found login button at index ${i + 1}`);
        break;
      }
    }
  }

  if (!loginButton) {
    throw new Error('Could not find the Login button');
  }

  await loginButton.click();

  // Wait for login to complete: token present in localStorage and navigated away from /login
  await driver.wait(async () => {
    const url = await driver.getCurrentUrl();
    const token = await driver.executeScript('return window.localStorage.getItem("token")');
    const hasLeftLogin = !/\/login(\b|#|\?)/i.test(url);
    return !!token && hasLeftLogin;
  }, 20000).catch(() => {
    throw new Error('Login did not complete within timeout (no token detected or still on /login)');
  });

  console.log('✅ Successfully logged into production');
}

module.exports = { loginToProduction };
