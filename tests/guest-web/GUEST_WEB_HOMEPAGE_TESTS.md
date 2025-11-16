# Guest Web Homepage Tests

## Overview
Comprehensive tests for guest web homepage exploration functionality, including navigation to TourMap, site exploration, and media carousel testing.

## Test File
- **Location:** `tests/guest-web/guest-homepage.test.js`
- **Type:** Web (Desktop) - 1920x1080 viewport
- **Framework:** Mocha + Selenium WebDriver

## Test Coverage

### Guest Homepage Navigation (3 tests)
1. **Load guest homepage** - Verifies page loads at `/GuestHomepage`
2. **Display Explore button** - Confirms "Explore Intramuros" button exists
3. **Navigate to TourMap** - Tests that clicking Explore redirects to `/TourMap` (EXACT URL)

### Tour Map Site Exploration (2 tests)
1. **Display tour map with sites** - Verifies interactive elements on map
2. **Click a site with facade** - Tests clicking a site to view details

### Media Carousel Functionality (3 tests)
1. **Display media carousel** - Verifies images/carousel exists for site
2. **Navigate carousel with next button** - Tests clicking > button to advance images
3. **Navigate carousel with previous button** - Tests clicking < button to go back

### Functional Tests (3 tests)
1. **Interactive elements on tour map** - Confirms buttons/links exist
2. **Display site information** - Verifies site details are shown
3. **Allow closing site details** - Tests closing site modal/card

## Total Tests: 11

## Running Tests

### Web Only (Desktop)
```bash
npm run test:guest-web
```

### With Visual Feedback
```cmd
cmd /c "set BASE_URL=https://d39zx5gyblzxjs.cloudfront.net && set HEADLESS=false && set SLOW_MS=1500 && npm run test:guest-web"
```

### Homepage Tests Only
```cmd
cmd /c "set BASE_URL=https://d39zx5gyblzxjs.cloudfront.net && set HEADLESS=false && set SLOW_MS=1500 && .\node_modules\.bin\mocha.cmd tests/guest-web/guest-homepage.test.js --timeout 300000"
```

## Report
Generated at: `reports/guest-web-homepage-report.html`

## Test Philosophy

**NO SHORTCUTS - REAL TESTING ONLY**

- ✅ Tests fail if functionality genuinely doesn't work
- ✅ Tests verify EXACT URLs (e.g., `/TourMap` not just `/Tour`)
- ✅ Tests look for ACTUAL buttons (>, <, etc.)
- ✅ Tests don't fake or skip failures
- ✅ Tests report real issues that need fixing

## Key Test Points

### Explore Button Navigation
- Must navigate to EXACT URL: `/TourMap`
- Timeout: 20 seconds
- If navigation fails, test FAILS (no workarounds)

### Carousel Navigation
- Must find actual < and > buttons
- If buttons don't exist, test FAILS
- If buttons don't work, test FAILS

### Site Information
- Must display actual site details
- If details missing, test FAILS

## Environment Variables
- `BASE_URL` - Application URL (default: https://d39zx5gyblzxjs.cloudfront.net)
- `HEADLESS` - Browser visibility (true/false)
- `SLOW_MS` - Delay between actions (milliseconds)

## Viewport
- **Width:** 1920px
- **Height:** 1080px
- **Type:** Desktop/Web (NOT mobile)

## Dependencies
- Selenium WebDriver
- Mocha
- Mochawesome Reporter
- Chrome Browser

## Notes
- All tests run against LIVE production server
- Tests use real selectors, not hardcoded values
- Tests wait for actual page loads, not arbitrary delays
- Tests fail when functionality is missing (as intended)
