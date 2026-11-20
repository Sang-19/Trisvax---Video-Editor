@echo off
cd /d "%~dp0"
echo [INFO] Starting Metro inside Docker...
docker compose exec trisvax-video-editor bash -lc "test -f package.json || { echo '[FAIL] package.json missing: app scaffold is not present yet.'; exit 2; }; corepack yarn start --host 0.0.0.0"
pause