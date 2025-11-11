@echo off
REM MongoDB cleanup script to remove deprecated fields from pins collection (Windows)
REM IMPORTANT: Run backup-pins.bat BEFORE running this script!

echo =========================================
echo   Pins Collection Cleanup Script
echo =========================================
echo.
echo WARNING: This will remove the following fields from ALL pins:
echo    - media (old array field)
echo    - mediaUrl (redundant field)
echo.
echo Make sure you have run backup-pins.bat first!
echo.

REM Load MONGODB_URI from .env
for /f "tokens=1,2 delims==" %%a in ('type ..\.env ^| findstr MONGODB_URI') do set %%a=%%b

REM Check if MONGODB_URI is set
if "%MONGODB_URI%"=="" (
    echo Error: MONGODB_URI not found in .env file
    echo Please set MONGODB_URI in backend/.env
    pause
    exit /b 1
)

REM Confirmation prompt
set /p confirm="Do you want to proceed? (yes/no): "
if not "%confirm%"=="yes" (
    echo Cleanup cancelled
    pause
    exit /b 0
)

echo.
echo Checking current state...

REM Create temporary JavaScript file for mongosh
echo const db = db.getSiblingDB("juander"); > temp-cleanup.js
echo. >> temp-cleanup.js
echo // Count documents with deprecated fields >> temp-cleanup.js
echo const totalPins = db.pins.countDocuments(); >> temp-cleanup.js
echo const pinsWithMedia = db.pins.countDocuments({ media: { $exists: true } }); >> temp-cleanup.js
echo const pinsWithMediaUrl = db.pins.countDocuments({ mediaUrl: { $exists: true } }); >> temp-cleanup.js
echo. >> temp-cleanup.js
echo print("\n📊 Current State:"); >> temp-cleanup.js
echo print(`   Total pins: ${totalPins}`); >> temp-cleanup.js
echo print(`   Pins with "media" field: ${pinsWithMedia}`); >> temp-cleanup.js
echo print(`   Pins with "mediaUrl" field: ${pinsWithMediaUrl}`); >> temp-cleanup.js
echo. >> temp-cleanup.js
echo print("\n🧹 Removing deprecated fields..."); >> temp-cleanup.js
echo. >> temp-cleanup.js
echo // Remove deprecated fields >> temp-cleanup.js
echo const result = db.pins.updateMany( >> temp-cleanup.js
echo   {}, >> temp-cleanup.js
echo   { >> temp-cleanup.js
echo     $unset: { >> temp-cleanup.js
echo       media: "", >> temp-cleanup.js
echo       mediaUrl: "" >> temp-cleanup.js
echo     } >> temp-cleanup.js
echo   } >> temp-cleanup.js
echo ); >> temp-cleanup.js
echo. >> temp-cleanup.js
echo print(`\n✅ Cleanup completed!`); >> temp-cleanup.js
echo print(`   Matched: ${result.matchedCount} documents`); >> temp-cleanup.js
echo print(`   Modified: ${result.modifiedCount} documents`); >> temp-cleanup.js
echo. >> temp-cleanup.js
echo // Verify cleanup >> temp-cleanup.js
echo const remainingMedia = db.pins.countDocuments({ media: { $exists: true } }); >> temp-cleanup.js
echo const remainingMediaUrl = db.pins.countDocuments({ mediaUrl: { $exists: true } }); >> temp-cleanup.js
echo. >> temp-cleanup.js
echo print(`\n📊 Verification:`); >> temp-cleanup.js
echo print(`   Pins with "media" field remaining: ${remainingMedia}`); >> temp-cleanup.js
echo print(`   Pins with "mediaUrl" field remaining: ${remainingMediaUrl}`); >> temp-cleanup.js
echo. >> temp-cleanup.js
echo if (remainingMedia === 0 ^&^& remainingMediaUrl === 0) { >> temp-cleanup.js
echo   print("\n✅ All deprecated fields successfully removed!"); >> temp-cleanup.js
echo } else { >> temp-cleanup.js
echo   print("\n⚠️  Some fields still remain. Please check manually."); >> temp-cleanup.js
echo } >> temp-cleanup.js

REM Run the script
mongosh "%MONGODB_URI%" --quiet --file temp-cleanup.js

REM Clean up temporary file
del temp-cleanup.js

echo.
echo =========================================
echo   Cleanup Complete
echo =========================================
pause
