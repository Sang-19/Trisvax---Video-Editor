@echo off
cd /d "%~dp0"
echo [CHECK] React Native app and Android project
if not exist "package.json" (
 echo [FAILED] package.json missing.
 pause
 exit /b 1
)
if not exist "android\app\build.gradle" (
 echo [FAILED] Android app project missing.
 pause
 exit /b 1
)
echo [CHECK] Install JavaScript dependencies and apply SDK setup patches
docker compose exec -T trisvax-video-editor bash -lc "corepack yarn install && corepack yarn setup:video-editor"
if errorlevel 1 (
 echo [FAILED] Dependency or video editor SDK setup failed.
 pause
 exit /b 1
)
echo [CHECK] Build ARM64 debug APK inside Docker
docker compose exec -T trisvax-video-editor bash -lc "cd android && gradle assembleDebug --no-daemon --console=plain -PreactNativeArchitectures=arm64-v8a"
if errorlevel 1 (
 echo [FAILED] APK build failed. Review Gradle output above.
 pause
 exit /b 1
)
echo [SUCCESS] APK build complete: android\app\build\outputs\apk\debug\app-debug.apk
pause
