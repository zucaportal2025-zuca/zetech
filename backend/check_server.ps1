# check_server.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CHECKING SERVER.JS FOR PROBLEMS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$serverPath = "C:\Users\HP\zuca-portal\backend\server.js"

if (Test-Path $serverPath) {
    Write-Host "[1] Found server.js at: $serverPath" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "[2] Checking for directory creation lines..." -ForegroundColor Yellow
    Write-Host "----------------------------------------"
    
    $lines = Get-Content $serverPath
    $lineNumber = 0
    
    foreach ($line in $lines) {
        $lineNumber++
        
        # Check for mkdirSync
        if ($line -match "mkdirSync") {
            Write-Host "WARNING Line $lineNumber : $($line.Trim())" -ForegroundColor Red
        }
        
        # Check for uploads directory
        if ($line -match "uploads" -and ($line -match "mkdir" -or $line -match "existsSync")) {
            Write-Host "FOLDER Line $lineNumber : $($line.Trim())" -ForegroundColor Yellow
        }
        
        # Check for multer diskStorage
        if ($line -match "diskStorage") {
            Write-Host "DISKSTORAGE Line $lineNumber : Uses diskStorage (bad for Vercel)" -ForegroundColor Red
        }
        
        # Check for createReadStream
        if ($line -match "createReadStream") {
            Write-Host "FILESTREAM Line $lineNumber : Uses createReadStream (requires disk)" -ForegroundColor Red
        }
        
        # Check for memoryStorage
        if ($line -match "memoryStorage") {
            Write-Host "MEMORYSTORAGE Line $lineNumber : Uses memoryStorage (good for Vercel)" -ForegroundColor Green
        }
        
        # Check for file.buffer
        if ($line -match "file\.buffer") {
            Write-Host "BUFFER Line $lineNumber : Uses file.buffer (good for Vercel)" -ForegroundColor Green
        }
    }
    
    Write-Host ""
    Write-Host "[3] Summary of issues:" -ForegroundColor Yellow
    Write-Host "----------------------------------------"
    
    # Count issues
    $diskStorageCount = ($lines | Select-String "diskStorage").Count
    $mkdirCount = ($lines | Select-String "mkdirSync").Count
    $createReadStreamCount = ($lines | Select-String "createReadStream").Count
    
    if ($diskStorageCount -gt 0) {
        Write-Host "FOUND $diskStorageCount instances of diskStorage" -ForegroundColor Red
        Write-Host "   -> Change to memoryStorage for Vercel" -ForegroundColor Red
    }
    
    if ($mkdirCount -gt 0) {
        Write-Host "FOUND $mkdirCount instances of mkdirSync" -ForegroundColor Red
        Write-Host "   -> Remove or wrap in try-catch for Vercel" -ForegroundColor Red
    }
    
    if ($createReadStreamCount -gt 0) {
        Write-Host "FOUND $createReadStreamCount instances of createReadStream" -ForegroundColor Red
        Write-Host "   -> Use file.buffer instead for Vercel" -ForegroundColor Red
    }
    
    if ($diskStorageCount -eq 0 -and $mkdirCount -eq 0 -and $createReadStreamCount -eq 0) {
        Write-Host "SUCCESS No issues found! Your server.js should work on Vercel." -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "[4] Recommended fixes:" -ForegroundColor Yellow
    Write-Host "----------------------------------------"
    Write-Host ""
    
    if ($diskStorageCount -gt 0) {
        Write-Host "1. Change multer storage from diskStorage to memoryStorage:"
        Write-Host "   const mediaStorage = multer.memoryStorage();" -ForegroundColor Green
        Write-Host ""
    }
    
    if ($mkdirCount -gt 0) {
        Write-Host "2. Remove or comment out directory creation lines:"
        Write-Host "   // const uploadDir = path.join(__dirname, 'uploads');" -ForegroundColor Green
        Write-Host "   // if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);" -ForegroundColor Green
        Write-Host ""
    }
    
    if ($createReadStreamCount -gt 0) {
        Write-Host "3. Change file upload to use buffer:"
        Write-Host "   Before: fs.createReadStream(file.path)" -ForegroundColor Red
        Write-Host "   After:  file.buffer" -ForegroundColor Green
        Write-Host ""
    }
    
} else {
    Write-Host "ERROR Could not find server.js at: $serverPath" -ForegroundColor Red
    Write-Host "   Please check the path" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TO FIX: Replace problematic code with:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "// ========== FOR VERCELL DEPLOYMENT ==========" -ForegroundColor White
Write-Host "// Use memoryStorage instead of diskStorage" -ForegroundColor White
Write-Host "const mediaStorage = multer.memoryStorage();" -ForegroundColor Green
Write-Host ""
Write-Host "const mediaUpload = multer({" -ForegroundColor White
Write-Host "  storage: mediaStorage," -ForegroundColor White
Write-Host "  limits: { fileSize: 50 * 1024 * 1024 }," -ForegroundColor White
Write-Host "});" -ForegroundColor White
Write-Host ""
Write-Host "// In upload handler, use file.buffer instead of createReadStream" -ForegroundColor White
Write-Host "const { error: uploadError } = await supabase.storage" -ForegroundColor White
Write-Host "  .from(""media"")" -ForegroundColor White
Write-Host "  .upload(filePath, file.buffer, {" -ForegroundColor Green
Write-Host "    contentType: file.mimetype," -ForegroundColor White
Write-Host "    upsert: true," -ForegroundColor White
Write-Host "  });" -ForegroundColor White
Write-Host ""
Write-Host "// Remove directory creation lines entirely" -ForegroundColor White
Write-Host "// No need for mkdirSync on Vercel" -ForegroundColor White

Write-Host ""
Write-Host "Run this script to check your server.js" -ForegroundColor Yellow