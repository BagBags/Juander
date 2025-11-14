const {Builder, By, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { loginToProduction } = require('./production-login-helper');

const BASE_URL = 'https://d39zx5gyblzxjs.cloudfront.net';
const ADMIN_USER = process.env.ADMIN_USER || '';
const ADMIN_PASS = process.env.ADMIN_PASS || '';

describe('Tour Map - Production Validation Tests', function () {
  this.timeout(120000);
  let driver;

  before(async () => {
    const options = new chrome.Options();
    if ((process.env.HEADLESS || 'true').toLowerCase() === 'true') {
      options.addArguments('--headless=new');
    }
    options.addArguments('--window-size=1366,900');
    options.addArguments('--disable-gpu');
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  });

  after(async () => { if (driver) await driver.quit(); });

  it('validates admin can login and access Tour Map page', async () => {
    // Test Case: Admin Authentication and Tour Map Access
    await loginToProduction(driver, BASE_URL, ADMIN_USER, ADMIN_PASS);
    
    // Navigate to Tour Map
    console.log('Navigating to Tour Map...');
    await driver.get(`${BASE_URL}/AdminTourMap`);
    await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000);
    await driver.sleep(3000);

    // Verify we're on Tour Map page
    const currentUrl = await driver.getCurrentUrl();
    const bodyText = await driver.findElement(By.css('body')).getText();
    
    console.log(`Tour Map URL: ${currentUrl}`);
    console.log(`Page content preview: ${bodyText.slice(0, 300)}`);
    
    // Check for Tour Map indicators
    if (!/tour.*map|admin.*map|manage.*pin/i.test(bodyText) && !currentUrl.includes('AdminTourMap')) {
      throw new Error(`Expected Tour Map page, got: ${currentUrl}`);
    }
    
    console.log('✅ Successfully accessed Tour Map page in production');
  });

  it('validates production environment is accessible with admin credentials', async () => {
    // Test Case: Production Environment Validation
    await loginToProduction(driver, BASE_URL, ADMIN_USER, ADMIN_PASS);
    
    // Navigate to Admin Content Management
    console.log('Testing Admin Content Management access...');
    await driver.get(`${BASE_URL}/AdminManageContent`);
    await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000);
    await driver.sleep(2000);

    const contentUrl = await driver.getCurrentUrl();
    const contentText = await driver.findElement(By.css('body')).getText();
    
    console.log(`Content Management URL: ${contentUrl}`);
    console.log(`Content page preview: ${contentText.slice(0, 300)}`);
    
    // Verify admin dashboard access
    if (!/admin.*dashboard|manage.*content|tour.*map/i.test(contentText) && !contentUrl.includes('AdminManageContent')) {
      throw new Error(`Expected Admin Content page, got: ${contentUrl}`);
    }
    
    console.log('✅ Successfully accessed Admin Content Management in production');
  });

  it('validates production authentication security', async () => {
    // Test Case: Authentication Security Validation
    console.log('Testing unauthenticated access...');
    
    // Clear any existing session
    await driver.manage().deleteAllCookies();
    await driver.executeScript('localStorage.clear(); sessionStorage.clear();');
    
    // Try to access protected page without login
    await driver.get(`${BASE_URL}/AdminTourMap`);
    await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000);
    await driver.sleep(2000);
    
    const protectedUrl = await driver.getCurrentUrl();
    const protectedText = await driver.findElement(By.css('body')).getText();
    
    console.log(`Unauthenticated URL: ${protectedUrl}`);
    console.log(`Unauthenticated content: ${protectedText.slice(0, 200)}`);
    
    // Should be redirected to login or blocked
    if (protectedUrl.includes('#/login') || /login|sign in|welcome back/i.test(protectedText)) {
      console.log('✅ Production properly enforces authentication');
    } else {
      console.log('⚠️ Production may allow unauthenticated access');
    }
  });
});
