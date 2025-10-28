@echo off
echo Killing process on port 3012...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3012 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
)
echo Port 3012 is now free
