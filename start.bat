@echo off
setlocal
cd /d "%~dp0"
title Trisvax Video Editor - Docker Setup
echo ============================================================
echo   TRISVAX VIDEO EDITOR - STARTUP AND ENVIRONMENT CHECK
echo ============================================================
where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  py -3 start.py
) else (
  where python >nul 2>nul
  if %ERRORLEVEL% EQU 0 (
    python start.py
  ) else (
    echo [FAIL] Python 3 not found. Install Python and enable Add to PATH.
    pause
    exit /b 1
  )
)
set RESULT=%ERRORLEVEL%
if not "%RESULT%"=="0" (
  echo [ERROR] Startup checks failed. Review logs folder.
  pause
  exit /b %RESULT%
)
echo [SUCCESS] Base Docker environment is ready.
echo Note: Add the React Native app scaffold before building the APK.
pause
exit /b 0