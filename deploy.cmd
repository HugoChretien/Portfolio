@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy.ps1" %*
if errorlevel 1 (
  echo.
  echo Le deploiement a echoue. Consulte le message ci-dessus.
  pause
  exit /b 1
)
endlocal
