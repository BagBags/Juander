# Mapbox Rate Limit Handling Tests

## Overview

Comprehensive automated test suite for Mapbox API rate limit handling using Selenium WebDriver, Mocha, and Mochawesome reporting.

**Test File:** `mapbox.rate-limit.test.js`
**Test Script:** `npm run test:mapbox-rate-limit`
**Report:** `reports/mapbox-rate-limit-report.html`

## Test Coverage

### 1. Mapbox API Rate Limit Monitoring (7 tests)

#### Test 1.1: Load TourMap Without Rate Limit Errors
- **Purpose:** Verify that the TourMap loads successfully without triggering rate limit errors
- **Steps:**
  1. Login to production
  2. Navigate to TourMap
  3. Verify map canvas is rendered
  4. Check browser console for rate limit errors (429, quota exceeded, etc.)
- **Expected Result:** Map loads without rate limit errors
- **Failure Condition:** Any 429 or rate limit error messages detected

#### Test 1.2: Handle Rapid Map Interactions Without Rate Limiting
- **Purpose:** Ensure rapid zoom interactions don't trigger rate limits
- **Steps:**
  1. Navigate to AdminTourMap
  2. Perform 5 rapid zoom interactions (wheel events)
  3. Verify map remains responsive
- **Expected Result:** Map handles rapid interactions gracefully
- **Failure Condition:** Map becomes unresponsive or throws errors

#### Test 1.3: Handle Multiple Simultaneous API Requests
- **Purpose:** Verify the application handles concurrent API requests properly
- **Steps:**
  1. Navigate to TourMap
  2. Trigger multiple search requests
  3. Monitor network requests
  4. Check for 429 (Too Many Requests) responses
- **Expected Result:** No 429 responses received
- **Failure Condition:** Multiple 429 responses detected

#### Test 1.4: Gracefully Handle Rate Limit Responses With Retry Logic
- **Purpose:** Ensure the app implements proper retry logic for rate-limited requests
- **Steps:**
  1. Navigate to AdminTourMap
  2. Simulate rate limit conditions
  3. Perform map pan operation
  4. Verify map remains functional
- **Expected Result:** Map continues to function despite simulated rate limits
- **Failure Condition:** Map becomes unresponsive

#### Test 1.5: Display User-Friendly Error Message on Rate Limit
- **Purpose:** Verify that users see helpful error messages during rate limiting
- **Steps:**
  1. Navigate to TourMap
  2. Simulate rate limit error
  3. Check for error notification/toast
  4. Verify map doesn't crash
- **Expected Result:** Error message displayed, map remains visible
- **Failure Condition:** Map crashes or no error feedback

#### Test 1.6: Maintain Map State During Rate Limit Recovery
- **Purpose:** Ensure map state (zoom, center, etc.) is preserved during rate limit recovery
- **Steps:**
  1. Navigate to AdminTourMap
  2. Record initial map state (zoom level)
  3. Simulate rate limit and recovery
  4. Verify map state is preserved
- **Expected Result:** Map state remains consistent
- **Failure Condition:** Map state changes unexpectedly

#### Test 1.7: Handle Mapbox Token Expiration Gracefully
- **Purpose:** Verify proper handling of token expiration scenarios
- **Steps:**
  1. Navigate to TourMap
  2. Verify map loads with valid token
  3. Check token validation
  4. Verify map functionality
- **Expected Result:** Map functions correctly with valid token
- **Failure Condition:** Map fails to load or render

### 2. Mapbox API Rate Limit Monitoring - Advanced (1 test)

#### Test 2.1: Implement Exponential Backoff for Retries
- **Purpose:** Verify that retry attempts follow exponential backoff pattern
- **Steps:**
  1. Navigate to AdminTourMap
  2. Inject retry tracking
  3. Perform map operations
  4. Analyze retry attempt timing
- **Expected Result:** Retry delays increase exponentially
- **Failure Condition:** Retries occur at constant intervals

#### Test 2.2: Cache Mapbox Responses to Reduce API Calls
- **Purpose:** Verify that responses are cached to minimize API calls
- **Steps:**
  1. Navigate to TourMap and track API calls
  2. Navigate away and back to TourMap
  3. Compare API call counts
- **Expected Result:** Second load uses fewer API calls (cached responses)
- **Failure Condition:** Same number of API calls on both loads

#### Test 2.3: Handle Offline Mode Gracefully
- **Purpose:** Ensure map gracefully handles offline scenarios
- **Steps:**
  1. Navigate to TourMap
  2. Simulate offline mode
  3. Verify map handles offline state
  4. Restore online mode
  5. Verify map recovers
- **Expected Result:** Map handles offline/online transitions smoothly
- **Failure Condition:** Map crashes or doesn't recover

### 3. Mapbox Geocoding Rate Limits (2 tests)

#### Test 3.1: Handle Geocoding API Rate Limits
- **Purpose:** Verify geocoding requests don't exceed rate limits
- **Steps:**
  1. Navigate to AdminTourMap
  2. Perform multiple rapid searches
  3. Check for geocoding errors
- **Expected Result:** No geocoding errors detected
- **Failure Condition:** Geocoding errors or failed searches

#### Test 3.2: Handle Directions API Rate Limits
- **Purpose:** Verify directions/routing requests handle rate limits
- **Steps:**
  1. Navigate to TourMap
  2. Look for directions functionality
  3. Verify directions API is available
- **Expected Result:** Directions API available and functional
- **Failure Condition:** Directions API unavailable or errors

### 4. Mapbox Styles and Layers Rate Limits (2 tests)

#### Test 4.1: Handle Style Loading Without Rate Limits
- **Purpose:** Verify map styles load without rate limit issues
- **Steps:**
  1. Navigate to AdminTourMap
  2. Check map style loading
  3. Verify map is rendered
- **Expected Result:** Map style loads and renders correctly
- **Failure Condition:** Map style fails to load

#### Test 4.2: Handle Layer Toggling Without Rate Limits
- **Purpose:** Ensure rapid layer toggling doesn't trigger rate limits
- **Steps:**
  1. Navigate to TourMap
  2. Toggle layers rapidly
  3. Verify map remains responsive
- **Expected Result:** Map handles layer toggling smoothly
- **Failure Condition:** Map becomes unresponsive

## Running the Tests

### Run All Mapbox Rate Limit Tests
```bash
npm run test:mapbox-rate-limit
```

### Run Specific Test Suite
```bash
mocha tests/admin/mapbox.rate-limit.test.js --grep "Mapbox API Rate Limit Monitoring"
```

### Run with Custom Options
```bash
HEADLESS=true BASE_URL=https://your-domain.com npm run test:mapbox-rate-limit
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `https://d39zx5gyblzxjs.cloudfront.net` | Application URL |
| `HEADLESS` | `false` | Run browser in headless mode |
| `ADMIN_USER` | `juander714@gmail.com` | Admin email for login |
| `ADMIN_PASS` | `Admin1234!` | Admin password for login |
| `SLOW_MS` | `1000` | Delay between steps (ms) |

## Test Report

### Report Location
- **File:** `reports/mapbox-rate-limit-report.html`
- **Format:** Mochawesome HTML report with charts and statistics

### Report Features
- ✅ Test pass/fail status
- ✅ Execution time for each test
- ✅ Console logs and errors
- ✅ Charts and statistics
- ✅ Offline viewing (inline assets)

## Key Testing Principles

### 1. No Shortcuts
- Tests verify actual functionality, not mocked behavior
- Real Mapbox API calls are made
- Actual rate limit scenarios are simulated

### 2. Proper Error Handling
- Tests check for genuine rate limit errors (429 status)
- User-friendly error messages are verified
- Graceful degradation is tested

### 3. Realistic Scenarios
- Rapid interactions simulate real user behavior
- Multiple simultaneous requests test concurrent handling
- Offline/online transitions test resilience

### 4. Comprehensive Coverage
- API rate limits (429 errors)
- Geocoding rate limits
- Directions API rate limits
- Style and layer loading
- Token expiration
- Offline mode

## Expected Behaviors

### Rate Limit Handling
1. **Detection:** Application detects 429 responses
2. **User Feedback:** Clear error message displayed
3. **Retry Logic:** Exponential backoff implemented
4. **Recovery:** Map recovers when rate limit expires
5. **State Preservation:** Map state maintained during recovery

### Caching Strategy
1. **Response Caching:** Mapbox responses cached locally
2. **Reduced Calls:** Subsequent requests use cache
3. **Cache Invalidation:** Old cache properly invalidated
4. **Offline Support:** Cached data available offline

### Error Recovery
1. **Graceful Degradation:** App remains usable
2. **User Notification:** Clear error messages
3. **Automatic Retry:** Failed requests retried
4. **State Recovery:** Map state restored after errors

## Troubleshooting

### Tests Timing Out
- Increase `SLOW_MS` environment variable
- Increase test timeout in mocha configuration
- Check network connectivity

### Rate Limit Errors in Tests
- Verify Mapbox token is valid
- Check API quota limits
- Review rate limit policies
- Consider implementing request throttling

### Map Not Loading
- Verify BASE_URL is correct
- Check browser console for errors
- Verify Mapbox token in frontend code
- Check CORS configuration

### Login Issues
- Verify ADMIN_USER and ADMIN_PASS
- Check user account status
- Verify authentication endpoint
- Review production-login-helper.js

## Best Practices

### 1. Rate Limit Prevention
- Implement request throttling
- Use response caching
- Batch API requests
- Implement exponential backoff

### 2. User Experience
- Show clear error messages
- Provide retry options
- Maintain app functionality
- Preserve user state

### 3. Monitoring
- Log rate limit events
- Track API usage
- Monitor error rates
- Alert on threshold breaches

### 4. Testing
- Test rate limit scenarios
- Verify retry logic
- Test offline mode
- Verify state preservation

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run Mapbox Rate Limit Tests
  run: npm run test:mapbox-rate-limit
  env:
    BASE_URL: ${{ secrets.PRODUCTION_URL }}
    ADMIN_USER: ${{ secrets.ADMIN_USER }}
    ADMIN_PASS: ${{ secrets.ADMIN_PASS }}
```

### Jenkins Example
```groovy
stage('Mapbox Rate Limit Tests') {
  steps {
    sh 'npm run test:mapbox-rate-limit'
    publishHTML([
      reportDir: 'reports',
      reportFiles: 'mapbox-rate-limit-report.html',
      reportName: 'Mapbox Rate Limit Report'
    ])
  }
}
```

## Related Documentation

- [Mapbox API Documentation](https://docs.mapbox.com/)
- [Mapbox Rate Limits](https://docs.mapbox.com/api/overview/rate-limits/)
- [Selenium WebDriver Documentation](https://www.selenium.dev/documentation/)
- [Mocha Testing Framework](https://mochajs.org/)
- [Mochawesome Reporter](https://adamgruber.github.io/mochawesome/)

## Test Maintenance

### Regular Updates
- Review Mapbox API changes
- Update rate limit thresholds
- Verify test selectors
- Update documentation

### Monitoring
- Track test pass rates
- Monitor execution times
- Review error patterns
- Analyze rate limit events

### Improvements
- Add new test scenarios
- Enhance error detection
- Improve test reliability
- Optimize test performance

## Support

For issues or questions:
1. Check test logs in `reports/mapbox-rate-limit-report.html`
2. Review browser console output
3. Check Mapbox API status
4. Verify network connectivity
5. Contact development team

---

**Last Updated:** 2025
**Test Version:** 1.0
**Status:** Active
