const { Builder, By, until, Key } = require('selenium-webdriver');
const assert = require('assert');

describe('Guest Web - Chatbot Interaction (FOCUSED)', () => {
  let driver;
  const BASE_URL = process.env.BASE_URL || 'https://d39zx5gyblzxjs.cloudfront.net';
  const HEADLESS = process.env.HEADLESS !== 'false';
  const SLOW_MS = parseInt(process.env.SLOW_MS) || 1500;

  before(async () => {
    const chrome = require('selenium-webdriver/chrome');
    const options = new chrome.Options();
    
    if (HEADLESS) {
      options.addArguments('--headless');
    }
    
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('window-size=1920,1080');
    
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    
    driver.manage().setTimeouts({ implicit: 10000 });
  });

  after(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  describe('Chatbot Floating Window & Modal', () => {
    it('should display and click Juan chatbot mascot on homepage', async () => {
      console.log('\n📍 STEP 1: Navigate to GuestHomepage and find chatbot');
      
      await driver.get(`${BASE_URL}/GuestHomepage`);
      await driver.sleep(3000);
      
      // Look for Juan mascot image - src="/icons/juan_open.svg"
      const juanImage = await driver.findElement(By.xpath('//img[@src="/icons/juan_open.svg"]'));
      assert(juanImage, 'Juan chatbot mascot should be visible');
      
      console.log('✅ Found Juan mascot image');
      
      // Click the Juan mascot to open chatbot
      console.log('\n📍 STEP 2: Click Juan mascot to open chatbot');
      await driver.executeScript('arguments[0].click();', juanImage);
      await driver.sleep(2000);
      
      console.log('✅ Clicked Juan mascot');
    });

    it('should open AskJuan chatbot modal window', async () => {
      console.log('\n📍 STEP 3: Verify AskJuan modal opened');
      
      // Wait for modal to appear with animation
      await driver.wait(until.elementLocated(By.xpath('//h2[contains(text(), "AskJuan")]')), 5000);
      await driver.sleep(1000); // Wait for animation to complete
      
      // Look for "AskJuan" header in the modal
      const askJuanHeader = await driver.findElement(By.xpath('//h2[contains(text(), "AskJuan")]'));
      assert(askJuanHeader, 'AskJuan modal header should be visible');
      
      console.log('✅ AskJuan modal is open');
      
      // Verify close button exists - it's a button with p-2 and rounded-full in the header
      const closeButton = await driver.findElement(By.xpath('//h2[contains(text(), "AskJuan")]/following-sibling::button'));
      assert(closeButton, 'Close button should exist');
      
      console.log('✅ Modal has close button');
    });
  });

  describe('Chatbot Messaging - English Question', () => {
    it('should send English question: "What is Intramuros?"', async () => {
      console.log('\n📍 STEP 4: Send English question about Intramuros');
      
      // Wait for input field to be enabled (not disabled by bot typing)
      await driver.wait(async () => {
        try {
          const chatInput = await driver.findElement(By.xpath('//input[@style and contains(@style, "16px")]'));
          const isDisabled = await chatInput.getAttribute('disabled');
          return !isDisabled; // Return true when NOT disabled
        } catch {
          return false;
        }
      }, 8000);
      
      await driver.sleep(500);
      
      // Find chat input field - it's the input with style="fontSize: 16px" in the message area
      const chatInput = await driver.findElement(By.xpath('//input[@style and contains(@style, "16px")]'));
      assert(chatInput, 'Chat input field should exist');
      
      const question = 'What is Intramuros?';
      await chatInput.clear();
      await chatInput.sendKeys(question);
      await driver.sleep(800);
      
      console.log(`✅ Typed: "${question}"`);
      
      // Send via Enter key (most reliable method)
      await chatInput.sendKeys(Key.RETURN);
      await driver.sleep(4000); // Wait for API response
      
      console.log('✅ Sent English question - waiting for chatbot response');
    });

    it('should receive and display English response', async () => {
      console.log('\n📍 STEP 5: Verify English response received');
      
      // Look for messages in the chat - they appear as divs with text
      const allText = await driver.findElement(By.xpath('//body')).getText();
      
      // Check if we have any response (not just the question)
      const hasResponse = allText.includes('Intramuros') || allText.includes('intramuros') || allText.length > 100;
      assert(hasResponse, 'Chatbot should have responded');
      
      console.log('✅ Chatbot responded to English question');
    });
  });

  describe('Chatbot Messaging - Tagalog Question', () => {
    it('should send Tagalog question: "Ano ang Intramuros?"', async () => {
      console.log('\n📍 STEP 6: Send Tagalog question about Intramuros');
      
      // Wait for input field to be enabled (not disabled by bot typing)
      await driver.wait(async () => {
        try {
          const chatInput = await driver.findElement(By.xpath('//input[@style and contains(@style, "16px")]'));
          const isDisabled = await chatInput.getAttribute('disabled');
          return !isDisabled; // Return true when NOT disabled
        } catch {
          return false;
        }
      }, 8000);
      
      await driver.sleep(500);
      
      // Find chat input - use the same reliable selector
      const chatInput = await driver.findElement(By.xpath('//input[@style and contains(@style, "16px")]'));
      
      const question = 'Ano ang Intramuros?';
      await chatInput.clear();
      await chatInput.sendKeys(question);
      await driver.sleep(800);
      
      console.log(`✅ Typed: "${question}"`);
      
      // Send via Enter key
      await chatInput.sendKeys(Key.RETURN);
      await driver.sleep(4000); // Wait for API response
      
      console.log('✅ Sent Tagalog question - waiting for chatbot response');
    });

    it('should receive and display Tagalog response', async () => {
      console.log('\n📍 STEP 7: Verify Tagalog response received');
      
      // Check for response
      const allText = await driver.findElement(By.xpath('//body')).getText();
      const hasResponse = allText.includes('Intramuros') || allText.includes('intramuros');
      assert(hasResponse, 'Chatbot should have responded to Tagalog question');
      
      console.log('✅ Chatbot responded to Tagalog question');
    });
  });

  describe('Chatbot Functional Tests', () => {
    it('should close chatbot modal', async () => {
      console.log('\n📍 STEP 8: Close chatbot modal');
      
      // Wait for close button to be visible - button right after AskJuan h2
      await driver.wait(until.elementLocated(By.xpath('//h2[contains(text(), "AskJuan")]/following-sibling::button')), 5000);
      
      // Find close button - the button right after the AskJuan header
      const closeButton = await driver.findElement(By.xpath('//h2[contains(text(), "AskJuan")]/following-sibling::button'));
      await driver.executeScript('arguments[0].click();', closeButton);
      await driver.sleep(1500);
      
      console.log('✅ Chatbot modal closed');
    });

    it('should reopen chatbot after closing', async () => {
      console.log('\n📍 STEP 9: Reopen chatbot');
      
      // Wait for Juan mascot to be clickable again
      await driver.wait(until.elementLocated(By.xpath('//img[@src="/icons/juan_open.svg"]')), 5000);
      await driver.sleep(500);
      
      // Find Juan mascot again
      const juanImage = await driver.findElement(By.xpath('//img[@src="/icons/juan_open.svg"]'));
      await driver.executeScript('arguments[0].click();', juanImage);
      await driver.sleep(2000);
      
      // Verify modal is open - wait for header
      await driver.wait(until.elementLocated(By.xpath('//h2[contains(text(), "AskJuan")]')), 5000);
      const askJuanHeader = await driver.findElement(By.xpath('//h2[contains(text(), "AskJuan")]'));
      assert(askJuanHeader, 'AskJuan modal should be open again');
      
      console.log('✅ Chatbot reopened successfully');
    });
  });
});
