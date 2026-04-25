# test-deployment.ps1
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🧪 Testing Liturgical Calendar Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Set your Render URL
$RENDER_URL = "https://zuca-portal2.onrender.com"
$LOCAL_URL = "http://localhost:5000"

# Choose which to test
Write-Host "🌐 Select environment:" -ForegroundColor Yellow
Write-Host "1) Render ($RENDER_URL)"
Write-Host "2) Local ($LOCAL_URL)"
$choice = Read-Host "Enter choice (1 or 2)"

if ($choice -eq "2") {
    $BASE_URL = $LOCAL_URL
    Write-Host "Testing Local server..." -ForegroundColor Yellow
} else {
    $BASE_URL = $RENDER_URL
    Write-Host "Testing Render deployment..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "📅 Testing Date Queries" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Test 1: March 19, 2024 (St. Joseph)
Write-Host "`n1. Testing March 19, 2024 (St. Joseph):" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/calendar/date/2024/3/19" -ErrorAction Stop
    Write-Host "   Celebration: $($response.celebration)"
    if ($response.celebration -like "*Joseph*") {
        Write-Host "   ✅ St. Joseph found" -ForegroundColor Green
    } else {
        Write-Host "   ❌ St. Joseph not found" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
}

# Test 2: Future date 2050-03-19
Write-Host "`n2. Testing March 19, 2050 (future via infinite calendar):" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/calendar/date/2050/3/19" -ErrorAction Stop
    Write-Host "   Celebration: $($response.celebration)"
    if ($response.celebration -like "*Joseph*") {
        Write-Host "   ✅ Future date works!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Future date returned: $($response.celebration)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
}

# Test 3: Christmas 2100
Write-Host "`n3. Testing Christmas 2100:" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/calendar/date/2100/12/25" -ErrorAction Stop
    Write-Host "   Celebration: $($response.celebration)"
    if ($response.celebration -like "*Christmas*") {
        Write-Host "   ✅ Christmas 2100 found!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Christmas 2100 returned: $($response.celebration)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "📖 Testing Readings Routes" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Test 4: Readings for a known date
Write-Host "`n4. Testing readings for March 19, 2024:" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/calendar/readings/2024/3/19" -ErrorAction Stop
    if ($response.readings.gospel) {
        Write-Host "   Gospel: $($response.readings.gospel.citation)"
        Write-Host "   ✅ Gospel found!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ No Gospel found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
}

# Test 5: Readings for future date
Write-Host "`n5. Testing readings for March 19, 2050:" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/calendar/readings/2050/3/19" -ErrorAction Stop
    if ($response.readings.gospel) {
        Write-Host "   Gospel: $($response.readings.gospel.citation)"
        Write-Host "   ✅ Future readings work!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ No Gospel found for future date" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🔍 Testing Search Routes" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Test 6: Search by date (future year)
Write-Host "`n6. Searching for year 2050:" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/calendar/search/date/2050" -ErrorAction Stop
    $count = $response.Count
    Write-Host "   Found $count results for year 2050"
    if ($count -gt 0) {
        Write-Host "   ✅ Search works!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ No results found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
}

# Test 7: Search by keyword
Write-Host "`n7. Searching for keyword 'Joseph':" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/calendar/search/keyword/Joseph" -ErrorAction Stop
    $count = $response.Count
    Write-Host "   Found $count results for 'Joseph'"
    if ($count -gt 0) {
        Write-Host "   ✅ Keyword search works!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ No results found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "📊 Testing Database Stats" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Test 8: Database stats
Write-Host "`n8. Database statistics:" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/calendar/stats" -ErrorAction Stop
    Write-Host "   Total days: $($response.totalDays)"
    Write-Host "   With readings: $($response.withReadings)"
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
}

# Test 9: Month view
Write-Host "`n9. Testing month view for March 2024:" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/calendar/month/2024/3" -ErrorAction Stop
    $count = $response.Count
    Write-Host "   Found $count days in March 2024"
    if ($count -eq 31) {
        Write-Host "   ✅ Month view correct!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Month view incorrect (expected 31, got $count)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✅ Test Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Note: If any tests failed, check:" -ForegroundColor Yellow
Write-Host "   - Render logs at https://dashboard.render.com"
Write-Host "   - Environment variables (DATABASE_URL)"
Write-Host "   - Database connection"