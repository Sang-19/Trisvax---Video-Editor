@echo off
cd /d "%~dp0"
set APK=android\app\build\outputs\apk\debug\app-debug.apk
if not exist "%APK%" (
 echo [FAIL] APK not found. Run android-build.bat first.
 pause
 exit /b 1
)
where adb >nul 2>nul
if errorlevel 1 (
 echo [FAIL] adb missing from PATH. Install Android Platform-Tools.
 pause
 exit /b 1
)
echo [INFO] Connected devices:
adb devices
echo [INFO] Configure USB reverse...
adb reverse tcp:8081 tcp:8081
if errorlevel 1 (
 echo [FAIL] adb reverse failed. Check USB debugging authorization.
 pause
 exit /b 1
)
echo [INFO] Installing APK...
adb install -r "%APK%"
if errorlevel 1 (
 echo [FAIL] APK installation failed.
 pause
 exit /b 1
)
echo [SUCCESS] APK installed on physical phone.
pause