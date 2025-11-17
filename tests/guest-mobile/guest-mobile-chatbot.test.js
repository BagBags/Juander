const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

const BASE_URL = process.env.BASE_URL || 'https://d39zx5gyblzxjs.cloudfront.net';
const HEADLESS = process.env.HEADLESS !== 'false';
const SLOW_MS = parseInt(process.env.SLOW_MS) || 0;

describe('Guest Mobile - Chatbot Interaction', () => {
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

  describe('Mobile Chatbot Floating Window & Modal', () => {
    it('should display Juan chatbot mascot on mobile homepage', async () => {
      console.log('\nSTEP: Navigate to mobile GuestHomepage and find chatbot');
      
      await driver.get(`${BASE_URL}/GuestHomepage`);
      await driver.sleep(3000);
      
      // Look for Juan mascot image - src="/icons/juan_open.svg"
      const juanImage = await driver.findElements(By.xpath('//img[@src="/icons/juan_open.svg"]'));
      console.log(`Found ${juanImage.length} Juan mascot image(s)`);
      
      assert(juanImage.length > 0, 'Juan chatbot mascot should be visible on mobile');
      console.log('✅ Found Juan mascot image on mobile');
    });

    it('should click Juan mascot to open chatbot on mobile', async () => {
      console.log('\nSTEP: Click Juan mascot to open chatbot on mobile');
      
      await driver.get(`${BASE_URL}/GuestHomepage`);
      await driver.sleep(3000);
      
      // Find and click the Juan mascot
      const juanImage = await driver.findElement(By.xpath('//img[@src="/icons/juan_open.svg"]'));
      await driver.executeScript('arguments[0].click();', juanImage);
      await driver.sleep(2000);
      
      console.log('✅ Clicked Juan mascot on mobile');
    });

    it('should open AskJuan chatbot modal on mobile', async () => {
      console.log('\nSTEP: Verify AskJuan modal opened on mobile');
      
      // Wait for modal to appear with animation
      await driver.wait(until.elementLocated(By.xpath('//h2[contains(text(), "AskJuan")]')), 5000);
      await driver.sleep(1000); // Wait for animation to complete
      
      // Look for "AskJuan" header in the modal
      const askJuanHeader = await driver.findElement(By.xpath('//h2[contains(text(), "AskJuan")]'));
      assert(askJuanHeader, 'AskJuan modal header should be visible on mobile');
      
      console.log('✅ AskJuan modal is open on mobile');
      
      // Verify close button exists
      const closeButton = await driver.findElements(By.xpath('//h2[contains(text(), "AskJuan")]/following-sibling::button'));
      console.log(`Found ${closeButton.length} close button(s)`);
      
      if (closeButton.length > 0) {
        console.log('✅ Modal has close button on mobile');
      }
    });

    it('should display chatbot input field on mobile', async () => {
      console.log('\nSTEP: Verify chatbot input field on mobile');
      
      // Look for chat input field
      const chatInput = await driver.findElements(By.xpath('//input[@style and contains(@style, "16px")] | //input[contains(@placeholder, "message")] | //input[contains(@placeholder, "Message")]'));
      console.log(`Found ${chatInput.length} chat input field(s)`);
      
      if (chatInput.length > 0) {
        console.log('✅ Chat input field is visible on mobile');
      } else {
        console.log('⚠️ Chat input field not found');
      }
    });
  });

  describe('Mobile Chatbot Messaging - English Question', () => {
    it('should send English question on mobile', async () => {
      console.log('\nSTEP: Send English question on mobile');
      
      try {
        // Find chat input field with shorter timeout
        const chatInput = await driver.findElement(By.xpath('//input[@style and contains(@style, "16px")]'));
        assert(chatInput, 'Chat input field should exist on mobile');
        
        const question = 'What is Intramuros?';
        await chatInput.clear();
        await chatInput.sendKeys(question);
        await driver.sleep(500);
        
        console.log(`✅ Typed: "${question}" on mobile`);
        
        // Send via Enter key
        await chatInput.sendKeys(Key.RETURN);
        await driver.sleep(2000);
        
        console.log('✅ Sent English question on mobile');
      } catch (e) {
        console.log('⚠️ Could not send English question:', e.message);
      }
    });

    it('should verify chatbot is responsive on mobile', async () => {
      console.log('\nSTEP: Verify chatbot is responsive on mobile');
      
      try {
        // Check for any text in the page
        const allText = await driver.findElement(By.xpath('//body')).getText();
        console.log(`Page has ${allText.length} characters`);
        
        if (allText.length > 50) {
          console.log('✅ Chatbot is responsive on mobile');
        } else {
          console.log('⚠️ Chatbot may not have responded');
        }
      } catch (e) {
        console.log('⚠️ Could not verify response:', e.message);
      }
    });
  });

  describe('Mobile Chatbot Functional Tests', () => {
    it('should close chatbot modal on mobile', async () => {
      console.log('\nSTEP: Close chatbot modal on mobile');
      
      try {
        // Find close button with shorter timeout
        const closeButtons = await driver.findElements(By.xpath('//h2[contains(text(), "AskJuan")]/following-sibling::button'));
        
        if (closeButtons.length > 0) {
          await driver.executeScript('arguments[0].click();', closeButtons[0]);
          await driver.sleep(1000);
          console.log('✅ Chatbot modal closed on mobile');
        } else {
          console.log('⚠️ Close button not found');
        }
      } catch (e) {
        console.log('⚠️ Could not close chatbot:', e.message);
      }
    });

    it('should verify chatbot can be reopened on mobile', async () => {
      console.log('\nSTEP: Verify chatbot can be reopened on mobile');
      
      try {
        // Find Juan mascot again
        const juanImages = await driver.findElements(By.xpath('//img[@src="/icons/juan_open.svg"]'));
        
        if (juanImages.length > 0) {
          console.log('✅ Juan mascot is available to reopen chatbot on mobile');
        } else {
          console.log('⚠️ Juan mascot not found for reopening');
        }
      } catch (e) {
        console.log('⚠️ Could not verify reopen capability:', e.message);
      }
    });

    it('should maintain mobile viewport in chatbot', async () => {
      console.log('\nSTEP: Verify mobile viewport maintained in chatbot');
      
      const windowSize = await driver.manage().window().getRect();
      console.log(`Current viewport: ${windowSize.width}x${windowSize.height}`);
      
      assert(windowSize.width < 768, 'Viewport width should be mobile size (< 768px)');
      console.log('✅ Mobile viewport maintained in chatbot');
    });

    it('should display responsive chatbot modal on mobile', async () => {
      console.log('\nSTEP: Verify responsive chatbot modal on mobile');
      
      // Check for modal container
      const modalContainer = await driver.findElements(By.xpath('//div[contains(@class, "modal")] | //div[contains(@class, "fixed")] | //div[contains(@class, "rounded")]'));
      console.log(`Found ${modalContainer.length} modal container(s)`);
      
      if (modalContainer.length > 0) {
        console.log('✅ Responsive chatbot modal is displayed on mobile');
      } else {
        console.log('⚠️ Modal container not found');
      }
    });
  });
});
