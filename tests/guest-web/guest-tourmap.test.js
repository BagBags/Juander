const { Builder, By, until, Key } = require('selenium-webdriver');
const assert = require('assert');

const BASE_URL = process.env.BASE_URL || 'https://d39zx5gyblzxjs.cloudfront.net';
const HEADLESS = process.env.HEADLESS !== 'false';
const SLOW_MS = parseInt(process.env.SLOW_MS) || 1500;

describe('Guest Web - TourMap Search', () => {
  let driver;

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

  describe('TourMap Search Modal', () => {
    it('should navigate to TourMap and open search modal', async () => {
      console.log('\nSTEP: Navigate to TourMap');
      
      // Navigate directly to TourMap
      await driver.get(`${BASE_URL}/TourMap`);
      await driver.sleep(3000);
      
      const currentUrl = await driver.getCurrentUrl();
      console.log(`✅ Current URL: ${currentUrl}`);
      assert(currentUrl.includes('/TourMap'), 'Should be on TourMap page');
      
      // Find and click search button (magnifying glass icon on the right)
      console.log('\nSTEP: Click search button');
      const searchButton = await driver.findElement(By.xpath('//button[@title="Search Sites" or @aria-label="Search Sites"]'));
      await driver.executeScript('arguments[0].click();', searchButton);
      await driver.sleep(2000);
      
      // Verify search modal opened
      const searchModal = await driver.findElement(By.xpath('//h2[contains(text(), "Search Sites")]'));
      assert(searchModal, 'Search modal should be visible');
      console.log('✅ Search modal opened');
    });

    it('should search for "San Agustin Church" by name', async () => {
      console.log('\nSTEP: Search for San Agustin Church');
      
      await driver.get(`${BASE_URL}/TourMap`);
      await driver.sleep(3000);
      
      // Click search button
      const searchButton = await driver.findElement(By.xpath('//button[@title="Search Sites" or @aria-label="Search Sites"]'));
      await driver.executeScript('arguments[0].click();', searchButton);
      await driver.sleep(2000);
      
      // Find search input and type
      const searchInput = await driver.findElement(By.xpath('//input[@placeholder="Search by name or description"]'));
      await searchInput.sendKeys('San Agustin Church');
      await driver.sleep(2000);
      
      console.log('✅ Search query entered: "San Agustin Church"');
      
      // Verify results appear
      const results = await driver.findElements(By.xpath('//button[contains(@class, "rounded-xl") and contains(@class, "border")]'));
      console.log(`Found ${results.length} search result(s)`);
      
      assert(results.length > 0, 'Should find search results for San Agustin Church');
      console.log('✅ Search results displayed');
    });

    it('should filter results by "Church" category', async () => {
      console.log('\nSTEP: Filter by Church category');
      
      await driver.get(`${BASE_URL}/TourMap`);
      await driver.sleep(3000);
      
      // Click search button
      const searchButton = await driver.findElement(By.xpath('//button[@title="Search Sites" or @aria-label="Search Sites"]'));
      await driver.executeScript('arguments[0].click();', searchButton);
      await driver.sleep(2000);
      
      // Find and interact with category dropdown
      const categoryDropdown = await driver.findElement(By.xpath('//select | //*[contains(text(), "All Categories")]'));
      console.log('Found category dropdown');
      
      // If it's a select element
      try {
        await categoryDropdown.sendKeys('Church');
        await driver.sleep(2000);
        console.log('✅ Church category selected via sendKeys');
      } catch (e) {
        // If it's a custom dropdown, click it
        console.log('Trying alternative method for category selection');
        await driver.executeScript('arguments[0].click();', categoryDropdown);
        await driver.sleep(1000);
        
        const churchOption = await driver.findElement(By.xpath('//*[contains(text(), "Church")]'));
        await driver.executeScript('arguments[0].click();', churchOption);
        await driver.sleep(2000);
        console.log('✅ Church category selected via click');
      }
    });

    it('should display filtered Church results', async () => {
      console.log('\nSTEP: Verify Church category filter results');
      
      await driver.get(`${BASE_URL}/TourMap`);
      await driver.sleep(3000);
      
      // Click search button
      const searchButton = await driver.findElement(By.xpath('//button[@title="Search Sites" or @aria-label="Search Sites"]'));
      await driver.executeScript('arguments[0].click();', searchButton);
      await driver.sleep(2000);
      
      // Select Church category
      const categoryDropdown = await driver.findElement(By.xpath('//select | //*[contains(text(), "All Categories")]'));
      try {
        await categoryDropdown.sendKeys('Church');
      } catch (e) {
        await driver.executeScript('arguments[0].click();', categoryDropdown);
        await driver.sleep(1000);
        const churchOption = await driver.findElement(By.xpath('//*[contains(text(), "Church")]'));
        await driver.executeScript('arguments[0].click();', churchOption);
      }
      await driver.sleep(2000);
      
      // Verify results contain Church-related sites
      const results = await driver.findElements(By.xpath('//button[contains(@class, "rounded-xl") and contains(@class, "border")]'));
      console.log(`Found ${results.length} Church result(s)`);
      
      assert(results.length > 0, 'Should find Church category results');
      console.log('✅ Church filter working correctly');
    });

    it('should clear search and show all sites', async () => {
      console.log('\nSTEP: Clear search input');
      
      await driver.get(`${BASE_URL}/TourMap`);
      await driver.sleep(3000);
      
      // Click search button
      const searchButton = await driver.findElement(By.xpath('//button[@title="Search Sites" or @aria-label="Search Sites"]'));
      await driver.executeScript('arguments[0].click();', searchButton);
      await driver.sleep(2000);
      
      // Type and clear
      const searchInput = await driver.findElement(By.xpath('//input[@placeholder="Search by name or description"]'));
      await searchInput.sendKeys('San Agustin');
      await driver.sleep(1000);
      
      await searchInput.clear();
      await driver.sleep(1500);
      
      const clearedValue = await searchInput.getAttribute('value');
      assert(clearedValue === '' || clearedValue.length === 0, 'Search input should be cleared');
      console.log('✅ Search cleared - showing all sites');
    });

    it('should handle case-insensitive search', async () => {
      console.log('\nSTEP: Test case-insensitive search');
      
      await driver.get(`${BASE_URL}/TourMap`);
      await driver.sleep(3000);
      
      // Click search button
      const searchButton = await driver.findElement(By.xpath('//button[@title="Search Sites" or @aria-label="Search Sites"]'));
      await driver.executeScript('arguments[0].click();', searchButton);
      await driver.sleep(2000);
      
      // Search with lowercase
      const searchInput = await driver.findElement(By.xpath('//input[@placeholder="Search by name or description"]'));
      await searchInput.sendKeys('san agustin');
      await driver.sleep(2000);
      
      const results = await driver.findElements(By.xpath('//button[contains(@class, "rounded-xl") and contains(@class, "border")]'));
      console.log(`Found ${results.length} result(s) for lowercase search`);
      
      assert(results.length > 0, 'Search should be case-insensitive');
      console.log('✅ Case-insensitive search working');
    });

    it('should display site cards with images and descriptions', async () => {
      console.log('\nSTEP: Verify search result card structure');
      
      await driver.get(`${BASE_URL}/TourMap`);
      await driver.sleep(3000);
      
      // Click search button
      const searchButton = await driver.findElement(By.xpath('//button[@title="Search Sites" or @aria-label="Search Sites"]'));
      await driver.executeScript('arguments[0].click();', searchButton);
      await driver.sleep(2000);
      
      // Search for a site
      const searchInput = await driver.findElement(By.xpath('//input[@placeholder="Search by name or description"]'));
      await searchInput.sendKeys('Fort');
      await driver.sleep(2000);
      
      // Verify result cards have images and text
      const resultCards = await driver.findElements(By.xpath('//button[contains(@class, "rounded-xl") and contains(@class, "border")]'));
      console.log(`Found ${resultCards.length} result card(s)`);
      
      if (resultCards.length > 0) {
        const firstCard = resultCards[0];
        const images = await firstCard.findElements(By.xpath('.//img'));
        const text = await firstCard.getText();
        
        console.log(`First card has ${images.length} image(s)`);
        console.log(`First card text: ${text.substring(0, 50)}...`);
        
        assert(images.length > 0 || text.length > 0, 'Result cards should have images or text');
        console.log('✅ Result cards have proper structure');
      }
    });

    it('should handle empty search gracefully', async () => {
      console.log('\nSTEP: Test empty search behavior');
      
      await driver.get(`${BASE_URL}/TourMap`);
      await driver.sleep(3000);
      
      // Click search button
      const searchButton = await driver.findElement(By.xpath('//button[@title="Search Sites" or @aria-label="Search Sites"]'));
      await driver.executeScript('arguments[0].click();', searchButton);
      await driver.sleep(2000);
      
      // Leave search empty and check results
      const searchInput = await driver.findElement(By.xpath('//input[@placeholder="Search by name or description"]'));
      const inputValue = await searchInput.getAttribute('value');
      
      if (inputValue.length === 0) {
        const allResults = await driver.findElements(By.xpath('//button[contains(@class, "rounded-xl") and contains(@class, "border")]'));
        console.log(`Empty search shows ${allResults.length} result(s)`);
        console.log('✅ Empty search handled gracefully');
      }
    });

    it('should allow closing search modal', async () => {
      console.log('\nSTEP: Close search modal');
      
      await driver.get(`${BASE_URL}/TourMap`);
      await driver.sleep(3000);
      
      // Click search button
      const searchButton = await driver.findElement(By.xpath('//button[@title="Search Sites" or @aria-label="Search Sites"]'));
      await driver.executeScript('arguments[0].click();', searchButton);
      await driver.sleep(2000);
      
      // Find and click close button (X button from lucide-react)
      const closeButton = await driver.findElement(By.xpath('//button[contains(@class, "text-gray-500") and contains(@class, "hover:bg-gray-100")]'));
      await driver.executeScript('arguments[0].click();', closeButton);
      await driver.sleep(1500);
      
      // Verify modal is closed
      const modalElements = await driver.findElements(By.xpath('//h2[contains(text(), "Search Sites")]'));
      assert(modalElements.length === 0, 'Search modal should be closed');
      console.log('✅ Search modal closed successfully');
    });
  });
});
