# Guest Web Tests

This folder contains automated tests for the guest web experience of the Juander Intramuros Tour Guide application.

## Folder Structure

```
tests/guest-web/
├── guest-login.test.js          # Guest login and homepage navigation tests
└── README.md                     # This file
```

## Test Coverage

### guest-login.test.js

Tests the complete guest login flow and guest homepage functionality.

#### Test Suites:

1. **Login Page Navigation**
   - ✅ Load login page successfully
   - ✅ Display login form elements (email, password, login button)
   - ✅ Display "Continue as Guest" button

2. **Guest Login Flow**
   - ✅ Navigate to login page
   - ✅ Click "Continue as Guest" button
   - ✅ Redirect to guest homepage (`/GuestHomepage`)
   - ✅ Display guest homepage content
   - ✅ Verify correct URL

3. **Guest Homepage Functional Tests**
   - ✅ Navigation elements present
   - ✅ Main content area present
   - ✅ Interactive elements (buttons, links)
   - ✅ Appropriate page title

4. **Guest Session Tests**
   - ✅ Guest session persists on page reload
   - ✅ No login required after continuing as guest

## Running the Tests

### Run all guest web tests:
```bash
$env:BASE_URL="https://d39zx5gyblzxjs.cloudfront.net"; $env:HEADLESS="false"; $env:SLOW_MS="1500"; .\node_modules\.bin\mocha.cmd "tests/guest-web/**/*.test.js" --reporter mochawesome --reporter-options reportDir=reports,reportFilename=guest-report,inlineAssets=true,overwrite=true,json=true,charts=true --timeout 300000
```

### Run with headless mode (no browser window):
```bash
$env:BASE_URL="https://d39zx5gyblzxjs.cloudfront.net"; $env:HEADLESS="true"; .\node_modules\.bin\mocha.cmd "tests/guest-web/**/*.test.js" --reporter mochawesome --reporter-options reportDir=reports,reportFilename=guest-report,inlineAssets=true,overwrite=true,json=true,charts=true --timeout 300000
```

### Run specific test file:
```bash
$env:BASE_URL="https://d39zx5gyblzxjs.cloudfront.net"; $env:HEADLESS="false"; .\node_modules\.bin\mocha.cmd "tests/guest-web/guest-login.test.js" --timeout 300000
```

## Environment Variables

- `BASE_URL` - Base URL of the application (default: `https://d39zx5gyblzxjs.cloudfront.net`)
- `HEADLESS` - Run browser in headless mode (default: `true`, set to `false` to see browser)
- `SLOW_MS` - Add delay between actions in milliseconds (default: `0`)

## Test Results

Latest test run: **13 passing** ✅

### Key Test Results:
- Login page loads successfully
- "Continue as Guest" button is visible and clickable
- Guest redirect to `/GuestHomepage` works correctly
- Guest session persists on page reload
- No login required for guest access

## Future Test Additions

This folder will be expanded to include:
- [ ] Guest homepage navigation tests
- [ ] Guest feature access tests
- [ ] Guest search functionality
- [ ] Guest tour viewing
- [ ] Guest review viewing
- [ ] Mobile guest web tests (separate folder)

## Notes

- Tests use Selenium WebDriver for browser automation
- Tests run against production environment by default
- Browser window is visible by default (set `HEADLESS=true` to hide)
- Tests include step-by-step logging for debugging
- All tests include proper waits and error handling
