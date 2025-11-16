# Guest Mobile Tests

This folder contains automated tests for the mobile guest experience of the Juander Intramuros Tour Guide application.

## Folder Structure

```
tests/guest-mobile/
├── guest-mobile-login.test.js   # Mobile guest login and homepage tests
└── README.md                     # This file
```

## Test Coverage

### guest-mobile-login.test.js

Tests the complete mobile guest login flow and mobile guest homepage functionality.

#### Test Suites:

1. **Mobile Login Page Navigation (4 tests)**
   - ✅ Load login page on mobile successfully
   - ✅ Display mobile-optimized login form
   - ✅ Display "Continue as Guest" button on mobile
   - ✅ Verify mobile-friendly button sizing

2. **Mobile Guest Login Flow (4 tests)**
   - ✅ Navigate to login page on mobile
   - ✅ Click "Continue as Guest" button on mobile
   - ✅ Redirect to guest homepage (`/GuestHomepage`)
   - ✅ Verify correct mobile URL

3. **Mobile Guest Homepage Functional Tests (5 tests)**
   - ✅ Mobile-optimized layout
   - ✅ Navigation elements on mobile
   - ✅ Mobile-friendly button sizing
   - ✅ Clickable elements
   - ✅ Appropriate page title

4. **Mobile Guest Session Tests (2 tests)**
   - ✅ Guest session persists on mobile page reload
   - ✅ No login required after continuing as guest on mobile

5. **Mobile Touch Interaction Tests (2 tests)**
   - ✅ Support touch interactions on mobile
   - ✅ Proper spacing for mobile touch targets

## Mobile Viewport

- **Width:** 375px (iPhone SE/6/7/8)
- **Height:** 667px (Portrait mode)
- **User Agent:** iPhone iOS 14.6
- **Touch Support:** Simulated

## Running the Tests

### Run all mobile guest tests:
```bash
npm run test:guest-mobile
```

### Run with environment variables (PowerShell):
```powershell
$env:BASE_URL="https://d39zx5gyblzxjs.cloudfront.net"; $env:HEADLESS="false"; $env:SLOW_MS="1500"; npm run test:guest-mobile
```

### Run specific test file:
```bash
mocha "tests/guest-mobile/guest-mobile-login.test.js" --timeout 300000
```

### Run with headless mode:
```bash
$env:BASE_URL="https://d39zx5gyblzxjs.cloudfront.net"; $env:HEADLESS="true"; npm run test:guest-mobile
```

## Environment Variables

- `BASE_URL` - Base URL of the application (default: `https://d39zx5gyblzxjs.cloudfront.net`)
- `HEADLESS` - Run browser in headless mode (default: `true`, set to `false` to see browser)
- `SLOW_MS` - Add delay between actions in milliseconds (default: `0`)

## Mobile Testing Features

### Viewport Simulation
- iPhone SE/6/7/8 dimensions (375x667px)
- Mobile user agent string
- Touch-friendly interface

### Mobile-Specific Tests
- Button sizing (44x44px minimum for touch)
- Touch target spacing
- Orientation changes (portrait/landscape)
- Mobile layout optimization

### Accessibility
- Mobile navigation elements
- Touch-friendly buttons
- Readable text on small screens
- Proper spacing between interactive elements

## Test Results

Expected: **17 passing tests** ✅

### Key Test Results:
- Mobile login page loads successfully
- "Continue as Guest" button is visible and mobile-friendly
- Guest redirect works on mobile
- Mobile session persists on page reload
- Touch targets are properly sized
- Orientation changes handled gracefully

## Future Test Additions

This folder will be expanded to include:
- [ ] Mobile homepage navigation
- [ ] Mobile feature access
- [ ] Mobile search functionality
- [ ] Mobile tour viewing
- [ ] Mobile review viewing
- [ ] Mobile performance tests
- [ ] Mobile responsive breakpoint tests

## Notes

- Tests use Selenium WebDriver for browser automation
- Tests run against production environment by default
- Browser window is visible by default (set `HEADLESS=true` to hide)
- Mobile viewport is 375x667px (iPhone SE/6/7/8)
- Tests include step-by-step logging for debugging
- All tests include proper waits and error handling
- Touch interactions are simulated

## Comparison: Web vs Mobile

| Feature | Web | Mobile |
|---------|-----|--------|
| Viewport | 1920x1080 | 375x667 |
| User Agent | Desktop | iPhone iOS |
| Touch Support | No | Yes |
| Button Size | Standard | 44x44px minimum |
| Orientation | Fixed | Portrait/Landscape |
| Tests | 13 | 17 |
