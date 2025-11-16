# Guest Web Tests - Summary

## Overview

Created comprehensive automated tests for the guest web experience of Juander Intramuros Tour Guide application.

## What Was Created

### 1. Folder Structure
```
tests/guest-web/
├── guest-login.test.js                    # Main test file (13 tests)
├── README.md                              # Documentation
└── GUEST_WEB_TESTS_SUMMARY.md            # This file
```

### 2. Test File: guest-login.test.js

**Total Tests:** 13 ✅ (All Passing)

#### Test Suites:

**A. Login Page Navigation (3 tests)**
- ✅ Load login page successfully
- ✅ Display login form elements (email, password, login button)
- ✅ Display "Continue as Guest" button

**B. Guest Login Flow (4 tests)**
- ✅ Navigate to login page
- ✅ Click "Continue as Guest" button and redirect to guest homepage
- ✅ Display guest homepage content
- ✅ Verify correct URL (`/GuestHomepage`)

**C. Guest Homepage Functional Tests (4 tests)**
- ✅ Navigation elements present
- ✅ Main content area present
- ✅ Interactive elements (buttons, links)
- ✅ Appropriate page title

**D. Guest Session Tests (2 tests)**
- ✅ Guest session persists on page reload
- ✅ No login required after continuing as guest

## Test Results

```
✅ 13 passing (13s)
```

### Key Findings:
- Login page loads successfully
- "Continue as Guest" button is visible and clickable
- Guest redirect works correctly: `/login` → `/GuestHomepage`
- Guest session persists across page reloads
- No authentication required for guest access
- Guest homepage has 2 buttons and 4 links
- Page title is appropriate

## Running the Tests

### Quick Start:
```bash
npm run test:guest-web
```

### With Environment Variables (PowerShell):
```powershell
$env:BASE_URL="https://d39zx5gyblzxjs.cloudfront.net"; $env:HEADLESS="false"; $env:SLOW_MS="1500"; npm run test:guest-web
```

### Run Specific Test:
```bash
mocha "tests/guest-web/guest-login.test.js" --timeout 300000
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `https://d39zx5gyblzxjs.cloudfront.net` | Application base URL |
| `HEADLESS` | `true` | Run browser in headless mode |
| `SLOW_MS` | `0` | Delay between actions (ms) |

## Test Coverage

### Tested Flows:
1. ✅ Login page accessibility
2. ✅ Guest login button visibility
3. ✅ Continue as guest flow
4. ✅ Redirect to guest homepage
5. ✅ Guest homepage content
6. ✅ Session persistence
7. ✅ No login requirement for guests

### Not Yet Tested (Future):
- [ ] Guest homepage navigation
- [ ] Guest feature access
- [ ] Guest search functionality
- [ ] Guest tour viewing
- [ ] Guest review viewing
- [ ] Mobile guest experience

## File Locations

- **Test File:** `c:\Users\sophi\Github\Juander\tests\guest-web\guest-login.test.js`
- **Report:** `c:\Users\sophi\Github\Juander\reports\guest-report.html`
- **Documentation:** `c:\Users\sophi\Github\Juander\tests\guest-web\README.md`

## npm Scripts Added

```json
{
  "test:guest-web": "mocha \"tests/guest-web/**/*.test.js\" --reporter mochawesome --reporter-options reportDir=reports,reportFilename=guest-report,inlineAssets=true,overwrite=true,json=true,charts=true --timeout 300000",
  "test:admin": "mocha \"tests/admin/**/*.test.js\" --reporter mochawesome --reporter-options reportDir=reports,reportFilename=modern-report,inlineAssets=true,overwrite=true,json=true,charts=true --timeout 300000"
}
```

## Next Steps

1. **Mobile Guest Tests** - Create `tests/guest-mobile/` folder for mobile guest experience
2. **Guest Features** - Add tests for guest homepage features
3. **Guest Navigation** - Test guest navigation and menu items
4. **Guest Search** - Test search functionality for guests
5. **Guest Tours** - Test tour viewing and interaction
6. **Guest Reviews** - Test review viewing functionality

## Notes

- All tests use Selenium WebDriver for browser automation
- Tests run against production environment
- Browser window is visible by default for debugging
- Tests include detailed step-by-step logging
- All tests have proper waits and error handling
- Tests are independent and can run in any order
