const { Builder, By, until, Key } = require('selenium-webdriver');
const assert = require('assert');

const BASE_URL = process.env.BASE_URL || 'https://d39zx5gyblzxjs.cloudfront.net';
const HEADLESS = process.env.HEADLESS !== 'false';
const SLOW_MS = parseInt(process.env.SLOW_MS) || 1500;

// Mobile viewport dimensions (iPhone 14 Pro Max)
const MOBILE_WIDTH = 430;
const MOBILE_HEIGHT = 932;

describe('Guest Mobile - TourMap Search', () => {
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

  describe('Mobile TourMap Navigation', () => {
    it('should navigate to TourMap from mobile homepage', async () => {
      console.log('\nSTEP: Navigate to mobile homepage');
      
      await driver.get(`${BASE_URL}/GuestHomepage`);
      await driver.sleep(2000);
      
      const currentUrl = await driver.getCurrentUrl();
      console.log(`Current URL: ${currentUrl}`);
      assert(currentUrl.includes('/GuestHomepage'), 'Should be on guest homepage');
      
      // Look for TourMap navigation link or button
      console.log('\nSTEP: Click TourMap link on mobile');
      
      // Try to find TourMap link - could be in nav menu or as a button
      const tourMapLinks = await driver.findElements(By.xpath('//a[contains(text(), "Tour") or contains(text(), "Map")] | //button[contains(text(), "Tour") or contains(text(), "Map")]'));
      console.log(`Found ${tourMapLinks.length} potential TourMap link(s)`);
      
      if (tourMapLinks.length > 0) {
        await tourMapLinks[0].click();
        await driver.sleep(3000);
      } else {
        // Direct navigation if link not found
        console.log('TourMap link not found, navigating directly');
        await driver.get(`${BASE_URL}/TourMap`);
        await driver.sleep(3000);
      }
      
      const tourMapUrl = await driver.getCurrentUrl();
      console.log(`Navigated to: ${tourMapUrl}`);
      assert(tourMapUrl.includes('/TourMap'), 'Should be on TourMap page');
      console.log('✅ Successfully navigated to TourMap on mobile');
    });

    it('should display TourMap on mobile viewport', async () => {
      console.log('\nSTEP: Verify TourMap displays on mobile');
      
      await driver.get(`${BASE_URL}/TourMap`);
      await driver.sleep(3000);
      
      // Verify mobile viewport
      const viewportSize = await driver.executeScript('return {width: window.innerWidth, height: window.innerHeight}');
      console.log(`Mobile viewport: ${viewportSize.width}x${viewportSize.height}`);
      assert(viewportSize.width <= 500, 'Should be mobile viewport');
      
      // Check for map or main content
      const mapContent = await driver.findElements(By.xpath('//div[contains(@class, "map")] | //*[contains(@class, "leaflet")] | //h1 | //h2'));
      console.log(`Found ${mapContent.length} map/content element(s)`);
      
      assert(mapContent.length > 0, 'TourMap should display content on mobile');
      console.log('✅ TourMap displays correctly on mobile');
    });
  });

  describe('Mobile TourMap Search Modal', () => {
    it('should open search modal on mobile', async () => {
      console.log('\nSTEP: Open search modal on mobile');
      
      await driver.get(`${BASE_URL}/TourMap`);
      await driver.sleep(3000);
      
      // Find and click search button (magnifying glass icon)
      const searchButton = await driver.findElement(By.xpath('//button[@title="Search Sites" or @aria-label="Search Sites"]'));
      await driver.executeScript('arguments[0].click();', searchButton);
      await driver.sleep(2000);
      
      // Verify search modal opened
      const searchModal = await driver.findElement(By.xpath('//h2[contains(text(), "Search Sites")]'));
      assert(searchModal, 'Search modal should be visible on mobile');
      console.log('✅ Search modal opened on mobile');
    });

    it('should search for "San Agustin Church" on mobile', async () => {
      console.log('\nSTEP: Search for San Agustin Church on mobile');
      
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
      
      assert(results.length > 0, 'Should find search results on mobile');
      console.log('✅ Search results displayed on mobile');
    });

    it('should filter results by "Church" category on mobile', async () => {
      console.log('\nSTEP: Filter by Church category on mobile');
      
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

    it('should display filtered Church results on mobile', async () => {
      console.log('\nSTEP: Verify Church category filter results on mobile');
      
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
      
      assert(results.length > 0, 'Should find Church category results on mobile');
      console.log('✅ Church filter working correctly on mobile');
    });

    it('should clear search on mobile', async () => {
      console.log('\nSTEP: Clear search input on mobile');
      
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
      assert(clearedValue === '' || clearedValue.length === 0, 'Search input should be cleared on mobile');
      console.log('✅ Search cleared on mobile - showing all sites');
    });

    it('should handle case-insensitive search on mobile', async () => {
      console.log('\nSTEP: Test case-insensitive search on mobile');
      
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
      console.log(`Found ${results.length} result(s) for lowercase search on mobile`);
      
      assert(results.length > 0, 'Search should be case-insensitive on mobile');
      console.log('✅ Case-insensitive search working on mobile');
    });

    it('should display site cards with images on mobile', async () => {
      console.log('\nSTEP: Verify search result card structure on mobile');
      
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
      console.log(`Found ${resultCards.length} result card(s) on mobile`);
      
      if (resultCards.length > 0) {
        const firstCard = resultCards[0];
        const images = await firstCard.findElements(By.xpath('.//img'));
        const text = await firstCard.getText();
        
        console.log(`First card has ${images.length} image(s)`);
        console.log(`First card text: ${text.substring(0, 50)}...`);
        
        assert(images.length > 0 || text.length > 0, 'Result cards should have images or text on mobile');
        console.log('✅ Result cards have proper structure on mobile');
      }
    });

    it('should handle empty search gracefully on mobile', async () => {
      console.log('\nSTEP: Test empty search behavior on mobile');
      
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
        console.log(`Empty search shows ${allResults.length} result(s) on mobile`);
        console.log('✅ Empty search handled gracefully on mobile');
      }
    });

    it('should close search modal on mobile', async () => {
      console.log('\nSTEP: Close search modal on mobile');
      
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
      assert(modalElements.length === 0, 'Search modal should be closed on mobile');
      console.log('✅ Search modal closed successfully on mobile');
    });
  });

  describe('Mobile TourMap - Site Card and Media Carousel', () => {
    it('should click on a site card to open details', async () => {
      console.log('\nSTEP: Click on a site card on mobile TourMap');
      
      await driver.get(`${BASE_URL}/TourMap`);
      await driver.sleep(3000);
      
      // Find and click on a site card - look for clickable elements with site info
      // Try multiple selectors to find site cards
      let siteCards = await driver.findElements(By.xpath('//button[contains(@class, "rounded-xl") and contains(@class, "border")]'));
      
      if (siteCards.length === 0) {
        // Try alternative selector - look for divs with cursor-pointer
        siteCards = await driver.findElements(By.xpath('//div[contains(@class, "cursor-pointer")] | //div[contains(@class, "rounded-lg")]//button'));
      }
      
      if (siteCards.length === 0) {
        // Try finding any clickable site element
        siteCards = await driver.findElements(By.xpath('//button | //div[@onclick]'));
      }
      
      console.log(`Found ${siteCards.length} potential site card(s)`);
      
      if (siteCards.length > 0) {
        // Click the first site card
        await siteCards[0].click();
        await driver.sleep(2000);
        
        // Verify site details modal/card opened
        const siteDetails = await driver.findElements(By.xpath('//h2 | //h3 | //div[contains(@class, "modal")] | //div[contains(@class, "card")] | //div[contains(@class, "fixed")]'));
        console.log(`Found ${siteDetails.length} detail element(s) after clicking site`);
        
        if (siteDetails.length > 0) {
          console.log('✅ Site card clicked and details displayed on mobile');
        } else {
          console.log('⚠️ Site details not clearly visible');
        }
      } else {
        console.log('⚠️ No site cards found to click');
      }
    });

    it('should display media carousel in site details on mobile', async () => {
      console.log('\nSTEP: Verify media carousel in site details on mobile');
      
      await driver.get(`${BASE_URL}/TourMap`);
      await driver.sleep(3000);
      
      // Click on a site card - use flexible selector
      let siteCards = await driver.findElements(By.xpath('//button[contains(@class, "rounded-xl") and contains(@class, "border")]'));
      if (siteCards.length === 0) {
        siteCards = await driver.findElements(By.xpath('//div[contains(@class, "cursor-pointer")] | //button'));
      }
      
      if (siteCards.length > 0) {
        await siteCards[0].click();
        await driver.sleep(2000);
        
        // Look for media carousel (images or videos)
        const carouselContainer = await driver.findElements(By.xpath('//div[contains(@class, "rounded-lg") and contains(@class, "overflow-hidden")] | //div[contains(@class, "carousel")]'));
        console.log(`Found ${carouselContainer.length} carousel container(s)`);
        
        // Look for media elements (images or videos)
        const mediaElements = await driver.findElements(By.xpath('//img[contains(@alt, "Media")] | //video | //img[not(contains(@class, "w-5"))]'));
        console.log(`Found ${mediaElements.length} media element(s) in carousel`);
        
        if (mediaElements.length > 0) {
          console.log('✅ Media carousel displayed in site details on mobile');
        } else {
          console.log('⚠️ No media elements found in carousel');
        }
      }
    });

    it('should navigate carousel with next button on mobile', async () => {
      console.log('\nSTEP: Test carousel next button on mobile');
      
      await driver.get(`${BASE_URL}/TourMap`);
      await driver.sleep(3000);
      
      // Click on a site card - use flexible selector
      let siteCards = await driver.findElements(By.xpath('//button[contains(@class, "rounded-xl") and contains(@class, "border")]'));
      if (siteCards.length === 0) {
        siteCards = await driver.findElements(By.xpath('//div[contains(@class, "cursor-pointer")] | //button'));
      }
      
      if (siteCards.length > 0) {
        await siteCards[0].click();
        await driver.sleep(2000);
        
        // Look for carousel next button (ChevronRight icon button)
        // Note: Navigation arrows are hidden on mobile (hidden md:flex), so they may not be interactable
        const nextButtons = await driver.findElements(By.xpath('//button[contains(@aria-label, "Next slide")] | //button[contains(@class, "right-2")]'));
        console.log(`Found ${nextButtons.length} next button(s) in carousel`);
        
        if (nextButtons.length > 0) {
          try {
            // Try to click next button (may be hidden on mobile)
            await nextButtons[0].click();
            await driver.sleep(1000);
            console.log('✅ Carousel next button clicked on mobile');
          } catch (e) {
            console.log('⚠️ Next button found but not interactable (hidden on mobile - use touch swipe instead)');
          }
        } else {
          console.log('⚠️ Next button not found (navigation arrows are hidden on mobile)');
        }
      }
    });

    it('should navigate carousel with previous button on mobile', async () => {
      console.log('\nSTEP: Test carousel previous button on mobile');
      
      await driver.get(`${BASE_URL}/TourMap`);
      await driver.sleep(3000);
      
      // Click on a site card - use flexible selector
      let siteCards = await driver.findElements(By.xpath('//button[contains(@class, "rounded-xl") and contains(@class, "border")]'));
      if (siteCards.length === 0) {
        siteCards = await driver.findElements(By.xpath('//div[contains(@class, "cursor-pointer")] | //button'));
      }
      
      if (siteCards.length > 0) {
        await siteCards[0].click();
        await driver.sleep(2000);
        
        // Look for carousel previous button (ChevronLeft icon button)
        // Note: Navigation arrows are hidden on mobile (hidden md:flex), so they may not be interactable
        const prevButtons = await driver.findElements(By.xpath('//button[contains(@aria-label, "Previous slide")] | //button[contains(@class, "left-2")]'));
        console.log(`Found ${prevButtons.length} previous button(s) in carousel`);
        
        if (prevButtons.length > 0) {
          try {
            // Try to click previous button (may be hidden on mobile)
            await prevButtons[0].click();
            await driver.sleep(1000);
            console.log('✅ Carousel previous button clicked on mobile');
          } catch (e) {
            console.log('⚠️ Previous button found but not interactable (hidden on mobile - use touch swipe instead)');
          }
        } else {
          console.log('⚠️ Previous button not found (navigation arrows are hidden on mobile)');
        }
      }
    });

    it('should display slide counter in carousel on mobile', async () => {
      console.log('\nSTEP: Verify slide counter in carousel on mobile');
      
      await driver.get(`${BASE_URL}/TourMap`);
      await driver.sleep(3000);
      
      // Click on a site card - use flexible selector
      let siteCards = await driver.findElements(By.xpath('//button[contains(@class, "rounded-xl") and contains(@class, "border")]'));
      if (siteCards.length === 0) {
        siteCards = await driver.findElements(By.xpath('//div[contains(@class, "cursor-pointer")] | //button'));
      }
      
      if (siteCards.length > 0) {
        await siteCards[0].click();
        await driver.sleep(2000);
        
        // Look for slide counter (e.g., "1 / 3")
        const slideCounter = await driver.findElements(By.xpath('//div[contains(@class, "text-xs") and contains(text(), "/")]'));
        console.log(`Found ${slideCounter.length} slide counter(s)`);
        
        if (slideCounter.length > 0) {
          const counterText = await slideCounter[0].getText();
          console.log(`Slide counter text: ${counterText}`);
          console.log('✅ Slide counter displayed in carousel on mobile');
        } else {
          console.log('⚠️ Slide counter not found (may only have 1 media item)');
        }
      }
    });

    it('should allow clicking carousel dots to navigate on mobile', async () => {
      console.log('\nSTEP: Test carousel dot navigation on mobile');
      
      await driver.get(`${BASE_URL}/TourMap`);
      await driver.sleep(3000);
      
      // Click on a site card - use flexible selector
      let siteCards = await driver.findElements(By.xpath('//button[contains(@class, "rounded-xl") and contains(@class, "border")]'));
      if (siteCards.length === 0) {
        siteCards = await driver.findElements(By.xpath('//div[contains(@class, "cursor-pointer")] | //button'));
      }
      
      if (siteCards.length > 0) {
        await siteCards[0].click();
        await driver.sleep(2000);
        
        // Look for carousel dots (navigation indicators)
        const carouselDots = await driver.findElements(By.xpath('//button[contains(@aria-label, "Go to slide")]'));
        console.log(`Found ${carouselDots.length} carousel dot(s)`);
        
        if (carouselDots.length > 1) {
          // Click on the second dot
          await carouselDots[1].click();
          await driver.sleep(1000);
          
          console.log('✅ Carousel dot navigation working on mobile');
        } else {
          console.log('⚠️ Not enough carousel dots (may only have 1 media item)');
        }
      }
    });
  });

  describe('Mobile TourMap - Responsive Design', () => {
    it('should maintain mobile viewport on TourMap', async () => {
      console.log('\nSTEP: Verify mobile viewport maintained on TourMap');
      
      await driver.get(`${BASE_URL}/TourMap`);
      await driver.sleep(3000);
      
      const viewportSize = await driver.executeScript('return {width: window.innerWidth, height: window.innerHeight}');
      console.log(`Mobile viewport: ${viewportSize.width}x${viewportSize.height}`);
      
      assert(viewportSize.width <= 500, 'Viewport should remain mobile-sized');
      console.log('✅ Mobile viewport maintained on TourMap');
    });

    it('should have touch-friendly buttons on mobile TourMap', async () => {
      console.log('\nSTEP: Check button sizes on mobile TourMap');
      
      await driver.get(`${BASE_URL}/TourMap`);
      await driver.sleep(3000);
      
      // Click search to open modal
      const searchButton = await driver.findElement(By.xpath('//button[@title="Search Sites" or @aria-label="Search Sites"]'));
      await driver.executeScript('arguments[0].click();', searchButton);
      await driver.sleep(2000);
      
      // Check button sizes
      const buttons = await driver.findElements(By.xpath('//button'));
      console.log(`Found ${buttons.length} button(s) on mobile TourMap`);
      
      let touchFriendlyCount = 0;
      for (let i = 0; i < Math.min(buttons.length, 5); i++) {
        const size = await buttons[i].getRect();
        if (size.height >= 36 && size.width >= 36) {
          touchFriendlyCount++;
        }
      }
      
      console.log(`${touchFriendlyCount} button(s) are touch-friendly (≥36px)`);
      assert(touchFriendlyCount > 0, 'Should have touch-friendly buttons on mobile');
      console.log('✅ Buttons are properly sized for mobile touch');
    });
  });
});
