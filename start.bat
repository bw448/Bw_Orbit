@echo off
cd /d "%~dp0"
start "" "http://localhost:8765/"
where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 8765
) else (
  py -3 -m http.server 8765
)
pause
