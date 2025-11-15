const fs = require('fs');
const path = require('path');

// Read the mochawesome JSON report
const reportPath = path.join(__dirname, 'reports', 'index.json');
const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

// Extract test data
const stats = reportData.stats;
const suites = reportData.results[0].suites;

// Group suites into high-level feature areas for clearer reporting
function getFeatureNameForSuite(title) {
    const t = (title || '').toLowerCase();

    if (t.includes('manual login')) {
        return 'Manual Login';
    }

    if (t.includes('authentication and authorization') ||
        t.includes('admin authentication') ||
        t.includes('admin content management') ||
        t.includes('adminhome') ||
        t.includes('admin home')) {
        return 'Homepage / Admin';
    }

    if (t.includes('tour map')) {
        return 'Tour Map';
    }

    if (t.includes('photobooth')) {
        return 'Photobooth';
    }

    return 'Other';
}

const featureGroups = {};
for (const suite of suites) {
    const featureName = getFeatureNameForSuite(suite.title);
    if (!featureGroups[featureName]) {
        featureGroups[featureName] = {
            suites: [],
            passes: 0,
            failures: 0,
            pending: 0
        };
    }

    featureGroups[featureName].suites.push(suite);

    const tests = suite.tests || [];
    featureGroups[featureName].passes += tests.filter(t => t.state === 'passed').length;
    featureGroups[featureName].failures += tests.filter(t => t.state === 'failed').length;
    featureGroups[featureName].pending += tests.filter(t => t.pending).length;
}

// Debug: Log the structure to understand the data
console.log('Stats:', JSON.stringify(stats, null, 2));
console.log('Number of suites:', suites.length);
console.log('Feature groups:', Object.keys(featureGroups));

// Aggregate execution stats
const totalExecuted =
    (stats.tests || stats.testsRegistered || (stats.passes + stats.failures + stats.pending)) || 0;
const passPercent = totalExecuted ? Math.round((stats.passes / totalExecuted) * 100) : 0;
const failPercent = totalExecuted ? Math.round((stats.failures / totalExecuted) * 100) : 0;
const pendingPercent = totalExecuted ? Math.max(0, 100 - passPercent - failPercent) : 0;

// Generate modern HTML report
const modernHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Juander Tour Map - Automated Test Results</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f3f4f6;
            min-height: 100vh;
            color: #111827;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #666;
            font-size: 1.1rem;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .summary-panel {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 24px;
            align-items: stretch;
        }

        .summary-main {
            flex: 0 0 260px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            padding: 20px 24px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
            text-align: center;
        }

        .summary-chart {
            width: 140px;
            height: 140px;
            border-radius: 9999px;
            margin: 0 auto 12px auto;
            box-shadow: inset 0 0 0 8px #f9fafb;
        }

        .summary-main h2 {
            font-size: 1.1rem;
            margin-bottom: 8px;
            color: #374151;
        }

        .summary-percentage {
            font-size: 2.6rem;
            font-weight: 700;
            color: #10b981;
            margin-bottom: 4px;
        }

        .summary-subtitle {
            font-size: 0.9rem;
            color: #6b7280;
        }

        .summary-details {
            flex: 1;
            min-width: 260px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            padding: 16px 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
            display: grid;
            gap: 8px;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.9rem;
            color: #4b5563;
        }

        .summary-label {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .summary-dot {
            width: 10px;
            height: 10px;
            border-radius: 9999px;
        }

        .dot-pass { background: #10b981; }
        .dot-fail { background: #ef4444; }
        .dot-pending { background: #f59e0b; }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-icon {
            font-size: 2.5rem;
            margin-bottom: 15px;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .stat-label {
            color: #666;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .passing { color: #10b981; }
        .failing { color: #ef4444; }
        .pending { color: #f59e0b; }
        .duration { color: #6366f1; }
        
        .test-suites {
            display: grid;
            gap: 20px;
        }

        .feature-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px 24px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
        }

        .feature-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }

        .feature-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: #111827;
        }

        .feature-stats {
            display: flex;
            gap: 12px;
            font-size: 0.9rem;
            color: #4b5563;
        }

        .feature-body {
            margin-top: 10px;
            display: grid;
            gap: 12px;
        }
        
        .suite-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        .suite-header {
            padding: 20px 25px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .suite-title {
            font-size: 1.2rem;
            font-weight: 600;
        }
        
        .suite-stats {
            display: flex;
            gap: 15px;
            font-size: 0.9rem;
        }
        
        .suite-body {
            padding: 0;
        }
        
        .test-item {
            padding: 20px 25px;
            border-bottom: 1px solid #f1f5f9;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: background-color 0.2s ease;
        }
        
        .test-item:hover {
            background-color: #f8fafc;
        }
        
        .test-item:last-child {
            border-bottom: none;
        }
        
        .test-info {
            flex: 1;
        }
        
        .test-title {
            font-weight: 500;
            margin-bottom: 5px;
        }
        
        .test-duration {
            color: #666;
            font-size: 0.85rem;
        }
        
        .test-status {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-passing {
            background: #dcfce7;
            color: #166534;
        }
        
        .status-failing {
            background: #fef2f2;
            color: #991b1b;
        }
        
        .error-details {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin-top: 10px;
            border-radius: 0 8px 8px 0;
            font-family: 'Courier New', monospace;
            font-size: 0.85rem;
            color: #991b1b;
            white-space: pre-wrap;
        }
        
        .footer {
            text-align: center;
            padding: 30px;
            color: #6b7280;
            margin-top: 30px;
        }
        
        .environment-info {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        .env-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .env-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .env-icon {
            color: #667eea;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .suite-header {
                flex-direction: column;
                gap: 10px;
                text-align: center;
            }
            
            .test-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><i class="fas fa-map-marked-alt"></i> Juander Tour Map</h1>
            <p>Automated Test Results - Production Environment</p>
        </div>
        
        <div class="environment-info">
            <h3 style="margin-bottom: 15px; color: #333;"><i class="fas fa-cog"></i> Test Environment</h3>
            <div class="env-grid">
                <div class="env-item">
                    <i class="fas fa-globe env-icon"></i>
                    <span><strong>URL:</strong> https://d39zx5gyblzxjs.cloudfront.net</span>
                </div>
                <div class="env-item">
                    <i class="fas fa-user-shield env-icon"></i>
                    <span><strong>User:</strong> juander714@gmail.com</span>
                </div>
                <div class="env-item">
                    <i class="fas fa-calendar env-icon"></i>
                    <span><strong>Date:</strong> ${new Date().toLocaleString()}</span>
                </div>
                <div class="env-item">
                    <i class="fas fa-robot env-icon"></i>
                    <span><strong>Framework:</strong> Selenium + Mocha</span>
                </div>
            </div>
        </div>

        <div class="summary-panel">
            <div class="summary-main">
                <h2>Overall Result</h2>
                <div 
                  class="summary-chart"
                  style="background: conic-gradient(
                    #10b981 0 ${passPercent}%,
                    #ef4444 ${passPercent}% ${passPercent + failPercent}%,
                    #f59e0b ${passPercent + failPercent}% 100%
                  );">
                </div>
                <div class="summary-percentage">${passPercent}%</div>
                <div class="summary-subtitle">${stats.passes} of ${totalExecuted} tests passed</div>
            </div>
            <div class="summary-details">
                <div class="summary-row">
                    <div class="summary-label"><span class="summary-dot dot-pass"></span> Passed</div>
                    <div>${stats.passes || 0} (${passPercent}%)</div>
                </div>
                <div class="summary-row">
                    <div class="summary-label"><span class="summary-dot dot-fail"></span> Failed</div>
                    <div>${stats.failures || 0} (${failPercent}%)</div>
                </div>
                <div class="summary-row">
                    <div class="summary-label"><span class="summary-dot dot-pending"></span> Pending</div>
                    <div>${stats.pending || 0} (${pendingPercent}%)</div>
                </div>
                <div class="summary-row">
                    <div class="summary-label"><i class="fas fa-stopwatch"></i> Duration</div>
                    <div>${stats.duration ? Math.round(stats.duration / 1000) + 's' : 'N/A'}</div>
                </div>
            </div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon passing"><i class="fas fa-check-circle"></i></div>
                <div class="stat-number passing">${stats.passes || 0}</div>
                <div class="stat-label">Passing Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon failing"><i class="fas fa-times-circle"></i></div>
                <div class="stat-number failing">${stats.failures || 0}</div>
                <div class="stat-label">Failing Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon pending"><i class="fas fa-clock"></i></div>
                <div class="stat-number pending">${stats.pending || 0}</div>
                <div class="stat-label">Pending Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon duration"><i class="fas fa-stopwatch"></i></div>
                <div class="stat-number duration">${stats.duration ? Math.round(stats.duration / 1000) + 's' : 'N/A'}</div>
                <div class="stat-label">Total Duration</div>
            </div>
        </div>
        
        <div class="test-suites">
            ${Object.entries(featureGroups).map(([featureName, group]) => `
                <div class="feature-card">
                    <div class="feature-header">
                        <div class="feature-title">
                            <i class="fas fa-layer-group"></i> ${featureName}
                        </div>
                        <div class="feature-stats">
                            <span><i class="fas fa-check"></i> ${group.passes}</span>
                            <span><i class="fas fa-times"></i> ${group.failures}</span>
                            <span><i class="fas fa-clock"></i> ${group.pending}</span>
                        </div>
                    </div>
                    <div class="feature-body">
                        ${group.suites.map(suite => `
                            <div class="suite-card">
                                <div class="suite-header">
                                    <div class="suite-title">
                                        <i class="fas fa-folder-open"></i> ${suite.title}
                                    </div>
                                    <div class="suite-stats">
                                        <span><i class="fas fa-check"></i> ${suite.tests ? suite.tests.filter(t => t.state === 'passed').length : 0}</span>
                                        <span><i class="fas fa-times"></i> ${suite.tests ? suite.tests.filter(t => t.state === 'failed').length : 0}</span>
                                        <span><i class="fas fa-clock"></i> ${suite.tests ? suite.tests.filter(t => t.pending).length : 0}</span>
                                    </div>
                                </div>
                                <div class="suite-body">
                                    ${(suite.tests || []).map(test => `
                                        <div class="test-item">
                                            <div class="test-info">
                                                <div class="test-title">${test.title || 'Untitled Test'}</div>
                                                <div class="test-duration">
                                                    <i class="fas fa-stopwatch"></i> ${test.duration ? test.duration + 'ms' : 'N/A'}
                                                </div>
                                                ${test.err && test.err.message ? `
                                                    <div class="error-details">
                                                        <strong>Error:</strong> ${test.err.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                                                    </div>
                                                ` : ''}
                                            </div>
                                            <div class="test-status status-${test.state === 'passed' ? 'passing' : test.state === 'failed' ? 'failing' : 'pending'}">
                                                ${test.state === 'passed' ? '<i class="fas fa-check"></i> Passed' : 
                                                  test.state === 'failed' ? '<i class="fas fa-times"></i> Failed' : 
                                                  test.pending ? '<i class="fas fa-clock"></i> Pending' :
                                                  '<i class="fas fa-times"></i> Failed'}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <p><i class="fas fa-code"></i> Generated by Cascade AI • Automated Testing Framework</p>
            <p>Juander Intramuros Tour Guide - Capstone Project</p>
        </div>
    </div>
</body>
</html>
`;

// Write the modern report
const modernReportPath = path.join(__dirname, 'reports', 'modern-report.html');
fs.writeFileSync(modernReportPath, modernHTML);

console.log('✅ Modern report generated at:', modernReportPath);
