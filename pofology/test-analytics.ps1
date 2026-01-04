# PowerShell script to test analytics APIs
$baseUrl = "http://localhost:3001"

Write-Host "🧪 Testing Analytics System" -ForegroundColor Cyan
Write-Host "=" * 50

# Test 1: Track a page view
Write-Host "`n1️⃣ Testing /api/analytics/track" -ForegroundColor Yellow
try {
    $trackData = @{
        ip = "127.0.0.1"
        country = "Vietnam"
        city = "Hanoi"
        device = "desktop"
        browser = "Chrome"
        browserVersion = "143"
        os = "Windows"
        page = "/test-page"
        referrer = ""
        userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        sessionId = "test-session-$(Get-Date -Format 'yyyyMMddHHmmss')"
        timeOnPage = 10
        isNewVisitor = $true
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/analytics/track" `
        -Method POST `
        -ContentType "application/json" `
        -Body $trackData

    Write-Host "✅ Track Response:" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ Track Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Get statistics
Write-Host "`n2️⃣ Testing /api/analytics/stats" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/analytics/stats?range=day"
    Write-Host "✅ Stats Response:" -ForegroundColor Green
    Write-Host "   Total Visitors: $($response.totalVisitors)"
    Write-Host "   Total Page Views: $($response.totalPageViews)"
    Write-Host "   Unique Visitors: $($response.uniqueVisitors)"
    Write-Host "   Top Pages: $($response.topPages.Count)"
} catch {
    Write-Host "❌ Stats Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Get location
Write-Host "`n3️⃣ Testing /api/analytics/location" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/analytics/location"
    Write-Host "✅ Location Response:" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ Location Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n" + ("=" * 50)
Write-Host "✅ Testing completed!" -ForegroundColor Green

