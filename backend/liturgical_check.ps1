# liturgical_check.ps1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  LITURGICAL DATE DIAGNOSTIC TOOL" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check 1: Current system date
Write-Host "[1] CURRENT SYSTEM DATE" -ForegroundColor Yellow
Write-Host "------------------------"
$current_date = Get-Date -Format "dddd, MMMM d, yyyy"
$current_weekday = Get-Date -Format "dddd"
$current_date_num = Get-Date -Format "yyyy-MM-dd"
Write-Host "System says: $current_date"
Write-Host "Weekday: $current_weekday"
Write-Host "Date: $current_date_num"
Write-Host ""

# Check 2: What's being displayed
Write-Host "[2] WHAT'S BEING DISPLAYED" -ForegroundColor Yellow
Write-Host "---------------------------"
$displayed_date = "Wednesday, March 4, 2026"
$displayed_weekday = "Wednesday"
$displayed_reading = "Thursday of the 2nd week of Lent"
Write-Host "Displayed Date: $displayed_date"
Write-Host "Displayed Reading: $displayed_reading"
Write-Host ""

# Check 3: The mismatch
Write-Host "[3] THE MISMATCH" -ForegroundColor Yellow
Write-Host "-----------------"
if ($current_weekday -ne $displayed_weekday) {
    Write-Host "❌ MISMATCH: System weekday ($current_weekday) ≠ Displayed weekday ($displayed_weekday)" -ForegroundColor Red
} else {
    Write-Host "✓ Weekday matches" -ForegroundColor Green
}

if ($displayed_weekday -ne "Thursday" -and $displayed_reading -like "*Thursday*") {
    Write-Host "❌ MISMATCH: Displayed says `"$displayed_weekday`" but reading is for Thursday" -ForegroundColor Red
}
Write-Host ""

# Check 4: Date calculations
Write-Host "[4] DATE CALCULATION TESTS" -ForegroundColor Yellow
Write-Host "--------------------------"
Write-Host "Current date object:"
$now = Get-Date
Write-Host "  Year: $($now.Year)"
Write-Host "  Month: $($now.Month)"
Write-Host "  Day: $($now.Day)"
Write-Host "  DayOfWeek: $($now.DayOfWeek)"
Write-Host "  DayOfWeek value: $([int]$now.DayOfWeek) (0=Sunday, 1=Monday, etc.)"
Write-Host ""

# Check 5: Possible causes
Write-Host "[5] POSSIBLE CAUSES" -ForegroundColor Yellow
Write-Host "-------------------"
Write-Host "1. ⏰ Timezone issue: Date might be UTC vs Local time"
Write-Host "2. 📅 Cached data: The reading might be from a cached API response"
Write-Host "3. 🔄 Off-by-one error: Day index might be 0-based vs 1-based"
Write-Host "4. 🌐 API mismatch: Reading data source might be on different timezone"
Write-Host "5. 💾 Database: The stored date might be incorrect"
Write-Host "6. 🧮 Date calculation: JavaScript new Date() might be parsing incorrectly"
Write-Host ""

# Check 6: Quick date test
Write-Host "[6] QUICK DATE TEST" -ForegroundColor Yellow
Write-Host "-------------------"
$test_date = Get-Date -Year 2026 -Month 3 -Day 4
$test_weekday = $test_date.DayOfWeek
Write-Host "March 4, 2026 is actually a: $test_weekday"
if ($test_weekday -eq "Wednesday") {
    Write-Host "✓ March 4, 2026 IS a Wednesday (correct!)" -ForegroundColor Green
    Write-Host "  The problem is the READING says Thursday" -ForegroundColor Yellow
} else {
    Write-Host "✗ March 4, 2026 is NOT a Wednesday" -ForegroundColor Red
}
Write-Host ""

# Check 7: What the reading should be
Write-Host "[7] WHAT THE READING SHOULD BE" -ForegroundColor Yellow
Write-Host "------------------------------"
if ($test_weekday -eq "Wednesday") {
    Write-Host "For Wednesday, March 4, 2026:"
    Write-Host "  ✓ Date is correct: Wednesday"
    Write-Host "  ✗ Reading should be: Wednesday of the 2nd week of Lent"
    Write-Host "  ✗ But displaying: Thursday of the 2nd week of Lent"
    Write-Host ""
    Write-Host "→ The reading is OFF BY ONE DAY!" -ForegroundColor Red
}

Write-Host ""
Write-Host "[8] BROWSER CONSOLE CHECKS" -ForegroundColor Yellow
Write-Host "---------------------------"
Write-Host "Open your browser's DevTools (F12) and run:"
Write-Host ""
Write-Host "// Check current date in browser"
Write-Host "new Date()"
Write-Host "new Date().toLocaleString()"
Write-Host ""
Write-Host "// Check March 4, 2026"
Write-Host "new Date(2026, 2, 4).toLocaleDateString('en-US', { weekday: 'long' })"
Write-Host ""
Write-Host "// Check what date your app is using"
Write-Host "console.log('Your date variable:', yourDateVariable)"
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  THE PROBLEM: Reading is 1 day ahead!" -ForegroundColor Red
Write-Host "  Date shows Wednesday, Reading shows Thursday" -ForegroundColor Red
Write-Host "=========================================" -ForegroundColor Cyan