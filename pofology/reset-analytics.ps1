# Script to reset analytics data and test
Write-Host "Resetting analytics data..." -ForegroundColor Yellow

# Reset MongoDB and in-memory storage
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/reset-all" -Method Post
    Write-Host "Reset complete:" -ForegroundColor Green
    Write-Host "MongoDB deleted: $($response.mongoDeleted) records" -ForegroundColor Cyan
    Write-Host "Memory cleared: $($response.memoryCleared) records" -ForegroundColor Cyan
} catch {
    Write-Host "Error resetting analytics: $_" -ForegroundColor Red
}

Write-Host "`nCurrent stats:" -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/stats?range=day" -Method Get
    Write-Host "Total Page Views: $($stats.totalPageViews)" -ForegroundColor Cyan
    Write-Host "Unique Visitors: $($stats.uniqueVisitors)" -ForegroundColor Cyan
    Write-Host "Top Browsers: $($stats.topBrowsers | ConvertTo-Json -Compress)" -ForegroundColor Cyan
    Write-Host "Top Countries: $($stats.topCountries | ConvertTo-Json -Compress)" -ForegroundColor Cyan
} catch {
    Write-Host "Error getting stats: $_" -ForegroundColor Red
}

Write-Host "`nDone! Now refresh your browser and check the dashboard." -ForegroundColor Green
