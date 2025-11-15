# Mochawesome Report with Charts - Setup Guide

## What's Enabled

Your Mochawesome report now includes:

✅ **Pie Charts** - Pass/Fail/Pending test distribution  
✅ **Bar Charts** - Test duration and performance metrics  
✅ **Timeline Charts** - Test execution timeline  
✅ **Summary Statistics** - Total tests, passes, failures, pending  
✅ **Inline Assets** - All images and styles embedded in HTML  

## Updated Configuration

### package.json Scripts

```json
{
  "scripts": {
    "test": "mocha \"tests/**/*.test.js\" --reporter mochawesome --reporter-options reportDir=reports,reportFilename=modern-report,inlineAssets=true,overwrite=true,charts=true,chartDir=reports/charts",
    "test:tour-map": "mocha \"tests/admin/tourmap*.test.js\" --reporter mochawesome --reporter-options reportDir=reports,reportFilename=modern-report,inlineAssets=true,overwrite=true,charts=true,chartDir=reports/charts"
  }
}
```

### Reporter Options Explained

| Option | Value | Purpose |
|--------|-------|---------|
| `reportDir` | `reports` | Output directory for HTML report |
| `reportFilename` | `modern-report` | Report filename (generates `modern-report.html`) |
| `inlineAssets` | `true` | Embed all assets in HTML (single file) |
| `overwrite` | `true` | Overwrite previous report |
| `charts` | `true` | **Enable chart generation** |
| `chartDir` | `reports/charts` | Directory for chart data |

## Running Tests with Charts

### Run All Tests
```powershell
npm test
```

### Run Only Tour Map Tests
```powershell
npm run test:tour-map
```

### Run with Environment Variables
```powershell
$env:BASE_URL="https://d39zx5gyblzxjs.cloudfront.net"; $env:ADMIN_USER="juander714@gmail.com"; $env:ADMIN_PASS="Admin1234!"; $env:HEADLESS="false"; npm run test:tour-map
```

## Chart Types in Report

### 1. **Pass/Fail Pie Chart**
- Shows percentage of passing vs failing tests
- Color coded: Green (pass), Red (fail), Yellow (pending)
- Located at top of report

### 2. **Test Duration Bar Chart**
- Shows slowest tests
- Helps identify performance bottlenecks
- Sorted by duration (longest first)

### 3. **Test Suite Breakdown**
- Shows tests per suite
- Pass/fail count per suite
- Suite-level statistics

### 4. **Timeline View**
- Visual representation of test execution order
- Shows which tests ran when
- Helps identify parallel test issues

## Viewing the Report

### Option 1: Open HTML File
```powershell
Invoke-Item .\reports\modern-report.html
```

### Option 2: Open in Browser
```powershell
start .\reports\modern-report.html
```

### Option 3: View JSON Data
```powershell
Get-Content .\reports\modern-report.json | ConvertFrom-Json | ConvertTo-Json
```

## Report Contents

The generated report includes:

```
reports/
├── modern-report.html          # Main report (with embedded charts)
├── modern-report.json          # Raw test data
└── charts/                     # Chart data directory
    ├── chart-data.json         # Chart configuration
    └── [other chart files]
```

## Customizing Charts

To customize chart appearance, you can modify the Mochawesome configuration:

```powershell
# Add more options to reporter-options
--reporter-options reportDir=reports,reportFilename=modern-report,inlineAssets=true,overwrite=true,charts=true,chartDir=reports/charts,enableCharts=true,enableCode=true,enableLogs=true
```

### Additional Options

| Option | Default | Purpose |
|--------|---------|---------|
| `enableCode` | `true` | Show test code in report |
| `enableLogs` | `true` | Show console logs |
| `enableCharts` | `true` | Show charts |
| `showHooks` | `true` | Show before/after hooks |
| `showSkipped` | `false` | Show skipped tests |

## Example Report Output

Your report will show:

```
📊 Test Results Summary
├─ Total Tests: 49
├─ Passed: 45 (91.84%)
├─ Failed: 4 (8.16%)
├─ Pending: 0
└─ Duration: 6m 35s

📈 Charts
├─ Pass/Fail Distribution (Pie Chart)
├─ Test Duration (Bar Chart)
├─ Suite Breakdown (Pie Chart)
└─ Timeline (Timeline Chart)

📋 Test Details
├─ Suite 1: Tour Map Tests
│  ├─ ✅ Test 1 (2.5s)
│  ├─ ✅ Test 2 (3.1s)
│  └─ ❌ Test 3 (1.5s)
├─ Suite 2: Functional Tests
│  └─ ...
```

## Tips for Better Charts

1. **Consistent Test Naming** - Use clear, descriptive test names for better chart labels
2. **Reasonable Timeouts** - Set appropriate timeouts to avoid skewing duration charts
3. **Group Related Tests** - Use describe blocks to group tests for better suite breakdown
4. **Regular Runs** - Run tests regularly to track performance trends

## Troubleshooting

### Charts Not Appearing

1. Check that `charts=true` is in reporter options
2. Ensure `chartDir` directory is writable
3. Verify mochawesome-report-generator is installed:
   ```powershell
   npm list mochawesome-report-generator
   ```

### Report Not Generated

1. Check mocha output for errors
2. Verify `reportDir` exists or can be created
3. Check file permissions

### Large Report File

- If HTML is too large, disable `inlineAssets`:
  ```powershell
  --reporter-options reportDir=reports,reportFilename=modern-report,inlineAssets=false,overwrite=true,charts=true
  ```

## Next Steps

1. ✅ Run tests with: `npm run test:tour-map`
2. ✅ Open report: `Invoke-Item .\reports\modern-report.html`
3. ✅ Review charts and test results
4. ✅ Share report with team for analysis

## Integration with CI/CD

For GitHub Actions or other CI/CD:

```yaml
- name: Run Tests
  run: npm run test:tour-map

- name: Upload Report
  uses: actions/upload-artifact@v3
  with:
    name: test-report
    path: reports/modern-report.html
```

---

**Charts enabled!** Your Mochawesome reports now include visual analytics. 📊
