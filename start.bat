@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
title Trisvax Video Editor - Docker Startup
if not exist "logs" mkdir "logs"
set "LOGFILE=%CD%\logs\start.log"
set "TMPLOG=%TEMP%\trisvax-start-step.log"
echo TRISVAX VIDEO EDITOR STARTUP %DATE% %TIME% > "%LOGFILE%"
echo ============================================================
echo   TRISVAX VIDEO EDITOR - STARTUP AND ENVIRONMENT CHECK
echo ============================================================
echo Log file: %LOGFILE%

call :check "Docker CLI"
where docker >nul 2>&1
if errorlevel 1 (
  call :fail "Docker CLI not found. Install Docker Desktop and add docker.exe to PATH."
  goto :summary
)
call :pass "Docker CLI found"

call :check "Docker Compose"
docker compose version > "%TMPLOG%" 2>&1
if errorlevel 1 (
  type "%TMPLOG%"
  type "%TMPLOG%" >> "%LOGFILE%"
  call :fail "Docker Compose plugin is unavailable."
  goto :summary
)
type "%TMPLOG%"
type "%TMPLOG%" >> "%LOGFILE%"
call :pass "Docker Compose available"

call :check "Docker daemon"
docker info > "%TMPLOG%" 2>&1
if errorlevel 1 (
  type "%TMPLOG%"
  type "%TMPLOG%" >> "%LOGFILE%"
  call :warn "Docker daemon is not ready. Attempting to start Docker Desktop."
  set "DOCKER_DESKTOP="
  if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" set "DOCKER_DESKTOP=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
  if not defined DOCKER_DESKTOP if exist "%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe" set "DOCKER_DESKTOP=%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe"
  if not defined DOCKER_DESKTOP (
    call :fail "Docker Desktop executable not found. Start Docker Desktop manually."
    goto :summary
  )
  start "" "!DOCKER_DESKTOP!"
  set "DOCKER_READY=0"
  for /L %%I in (1,1,30) do (
    if "!DOCKER_READY!"=="0" (
      timeout /t 5 /nobreak >nul
      docker info >nul 2>&1
      if not errorlevel 1 set "DOCKER_READY=1"
      echo [WAIT] Docker Desktop startup check %%I/30
    )
  )
  if "!DOCKER_READY!"=="0" (
    call :fail "Docker daemon did not become ready within 150 seconds."
    goto :summary
  )
)
call :pass "Docker daemon is ready"

call :check "Physical Android device (optional)"
where adb >nul 2>&1
if errorlevel 1 (
  call :warn "ADB not found on Windows PATH. Docker setup can continue; install Android Platform-Tools to deploy to a phone."
) else (
  adb version > "%TMPLOG%" 2>&1
  type "%TMPLOG%"
  type "%TMPLOG%" >> "%LOGFILE%"
  adb devices > "%TMPLOG%" 2>&1
  type "%TMPLOG%"
  type "%TMPLOG%" >> "%LOGFILE%"
  findstr /R /C:"[ ][ ]*device$" "%TMPLOG%" >nul
  if errorlevel 1 (
    findstr /C:"unauthorized" "%TMPLOG%" >nul
    if not errorlevel 1 (
      call :warn "Phone is unauthorized. Unlock it and accept the USB debugging prompt."
    ) else (
      call :warn "No authorized phone detected. Connect USB and enable USB debugging when ready."
    )
  ) else (
    call :pass "Authorized Android device detected"
    adb reverse tcp:8081 tcp:8081 > "%TMPLOG%" 2>&1
    if errorlevel 1 (
      type "%TMPLOG%"
      type "%TMPLOG%" >> "%LOGFILE%"
      call :warn "Could not configure adb reverse yet. Run android-install.bat after Metro starts."
    ) else (
      type "%TMPLOG%"
      type "%TMPLOG%" >> "%LOGFILE%"
      call :pass "ADB reverse configured for Metro port 8081"
    )
  )
)

call :check "Build Docker development image"
docker compose build > "%TMPLOG%" 2>&1
set "STEP_RESULT=!ERRORLEVEL!"
type "%TMPLOG%"
type "%TMPLOG%" >> "%LOGFILE%"
if not "!STEP_RESULT!"=="0" (
  call :fail "Docker image build failed. Review logs/start.log."
  goto :summary
)
call :pass "Docker image built"

call :check "Start Docker development container"
docker compose up -d > "%TMPLOG%" 2>&1
set "STEP_RESULT=!ERRORLEVEL!"
type "%TMPLOG%"
type "%TMPLOG%" >> "%LOGFILE%"
if not "!STEP_RESULT!"=="0" (
  call :fail "Docker container startup failed."
  goto :summary
)
call :pass "Docker container started"

call :check "Verify Node.js, Yarn and Java inside Docker"
docker compose exec -T trisvax-video-editor bash -lc "node --version && corepack yarn --version && java -version" > "%TMPLOG%" 2>&1
set "STEP_RESULT=!ERRORLEVEL!"
type "%TMPLOG%"
type "%TMPLOG%" >> "%LOGFILE%"
if not "!STEP_RESULT!"=="0" (
  call :fail "One or more required runtimes failed inside Docker."
  goto :summary
)
call :pass "Node.js, Yarn and Java are available"

call :check "Verify Android SDK inside Docker"
docker compose exec -T trisvax-video-editor bash -lc "test -x \"$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager\" && test -d \"$ANDROID_HOME/platform-tools\" && test -d \"$ANDROID_HOME/platforms/android-36\"" > "%TMPLOG%" 2>&1
set "STEP_RESULT=!ERRORLEVEL!"
type "%TMPLOG%"
type "%TMPLOG%" >> "%LOGFILE%"
if not "!STEP_RESULT!"=="0" (
  call :fail "Android SDK verification failed inside Docker."
  goto :summary
)
call :pass "Android SDK is available"

if not exist "package.json" (
  call :warn "No package.json found. React Native app scaffold and SDK integration are still pending; APK build scripts cannot work yet."
) else (
  call :pass "React Native package.json detected"
)

:summary
echo.
echo ============================================================
echo Startup summary
echo ============================================================
echo [SUCCESS] %PASS_COUNT%   [WARNING] %WARN_COUNT%   [FAILED] %FAIL_COUNT%
echo [SUMMARY] SUCCESS=%PASS_COUNT% WARNING=%WARN_COUNT% FAILED=%FAIL_COUNT%>> "%LOGFILE%"
echo Log: %LOGFILE%
if defined FAIL_COUNT if not "%FAIL_COUNT%"=="0" (
  echo [FAILED] Startup did not complete. Fix failed steps and rerun start.bat.
  pause
  exit /b 1
)
echo [SUCCESS] Docker development environment is ready.
pause
exit /b 0

:check
echo.
echo [CHECK] %~1
echo [CHECK] %~1>> "%LOGFILE%"
exit /b 0
:pass
set /a PASS_COUNT+=1
echo [SUCCESS] %~1
echo [SUCCESS] %~1>> "%LOGFILE%"
exit /b 0
:warn
set /a WARN_COUNT+=1
echo [WARNING] %~1
echo [WARNING] %~1>> "%LOGFILE%"
exit /b 0
:fail
set /a FAIL_COUNT+=1
echo [FAILED] %~1
echo [FAILED] %~1>> "%LOGFILE%"
exit /b 0
