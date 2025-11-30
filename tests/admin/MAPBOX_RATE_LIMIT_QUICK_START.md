# Mapbox Rate Limit Tests - Quick Start Guide

## Run Tests

```bash
# Run all Mapbox rate limit tests
npm run test:mapbox-rate-limit

# Run with headless browser
HEADLESS=true npm run test:mapbox-rate-limit

# Run specific test suite
mocha tests/admin/mapbox.rate-limit.test.js --grep "API Rate Limit Monitoring"
```

## Test Report

After running tests, open the report:
```
reports/mapbox-rate-limit-report.html
```

## What Gets Tested

### ✅ Rate Limit Detection
- 429 (Too Many Requests) responses
- Quota exceeded errors
- Rate limit error messages

### ✅ User Experience
- Error messages displayed
- Map remains functional
- State is preserved

### ✅ Retry Logic
- Exponential backoff implemented
- Retry attempts tracked
- Recovery after rate limit

### ✅ Caching
- Responses cached locally
- Reduced API calls on reload
- Cache invalidation

### ✅ Offline Mode
- Graceful offline handling
- Recovery when online
- Cached data available

### ✅ API Endpoints
- Mapbox Styles API
- Geocoding API
- Directions API
- Layers API

## Test Structure

```
mapbox.rate-limit.test.js
├── Mapbox API Rate Limit Monitoring (7 tests)
│   ├── Load without errors
│   ├── Rapid interactions
│   ├── Multiple simultaneous requests
│   ├── Graceful rate limit handling
│   ├── User-friendly error messages
│   ├── State preservation
│   ├── Token expiration
│   ├── Exponential backoff
│   ├── Response caching
│   └── Offline mode
├── Mapbox Geocoding Rate Limits (2 tests)
│   ├── Geocoding API rate limits
│   └── Directions API rate limits
└── Mapbox Styles and Layers (2 tests)
    ├── Style loading
    └── Layer toggling
```

## Environment Variables

```bash
# Custom URL
BASE_URL=https://your-domain.com npm run test:mapbox-rate-limit

# Headless mode
HEADLESS=true npm run test:mapbox-rate-limit

# Slower execution (for debugging)
SLOW_MS=2000 npm run test:mapbox-rate-limit

# Custom credentials
ADMIN_USER=your@email.com ADMIN_PASS=password npm run test:mapbox-rate-limit
```

## Expected Results

### ✅ All Tests Pass
- No rate limit errors detected
- Map loads and functions correctly
- Retry logic works properly
- Caching reduces API calls
- Offline mode handled gracefully

### ❌ Test Failures
- Rate limit errors (429) detected
- Map becomes unresponsive
- Retry logic not working
- Caching not implemented
- Offline mode crashes

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Tests timeout | Increase `SLOW_MS` or mocha timeout |
| Login fails | Verify `ADMIN_USER` and `ADMIN_PASS` |
| Map not loading | Check `BASE_URL` and network |
| Rate limit errors | Check Mapbox token and quota |
| Browser crashes | Run with `HEADLESS=true` |

## Key Test Scenarios

### Scenario 1: Rapid Map Interactions
```
User zooms in/out quickly
→ Test performs 5 rapid zoom events
→ Verify map stays responsive
```

### Scenario 2: Multiple Searches
```
User performs multiple searches
→ Test triggers 3 rapid searches
→ Verify no 429 errors
```

### Scenario 3: Offline Mode
```
User loses internet connection
→ Test simulates offline event
→ Verify map handles gracefully
→ Test restores online
→ Verify map recovers
```

### Scenario 4: Rate Limit Recovery
```
API returns 429 error
→ Test tracks retry attempts
→ Verify exponential backoff
→ Verify map recovers
```

## Report Features

- **Pass/Fail Status** - Clear test results
- **Execution Time** - Performance metrics
- **Console Logs** - Debugging information
- **Charts** - Visual statistics
- **Offline Viewing** - No internet needed

## Next Steps

1. **Run tests:** `npm run test:mapbox-rate-limit`
2. **Review report:** Open `reports/mapbox-rate-limit-report.html`
3. **Check results:** Look for ✅ or ❌ status
4. **Debug failures:** Check console logs in report
5. **Fix issues:** Address any rate limit problems

## Common Patterns

### Check for Rate Limit Errors
```javascript
const rateLimitErrors = consoleLogs.filter(log => 
  log.includes('429') || log.includes('rate limit')
);
```

### Verify Map Functionality
```javascript
const mapCanvas = await driver.findElement(
  By.xpath("//div[contains(@class, 'mapboxgl-canvas')]")
);
```

### Simulate Rapid Interactions
```javascript
for (let i = 0; i < 5; i++) {
  await driver.executeScript('// zoom event');
  await driver.sleep(200);
}
```

## Performance Metrics

- **Test Duration:** ~5-10 minutes (all tests)
- **Single Test:** ~30-60 seconds
- **Network Requests:** ~50-100 per test
- **API Calls:** Varies by test

## Integration

### Add to CI/CD Pipeline
```yaml
- name: Mapbox Rate Limit Tests
  run: npm run test:mapbox-rate-limit
```

### Schedule Regular Runs
- Daily: Check rate limit handling
- Weekly: Full regression
- Before deployment: Verify stability

## Support

- **Documentation:** See `MAPBOX_RATE_LIMIT_TESTS.md`
- **Report:** Check `reports/mapbox-rate-limit-report.html`
- **Logs:** Review browser console output
- **Status:** Check Mapbox API status page

---

**Quick Reference:** Run `npm run test:mapbox-rate-limit` and check `reports/mapbox-rate-limit-report.html`
