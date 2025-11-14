const {Builder, By, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const ADMIN_URL = process.env.ADMIN_URL || (process.env.BASE_URL ? `${process.env.BASE_URL.replace(/\/$/, '')}/AdminHome` : 'https://d39zx5gyblzxjs.cloudfront.net/AdminHome');
const HEADLESS = (process.env.HEADLESS || 'true').toLowerCase() === 'true';
const ADMIN_USER = process.env.ADMIN_USER || '';
const ADMIN_PASS = process.env.ADMIN_PASS || '';

describe('Admin Authentication and Authorization', function () {
  this.timeout(120000);
  let driver;

  before(async () => {
    const options = new chrome.Options();
    if (HEADLESS) options.addArguments('--headless=new');
    options.addArguments('--window-size=1280,800');
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('enforces authentication by redirecting unauthorized users to login page', async () => {
    // Clear any existing authentication
    await driver.manage().deleteAllCookies();
    await driver.executeScript('try { localStorage.clear(); sessionStorage.clear(); } catch(e) {}');
    
    // Try to access protected admin page
    await driver.get(ADMIN_URL);
    await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000);
    await driver.sleep(2000);

    let url = await driver.getCurrentUrl();
    const body = await driver.findElement(By.css('body'));
    const text = (await body.getText()) || '';

    // Production may redirect to login or show access denied
    const isProtected = url.includes('#/login') || 
                       /login|sign in|welcome back/i.test(text) ||
                       text.includes('Access Denied');

    if (!isProtected) {
      throw new Error('Expected authentication enforcement, but unauthenticated access was allowed');
    }

    console.log('✅ Authentication properly enforced in production');
  });

  it('allows authenticated users to access AdminHome', async () => {
    if (!ADMIN_USER || !ADMIN_PASS) {
      throw new Error('ADMIN_USER and ADMIN_PASS environment variables must be set for this test to run');
    }

    await driver.get(ADMIN_URL);
    await driver.wait(async () => (await driver.executeScript('return document.readyState')) === 'complete', 20000);

    // Give SPA router a moment to redirect if needed
    await driver.sleep(500);
    let url = await driver.getCurrentUrl();

    if (/login/i.test(url)) {
      // If credentials provided, attempt login; otherwise validate login page and pass.
      if (ADMIN_USER && ADMIN_PASS) {
        // Try common selectors for email/user
        let emailEl;
        const emailSelectors = ['input[name="email"]', '#email', 'input[type="email"]', 'input[name="username"]', '#username'];
        for (const sel of emailSelectors) {
          const found = await driver.findElements(By.css(sel));
          if (found.length) { emailEl = found[0]; break; }
        }
        if (!emailEl) throw new Error('Login email/username input not found');
        await emailEl.clear();
        await emailEl.sendKeys(ADMIN_USER);

        // Try common selectors for password
        let passEl;
        const passSelectors = ['input[name="password"]', '#password', 'input[type="password"]'];
        for (const sel of passSelectors) {
          const found = await driver.findElements(By.css(sel));
          if (found.length) { passEl = found[0]; break; }
        }
        if (!passEl) throw new Error('Login password input not found');
        await passEl.clear();
        await passEl.sendKeys(ADMIN_PASS);

        // Submit: try button[type=submit] first, then any button with login text
        let submitEl;
        const btnSelectors = ['button[type="submit"]', 'input[type="submit"]', 'button'];
        for (const sel of btnSelectors) {
          const candidates = await driver.findElements(By.css(sel));
          for (const c of candidates) {
            const t = (await c.getText()).toLowerCase();
            const tag = await c.getTagName();
            if (sel.includes('submit') || /log\s*in|sign\s*in|submit/.test(t) || tag === 'input') {
              submitEl = c; break;
            }
          }
          if (submitEl) break;
        }
        if (!submitEl) throw new Error('Login submit button not found');
        await submitEl.click();

        // Wait for navigation to AdminHome or another authenticated route
        await driver.wait(async () => {
          const cur = await driver.getCurrentUrl();
          return /AdminHome/i.test(cur) || !/login/i.test(cur);
        }, 20000).catch(() => {});

        url = await driver.getCurrentUrl();
        // If still on login, attempt to surface error content
        if (/login/i.test(url)) {
          const body = await driver.findElement(By.css('body'));
          const text = (await body.getText()) || '';
          throw new Error('Login did not succeed; still on login page. Page text: ' + text.slice(0, 400));
        }
      } else {
        // Unauthenticated path without creds: verify login page is rendered
        const body = await driver.findElement(By.css('body'));
        const text = (await body.getText()) || '';
        if (!/login|sign in/i.test(text)) {
          throw new Error('Expected to be on login page after redirect, but content did not look like a login page');
        }
        return; // pass
      }
    }

    // Authenticated path (or no redirect): ensure AdminHome loaded
    const body = await driver.findElement(By.css('body'));
    const text = (await body.getText()) || '';
    const title = await driver.getTitle();
    if (!/AdminHome/i.test(url) && !(title && /admin/i.test(title)) && !/admin/i.test(text)) {
      throw new Error(`Expected AdminHome content, got URL: ${url}`);
    }
  });
});
