@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-yadra-version.ps1" %*
exit /b %ERRORLEVEL%
