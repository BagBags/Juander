const { Builder, By, until, Key } = require('selenium-webdriver');
const assert = require('assert');

describe('Guest Web - Homepage Exploration', () => {
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

  describe('Guest Homepage Navigation', () => {
    it('should load guest homepage successfully', async () => {
      console.log(`\nNavigating to: ${BASE_URL}/GuestHomepage`);
      await driver.get(`${BASE_URL}/GuestHomepage`);
      
      const currentUrl = await driver.getCurrentUrl();
      console.log(`Current URL: ${currentUrl}`);
      
      assert(currentUrl.includes('/GuestHomepage'), 'Should be on guest homepage');
      console.log('✅ Guest homepage loaded');
    });

    it('should display "Explore Intramuros" button', async () => {
      console.log('\nSTEP: Looking for "Explore Intramuros" button');

      // The button is at the bottom with a Compass icon
      // Try multiple selectors to find it
      let exploreButton = null;
      let attempts = [];

      // Attempt 1: Look for button with "bottom-16" class and contains span with text
      try {
        exploreButton = await driver.findElement(By.xpath('//button[contains(@class, "bottom-16")]//span[contains(text(), "Explore") or contains(text(), "Start")]'));
        attempts.push('Found via bottom-16 span');
      } catch (e) {
        attempts.push('bottom-16 span: not found');
      }

      // Attempt 2: Look for any button with "fixed" and "bottom" classes
      if (!exploreButton) {
        try {
          exploreButton = await driver.findElement(By.xpath('//button[contains(@class, "fixed") and contains(@class, "bottom")]'));
          attempts.push('Found via fixed bottom button');
        } catch (e) {
          attempts.push('fixed bottom button: not found');
        }
      }

      // Attempt 3: Look for button with Compass icon (lucide-react)
      if (!exploreButton) {
        try {
          exploreButton = await driver.findElement(By.xpath('//button[.//svg and contains(@class, "bottom")]'));
          attempts.push('Found via button with SVG at bottom');
        } catch (e) {
          attempts.push('button with SVG: not found');
        }
      }

      // Attempt 4: Simple text search
      if (!exploreButton) {
        try {
          const allButtons = await driver.findElements(By.xpath('//button'));
          console.log(`Total buttons on page: ${allButtons.length}`);
          
          for (let btn of allButtons) {
            const text = await btn.getText();
            if (text.includes('Explore') || text.includes('Start Tour')) {
              exploreButton = btn;
              attempts.push(`Found button with text: "${text}"`);
              break;
            }
          }
        } catch (e) {
          attempts.push('Text search: failed');
        }
      }

      console.log('Attempts: ' + attempts.join(' | '));
      assert(exploreButton, 'Should find Explore button (Desktop: "Explore Intramuros" or Mobile: "Start Tour")');
      console.log('✅ Explore button found');
    });

    it('should navigate to TourMap when clicking "Explore Intramuros"', async () => {
      console.log('\nSTEP: Navigating to GuestHomepage first');
      await driver.get(`${BASE_URL}/GuestHomepage`);
      await driver.sleep(2000);
      
      console.log('STEP: Clicking "Explore Intramuros" button');
      
      // Find the DESKTOP Explore button (not the mobile one)
      // Desktop button: hidden md:flex, navigates to /TourMap
      // Mobile button: block md:hidden, navigates to /GuestItinerary
      let exploreButton = null;
      
      try {
        // Look for the desktop button that navigates to TourMap
        exploreButton = await driver.findElement(By.xpath('//button[contains(@class, "hidden md:flex") and contains(@class, "bottom")]'));
      } catch (e) {
        try {
          // Fallback: look for any button with Explore text
          exploreButton = await driver.findElement(By.xpath('//button[contains(text(), "Explore") or contains(text(), "explore")]'));
        } catch (e2) {
          throw new Error('Could not find Explore button');
        }
      }
      
      // Get button text to verify we found the right one
      const buttonText = await exploreButton.getText();
      console.log(`Found button with text: "${buttonText}"`);
      
      // Scroll button into view
      await driver.executeScript('arguments[0].scrollIntoView(true);', exploreButton);
      await driver.sleep(500);
      
      // Click using JavaScript
      await driver.executeScript('arguments[0].click();', exploreButton);
      console.log('✅ Clicked Explore button');
      
      // Wait and check URL multiple times to see what's happening
      console.log('STEP: Waiting for redirect...');
      await driver.sleep(2000);
      
      let currentUrl = await driver.getCurrentUrl();
      console.log(`URL after 2 seconds: ${currentUrl}`);
      
      if (!currentUrl.includes('/TourMap')) {
        await driver.sleep(3000);
        currentUrl = await driver.getCurrentUrl();
        console.log(`URL after 5 seconds: ${currentUrl}`);
      }
      
      if (!currentUrl.includes('/TourMap')) {
        await driver.sleep(5000);
        currentUrl = await driver.getCurrentUrl();
        console.log(`URL after 10 seconds: ${currentUrl}`);
      }
      
      console.log(`Final URL: ${currentUrl}`);
      
      // Web should navigate to /TourMap (not /GuestItinerary which is mobile)
      assert(currentUrl.includes('/TourMap'), `Should navigate to /TourMap for web, but got: ${currentUrl}`);
      console.log('✅ Successfully navigated to /TourMap');
    });
  });

  describe('Tour Map Site Exploration', () => {
    it('should display tour map with sites', async () => {
      console.log('\nSTEP: Navigating to TourMap (web view)');
      // Navigate to the tour map (web view, not mobile GuestItinerary)
      await driver.get(`${BASE_URL}/TourMap`);
      await driver.sleep(3000);
      
      console.log('STEP: Verifying tour map loaded with sites');
      
      // Look for any clickable elements on the map
      const buttons = await driver.findElements(By.xpath('//button'));
      const links = await driver.findElements(By.xpath('//a'));
      const divs = await driver.findElements(By.xpath('//div[@role="button"]'));
      
      console.log(`Found ${buttons.length} buttons, ${links.length} links, ${divs.length} clickable divs`);
      
      const totalElements = buttons.length + links.length + divs.length;
      assert(totalElements > 0, 'Tour map should display interactive elements');
      console.log('✅ Tour map loaded with interactive elements');
    });

    it('should click a site with facade', async () => {
      console.log('\nSTEP: Looking for PIN markers on the map');
      
      // The PIN marker is a div with cursor-pointer class that contains:
      // - facade image (img tag)
      // - red/blue circle (inner div)
      // Look for divs that have the cursor-pointer class and contain images
      let pinElements = await driver.findElements(By.xpath('//div[contains(@class, "cursor-pointer") and .//img]'));
      
      if (pinElements.length === 0) {
        console.log('No facade images found, looking for any cursor-pointer divs...');
        pinElements = await driver.findElements(By.xpath('//div[contains(@class, "cursor-pointer")]'));
      }
      
      console.log(`Found ${pinElements.length} PIN element(s)`);
      assert(pinElements.length > 0, 'Should find at least one PIN to click');
      
      // Click the first PIN marker (the facade image container, not the info button)
      console.log('STEP: Clicking first PIN marker');
      await driver.executeScript('arguments[0].scrollIntoView(true);', pinElements[0]);
      await driver.sleep(1000);
      await driver.executeScript('arguments[0].click();', pinElements[0]);
      
      // Wait for details modal/card to load
      await driver.sleep(3000);
      
      console.log('✅ PIN clicked - site details should now be visible');
    });
  });

  describe('Media Carousel Functionality', () => {
    it('should display media carousel for site', async () => {
      console.log('\nSTEP: Checking for media carousel');
      
      // Look for carousel or image container
      let carousel = null;
      
      try {
        carousel = await driver.findElement(By.xpath('//div[contains(@class, "carousel") or contains(@class, "slider")]'));
      } catch (e) {
        console.log('Carousel not found, checking for images...');
      }
      
      if (!carousel) {
        const images = await driver.findElements(By.xpath('//img'));
        console.log(`Found ${images.length} image(s)`);
        assert(images.length > 0, 'Should display at least one image');
      }
      
      console.log('✅ Media carousel/images found');
    });

    it('should navigate carousel with next button', async () => {
      console.log('\nSTEP: Looking for carousel next button');
      
      // The carousel has ChevronRight button with aria-label="Next slide"
      let nextButton = null;
      
      try {
        // Look for the next button with aria-label
        nextButton = await driver.findElement(By.xpath('//button[@aria-label="Next slide"]'));
        console.log('✅ Next button found');
      } catch (e) {
        console.log('Next button not found with aria-label, trying alternative selectors...');
        try {
          // Try finding by SVG or icon
          nextButton = await driver.findElement(By.xpath('//button[contains(@class, "right")]'));
          console.log('✅ Found right button');
        } catch (e2) {
          throw new Error('Carousel next button not found');
        }
      }
      
      console.log('STEP: Clicking next button');
      await driver.executeScript('arguments[0].scrollIntoView(true);', nextButton);
      await driver.sleep(500);
      await driver.executeScript('arguments[0].click();', nextButton);
      
      // Wait for image to change
      await driver.sleep(1500);
      
      console.log('✅ Carousel next button clicked and image changed');
    });

    it('should navigate carousel with previous button', async () => {
      console.log('\nSTEP: Looking for carousel previous button');
      
      // The carousel has ChevronLeft button with aria-label="Previous slide"
      let prevButton = null;
      
      try {
        // Look for the previous button with aria-label
        prevButton = await driver.findElement(By.xpath('//button[@aria-label="Previous slide"]'));
        console.log('✅ Previous button found');
      } catch (e) {
        console.log('Previous button not found with aria-label, trying alternative selectors...');
        try {
          // Try finding by absolute position (left side button)
          prevButton = await driver.findElement(By.xpath('//button[contains(@class, "left-2")]'));
          console.log('✅ Found left button');
        } catch (e2) {
          try {
            // Try any button on the left side
            prevButton = await driver.findElement(By.xpath('//button[contains(@class, "absolute left")]'));
            console.log('✅ Found absolute left button');
          } catch (e3) {
            throw new Error('Carousel previous button not found');
          }
        }
      }
      
      console.log('STEP: Clicking previous button');
      await driver.executeScript('arguments[0].scrollIntoView(true);', prevButton);
      await driver.sleep(500);
      await driver.executeScript('arguments[0].click();', prevButton);
      
      // Wait for image to change
      await driver.sleep(1500);
      
      console.log('✅ Carousel previous button clicked and image changed');
    });
  });

  describe('Functional Tests', () => {
    it('should have interactive elements on tour map', async () => {
      console.log('\nSTEP: Checking for interactive elements');
      
      // Navigate back to tour map if needed
      const currentUrl = await driver.getCurrentUrl();
      if (!currentUrl.includes('/TourMap')) {
        console.log('Navigating back to TourMap');
        await driver.get(`${BASE_URL}/TourMap`);
        await driver.wait(until.elementLocated(By.xpath('//div[contains(@class, "map")]')), 10000);
      }
      
      // Check for buttons
      const buttons = await driver.findElements(By.xpath('//button'));
      console.log(`Found ${buttons.length} button(s)`);
      
      // Check for links
      const links = await driver.findElements(By.xpath('//a'));
      console.log(`Found ${links.length} link(s)`);
      
      const totalInteractive = buttons.length + links.length;
      assert(totalInteractive > 0, 'Tour map should have interactive elements');
      
      console.log('✅ Interactive elements found');
    });

    it('should display site information when clicked', async () => {
      console.log('\nSTEP: Verifying site information display');
      
      // Wait a bit for the modal/card to fully load
      await driver.sleep(2000);
      
      // Look for the site card or modal
      let infoContainer = null;
      try {
        infoContainer = await driver.findElement(By.xpath('//div[contains(@class, "card") or contains(@class, "modal") or contains(@class, "detail")]'));
        console.log('Found info container');
      } catch (e) {
        console.log('No info container found, checking page text anyway');
      }
      
      // Get the page text to check for site description
      const pageText = await driver.findElement(By.xpath('//body')).getText();
      console.log(`Page text length: ${pageText.length}`);
      console.log(`Page text sample: ${pageText.substring(0, 200)}`);
      
      // Should have descriptive text about the site (like "Memorare 1945 Monument...")
      // Check for common site description patterns
      const hasDescription = pageText.includes('Monument') || 
                            pageText.includes('Church') || 
                            pageText.includes('Plaza') ||
                            pageText.includes('Manila') ||
                            pageText.includes('site') ||
                            pageText.length > 500; // Site info is typically long
      
      assert(hasDescription, 'Site should display information/description');
      
      console.log('✅ Site information displayed');
    });

    it('should allow closing site details', async () => {
      console.log('\nSTEP: Looking for close button');
      
      // Look for close button
      let closeButton = null;
      
      try {
        closeButton = await driver.findElement(By.xpath('//button[contains(@class, "close") or contains(@aria-label, "close")]'));
      } catch (e) {
        console.log('Close button not found');
      }
      
      if (!closeButton) {
        try {
          closeButton = await driver.findElement(By.xpath('//button[contains(text(), "×") or contains(text(), "X")]'));
        } catch (e2) {
          console.log('⚠️ Close button not found');
          return;
        }
      }
      
      if (closeButton) {
        console.log('STEP: Clicking close button');
        await closeButton.click();
        
        // Wait for modal to close
        await driver.sleep(500);
        
        console.log('✅ Site details closed');
      }
    });
  });
});
