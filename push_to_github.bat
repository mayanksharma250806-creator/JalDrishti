@echo off
title Push Jal Drishti to GitHub
set "PATH=%~dp0.git_tool\cmd;%PATH%"
echo ========================================================
echo   JAL DRISHTI - PUSHING TO GITHUB
echo   Repository: https://github.com/mayanksharma250806-creator/JalDrishti
echo ========================================================
echo.
echo Git push shuru ho raha hai...
echo Agar browser mein sign-in popup aaye, to 'Sign in with your browser' par click karein.
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo   SUCCESS! PUSH COMPLETE!
    echo   Aapka project GitHub par push ho chuka hai!
    echo   GitHub Pages automatic deploy shuru ho gaya hai.
    echo   Permanent Live URL:
    echo   https://mayanksharma250806-creator.github.io/JalDrishti/
    echo ========================================================
) else (
    echo ========================================================
    echo   Push complete nahi ho paya. Please check error message above.
    echo ========================================================
)
echo.
pause
