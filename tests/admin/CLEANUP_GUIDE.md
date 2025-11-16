# Test Data Cleanup Guide

## Overview
This guide ensures that all E2E tests properly clean up test data after execution, preventing leftover data from interfering with subsequent test runs or manual validation.

## Problem Statement
Previously, tests were creating data (entries, filters, pins, etc.) but not cleaning them up, causing:
- Validation failures in subsequent test runs
- Manual cleanup burden
- Test data pollution in production
- Inconsistent test results

## Solution Architecture

### 1. Centralized Cleanup Helper (`test-cleanup-helper.js`)
A reusable module providing cleanup functions for common patterns:

#### `cleanupArchivableItems(driver, searchKeywords, options)`
For items with Archive/Delete workflow (Chatbot, Itineraries, Tour Map, Photobooth)

**Parameters:**
- `driver` - Selenium WebDriver instance
- `searchKeywords` - String or array of keywords to identify test data
- `options` - Configuration object:
  - `itemSelector` - XPath to find item containers
  - `archiveButtonText` - Text of archive button (default: "Archive")
  - `deleteButtonText` - Text of delete button (default: "Delete")
  - `confirmArchiveText` - Text of confirm button (default: "Archive")
  - `confirmDeleteText` - Text of confirm delete button (default: "Delete Forever")
  - `archivedTabText` - Text of archived tab (default: "Archived")
  - `sleepMs` - Sleep duration between actions (default: 1000)

**Returns:** `{archived: number, deleted: number, errors: string[]}`

**Workflow:**
1. Finds all items matching keywords in Active tab
2. Archives each matching item
3. Switches to Archived tab
4. Permanently deletes each archived item
5. Returns summary with counts and errors

#### `cleanupBySearch(driver, searchTerm, options)`
For items without Archive/Delete workflow

**Parameters:**
- `driver` - Selenium WebDriver instance
- `searchTerm` - Term to search for
- `options` - Configuration object:
  - `searchSelector` - XPath to search input
  - `deleteButtonSelector` - XPath to delete button
  - `sleepMs` - Sleep duration

**Returns:** `boolean` - True if cleanup succeeded

### 2. Implementation Pattern

#### For Chatbot Tests
```javascript
const { cleanupArchivableItems } = require('./test-cleanup-helper');

describe('Chatbot Management - Functional Tests', function () {
  // ... test code ...

  // Cleanup: Delete all test entries after tests complete
  after(async () => {
    try {
      await step(driver, 'Cleanup: Deleting test entries');
      
      // Go to Active tab first
      const activeTab = await driver.findElements(By.xpath("//button[contains(., 'Active Entries')]"));
      if (activeTab.length > 0) {
        await safeClick(driver, activeTab[0]);
        await driver.sleep(1000);
      }

      // Use the cleanup helper
      const testKeywords = ['Test Entry', 'Filter Test', 'Form Clear Test'];
      const result = await cleanupArchivableItems(driver, testKeywords, {
        itemSelector: "//div[contains(@class,'rounded-xl') and contains(@class,'border')]",
        archiveButtonText: 'Archive',
        deleteButtonText: 'Delete',
        confirmArchiveText: 'Archive Entry',
        confirmDeleteText: 'Delete Forever',
        archivedTabText: 'Archived',
        sleepMs: 1000
      });

      console.log(`✓ Cleanup completed: Archived ${result.archived}, Deleted ${result.deleted}`);
    } catch (err) {
      console.log('Cleanup error (non-critical):', err.message);
    }
  });
});
```

## Test Files with Cleanup

### ✅ Already Implemented
- **chatbot.e2e.full-crud.test.js** - Uses cleanup helper
- **chatbot.functional.test.js** - Uses cleanup helper
- **itinerary.e2e.full-crud.test.js** - Cleanup built into test flow (deletes as part of CRUD)
- **photobooth.aw024.add-filter.test.js** - Cleanup built into test flow

### 🔄 Needs Implementation
- **tourmap.e2e.complete.test.js** - Creates tour map pins
- **tourmap.e2e.full-crud.manila-cathedral.test.js** - Creates tour map pins
- **itinerary.functional.test.js** - Creates itineraries
- **reviews.functional.test.js** - May create reviews (check if needed)

## Best Practices

### 1. Use Unique Identifiers
```javascript
const UNIQUE_NAME = `Test Entry ${Date.now()}`;
```
This ensures test data is easily identifiable and won't conflict with other tests.

### 2. Always Use `after()` Hook
```javascript
after(async () => {
  try {
    // Cleanup code
  } catch (err) {
    console.log('Cleanup error (non-critical):', err.message);
  }
});
```
- Cleanup runs even if tests fail
- Errors are logged but don't fail the test suite

### 3. Archive Before Delete
For items with Archive/Delete workflow:
1. Archive items first (soft delete)
2. Switch to Archived tab
3. Permanently delete (hard delete)

This matches the application's workflow and ensures proper cleanup.

### 4. Search by Keywords
Use keywords that uniquely identify test data:
```javascript
const testKeywords = ['Test Entry', 'Filter Test', 'UPDATED'];
```
This allows cleanup to find all variations of test data created during the test.

### 5. Log Cleanup Progress
```javascript
console.log(`✓ Cleanup completed: Archived ${result.archived}, Deleted ${result.deleted}`);
if (result.errors.length > 0) {
  console.log(`⚠️ Cleanup had ${result.errors.length} errors (non-critical)`);
}
```
This helps debug cleanup issues and verify cleanup success.

## Cleanup Verification

### Check Test Report
After running tests, verify in the Mochawesome report:
1. All tests pass
2. No "leftover data" warnings
3. Cleanup messages appear in console logs

### Manual Verification
1. Run tests: `npm test`
2. Check production environment for test data
3. Verify no "Test Entry", "Filter Test", etc. entries remain

### Command to Run Tests with Cleanup
```bash
npm test
```

This runs all tests with cleanup hooks enabled.

## Troubleshooting

### Cleanup Not Running
**Symptom:** Test data remains after tests complete

**Solution:**
1. Verify `after()` hook exists in test file
2. Check that cleanup helper is imported
3. Verify XPath selectors match actual page structure
4. Check console logs for cleanup errors

### Cleanup Errors
**Symptom:** "Cleanup error (non-critical)" message

**Solution:**
1. These are non-critical and don't fail tests
2. Check the error message for specific issue
3. Verify element selectors are correct
4. Ensure proper sleep times between actions

### Items Not Being Found
**Symptom:** Cleanup says "Found 0 items"

**Solution:**
1. Verify test keywords match actual data
2. Check that Active tab is selected before cleanup
3. Verify item selector XPath is correct
4. Add debugging: log item text to verify matching

## Future Improvements

1. **Parallel Cleanup** - Run cleanup for multiple items simultaneously
2. **Retry Logic** - Retry failed cleanup operations
3. **Cleanup Verification** - Verify items are actually deleted
4. **Database Cleanup** - Direct database cleanup for faster execution
5. **Cleanup Dashboard** - Monitor cleanup success rates across test runs

## References

- **Cleanup Helper:** `tests/admin/test-cleanup-helper.js`
- **Chatbot Tests:** `tests/admin/chatbot.*.test.js`
- **Itinerary Tests:** `tests/admin/itinerary.*.test.js`
- **Tour Map Tests:** `tests/admin/tourmap.*.test.js`
- **Photobooth Tests:** `tests/admin/photobooth.*.test.js`
