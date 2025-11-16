/**
 * Test Cleanup Helper
 * 
 * Provides reusable cleanup functions for E2E tests to ensure test data is properly removed
 * after test execution, preventing interference with subsequent test runs.
 */

const { By, until } = require('selenium-webdriver');

/**
 * Generic cleanup function for items with Archive/Delete workflow
 * Used for: Chatbot entries, Itineraries, Tour Map pins, Photobooth filters, etc.
 * 
 * @param {WebDriver} driver - Selenium WebDriver instance
 * @param {string} searchKeywords - Keywords to identify test data (e.g., "Test Entry", "UPDATED")
 * @param {Object} options - Configuration options
 * @param {string} options.itemSelector - XPath to find item containers (default: generic grid item)
 * @param {string} options.textSelector - XPath to find text within item (default: any text)
 * @param {string} options.archiveButtonText - Text of archive button (default: "Archive")
 * @param {string} options.deleteButtonText - Text of delete button (default: "Delete")
 * @param {string} options.confirmArchiveText - Text of confirm archive button (default: "Archive")
 * @param {string} options.confirmDeleteText - Text of confirm delete button (default: "Delete Forever")
 * @param {string} options.archivedTabText - Text of archived tab button (default: "Archived")
 * @param {number} options.sleepMs - Sleep duration between actions (default: 1000)
 * @returns {Promise<{archived: number, deleted: number, errors: string[]}>} Cleanup summary
 */
async function cleanupArchivableItems(driver, searchKeywords, options = {}) {
  const {
    itemSelector = "//div[contains(@class,'rounded-xl') and contains(@class,'border')]",
    textSelector = ".",
    archiveButtonText = "Archive",
    deleteButtonText = "Delete",
    confirmArchiveText = "Archive",
    confirmDeleteText = "Delete Forever",
    archivedTabText = "Archived",
    sleepMs = 1000
  } = options;

  const summary = { archived: 0, deleted: 0, errors: [] };
  const keywords = Array.isArray(searchKeywords) ? searchKeywords : [searchKeywords];

  try {
    // Step 1: Archive all matching items from Active tab
    console.log(`\n🧹 CLEANUP: Starting cleanup for keywords: ${keywords.join(', ')}`);
    
    let items = await driver.findElements(By.xpath(itemSelector));
    console.log(`🧹 CLEANUP: Found ${items.length} items in Active tab`);

    for (let i = items.length - 1; i >= 0; i--) {
      try {
        const itemText = await items[i].getText().catch(() => '');
        const shouldDelete = keywords.some(kw => itemText.includes(kw));

        if (shouldDelete) {
          console.log(`🧹 CLEANUP: Archiving item: "${itemText.substring(0, 50)}..."`);
          
          const archiveBtn = await items[i].findElement(By.xpath(`.//button[contains(., '${archiveButtonText}')]`)).catch(() => null);
          if (archiveBtn) {
            await safeClick(driver, archiveBtn);
            await driver.sleep(sleepMs);

            // Confirm archive
            const confirmBtn = await driver.findElements(By.xpath(`//button[contains(., '${confirmArchiveText}')]`));
            if (confirmBtn.length > 0) {
              await safeClick(driver, confirmBtn[confirmBtn.length - 1]);
              await driver.sleep(sleepMs);
              summary.archived++;
            }
          }
        }
      } catch (err) {
        summary.errors.push(`Error archiving item ${i}: ${err.message}`);
      }
    }

    // Step 2: Switch to Archived tab and delete all matching items
    console.log(`\n🧹 CLEANUP: Switching to Archived tab to delete ${summary.archived} items`);
    
    const archivedTab = await driver.findElements(By.xpath(`//button[contains(., '${archivedTabText}')]`));
    if (archivedTab.length > 0) {
      await safeClick(driver, archivedTab[0]);
      await driver.sleep(sleepMs * 1.5);

      items = await driver.findElements(By.xpath(itemSelector));
      console.log(`🧹 CLEANUP: Found ${items.length} items in Archived tab`);

      for (let i = items.length - 1; i >= 0; i--) {
        try {
          const itemText = await items[i].getText().catch(() => '');
          const shouldDelete = keywords.some(kw => itemText.includes(kw));

          if (shouldDelete) {
            console.log(`🧹 CLEANUP: Permanently deleting: "${itemText.substring(0, 50)}..."`);
            
            const deleteBtn = await items[i].findElement(By.xpath(`.//button[contains(., '${deleteButtonText}')]`)).catch(() => null);
            if (deleteBtn) {
              await safeClick(driver, deleteBtn);
              await driver.sleep(sleepMs);

              // Confirm delete
              const confirmBtn = await driver.findElements(By.xpath(`//button[contains(., '${confirmDeleteText}')]`));
              if (confirmBtn.length > 0) {
                await safeClick(driver, confirmBtn[confirmBtn.length - 1]);
                await driver.sleep(sleepMs);
                summary.deleted++;
              }
            }
          }
        } catch (err) {
          summary.errors.push(`Error deleting item ${i}: ${err.message}`);
        }
      }
    }

    console.log(`\n✅ CLEANUP COMPLETE: Archived ${summary.archived}, Deleted ${summary.deleted}`);
    if (summary.errors.length > 0) {
      console.log(`⚠️ CLEANUP ERRORS: ${summary.errors.length} errors occurred`);
      summary.errors.forEach(err => console.log(`  - ${err}`));
    }

    return summary;
  } catch (err) {
    console.log(`❌ CLEANUP FAILED: ${err.message}`);
    summary.errors.push(`Fatal cleanup error: ${err.message}`);
    return summary;
  }
}

/**
 * Safe click helper to handle intercepted clicks
 * @param {WebDriver} driver - Selenium WebDriver instance
 * @param {WebElement} element - Element to click
 */
async function safeClick(driver, element) {
  try {
    await driver.executeScript("arguments[0].style.outline='3px solid #e11d48';", element);
  } catch (_) {}
  
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", element).catch(() => {});
  await driver.sleep(300);
  
  try {
    await element.click();
  } catch (_) {
    await driver.executeScript('arguments[0].click();', element);
  }
  
  await driver.sleep(300);
  try {
    await driver.executeScript("arguments[0].style.outline='';", element);
  } catch (_) {}
}

/**
 * Cleanup for search-based deletion (for items without Archive/Delete workflow)
 * @param {WebDriver} driver - Selenium WebDriver instance
 * @param {string} searchTerm - Term to search for
 * @param {Object} options - Configuration options
 * @returns {Promise<boolean>} True if cleanup succeeded
 */
async function cleanupBySearch(driver, searchTerm, options = {}) {
  const {
    searchSelector = "//input[@placeholder='Search']",
    deleteButtonSelector = "//button[contains(., 'Delete')]",
    sleepMs = 1000
  } = options;

  try {
    console.log(`\n🧹 CLEANUP: Searching for "${searchTerm}" to delete`);
    
    const searchInput = await driver.findElements(By.xpath(searchSelector));
    if (searchInput.length === 0) {
      console.log(`⚠️ CLEANUP: Search input not found`);
      return false;
    }

    await searchInput[0].clear();
    await searchInput[0].sendKeys(searchTerm);
    await driver.sleep(sleepMs);

    const deleteBtn = await driver.findElements(By.xpath(deleteButtonSelector));
    if (deleteBtn.length === 0) {
      console.log(`⚠️ CLEANUP: No items found for "${searchTerm}"`);
      return true;
    }

    await safeClick(driver, deleteBtn[0]);
    await driver.sleep(sleepMs);

    // Confirm deletion if modal appears
    const confirmBtn = await driver.findElements(By.xpath("//button[contains(., 'Confirm')] | //button[contains(., 'Delete')]"));
    if (confirmBtn.length > 0) {
      await safeClick(driver, confirmBtn[confirmBtn.length - 1]);
      await driver.sleep(sleepMs);
    }

    console.log(`✅ CLEANUP: Successfully deleted "${searchTerm}"`);
    return true;
  } catch (err) {
    console.log(`❌ CLEANUP FAILED: ${err.message}`);
    return false;
  }
}

module.exports = {
  cleanupArchivableItems,
  cleanupBySearch,
  safeClick
};
