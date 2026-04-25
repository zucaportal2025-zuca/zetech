# PowerShell script to fix mass-programs routes
$file = "server.js"
$content = Get-Content $file -Raw

# Replace the GET route
$content = $content -replace 'app\.get\("/api/songs", async \(req, res\) => \{(?s:(.*?))app\.(?:get|post|put|delete)', 'app.get("/api/mass-programs", async (req, res) => {$1app.'

# Replace the POST route
$content = $content -replace 'app\.post\("/api/songs", authenticate, async \(req, res\) => \{(?s:(.*?))app\.(?:get|post|put|delete)', 'app.post("/api/mass-programs", authenticate, async (req, res) => {$1app.'

# Replace the PUT route
$content = $content -replace 'app\.put\("/api/songs/:id", authenticate, async \(req, res\) => \{(?s:(.*?))app\.(?:get|post|put|delete)', 'app.put("/api/mass-programs/:id", authenticate, async (req, res) => {$1app.'

# Replace the DELETE route
$content = $content -replace 'app\.delete\("/api/songs/:id", authenticate, async \(req, res\) => \{(?s:(.*?))app\.(?:get|post|put|delete)', 'app.delete("/api/mass-programs/:id", authenticate, async (req, res) => {$1app.'

# Also fix any time field references
$content = $content -replace 'const { date, venue, \.\.\.songsData }', 'const { date, venue, time, ...songsData }'
$content = $content -replace 'date: new Date\(date\), \s*venue,', 'date: new Date(date), venue, time,'
$content = $content -replace 'date: newProgram\.date\.toISOString\(\)\.split\("T"\)\[0\], \s*venue: newProgram\.venue,', 'date: newProgram.date.toISOString().split("T")[0], venue: newProgram.venue, time: newProgram.time,'

# Save the file
$content | Set-Content $file

Write-Host "✅ Fixed mass-programs routes in server.js" -ForegroundColor Green
Write-Host "🎵 Mass Programs now at: /api/mass-programs" -ForegroundColor Yellow
Write-Host "🎵 Hymns still at: /api/songs" -ForegroundColor Yellow