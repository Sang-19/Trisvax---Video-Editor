@echo off
cd /d "%~dp0"
echo [INFO] Building APK inside Docker...
docker compose exec trisvax-video-editor bash -lc "test -f package.json || { echo '[FAIL] package.json missing: app scaffold is not present yet.'; exit 2; }; test -d android || { echo '[FAIL] android directory missing.'; exit 2; }; corepack yarn install && cd android && (test -x gradlew || chmod +x gradlew) && ./gradlew assembleDebug --no-daemon --console=plain -PreactNativeArchitectures=arm64-v8a"
if errorlevel 1 (
 echo [FAIL] APK build failed. Review Gradle output above.
 pause
 exit /b 1
)
echo [SUCCESS] APK build complete: android\app\build\outputs\apk\debug\app-debug.apk
pause