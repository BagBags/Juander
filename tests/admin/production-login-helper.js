const {By, until} = require('selenium-webdriver');

async function loginToProduction(driver, baseUrl, adminUser, adminPass) {
  // Navigate to the working login URL (hash-based routing)
  console.log(`Navigating to: ${baseUrl}/#/login`);
  await driver.get(`${baseUrl}/#/login`);
  await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000);
  await driver.sleep(2000); // Give more time for React to load

  // Check if we're on login page
  const currentUrl = await driver.getCurrentUrl();
  const bodyText = await driver.findElement(By.css('body')).getText();
  console.log(`Current URL: ${currentUrl}`);
  console.log(`Page content: ${bodyText.slice(0, 300)}`);
  
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

  // Click login button - from our discovery, Button 2 was the login button
  console.log('Looking for login button...');
  
  // Try multiple selectors based on our discovery
  let loginButton;
  const buttonSelectors = [
    'button[type="submit"]',
    'button:contains("Login")',
    '.w-full.bg-\\[\\#f04e37\\]',
    'button.w-full[type="submit"]'
  ];
  
  // Find all buttons and check their text
  allButtons = await driver.findElements(By.css('button'));
  for (let i = 0; i < allButtons.length; i++) {
    const btn = allButtons[i];
    const text = await btn.getText().catch(() => '');
    const type = await btn.getAttribute('type').catch(() => '');
    console.log(`Button ${i + 1}: type="${type}", text="${text}"`);
    
    if (text === 'Login' && type === 'submit') {
      loginButton = btn;
      console.log(`Found login button at index ${i + 1}`);
      break;
    }
  }
  
  if (!loginButton) {
    // Fallback: just click the second button (index 1) which was the login button in our discovery
    loginButton = allButtons[1];
    console.log('Using fallback: clicking second button');
  }
  
  await loginButton.click();

  // Wait for login to complete (URL should change or login form should disappear)
  await driver.wait(async () => {
    const url = await driver.getCurrentUrl();
    const text = await driver.findElement(By.css('body')).getText();
    // Login successful if we're no longer on login page or login form is gone
    return !url.includes('#/login') || !/Welcome Back.*Login to continue/i.test(text);
  }, 15000).catch(() => {
    throw new Error('Login did not complete within timeout');
  });

  console.log('✅ Successfully logged into production');
}

module.exports = { loginToProduction };
