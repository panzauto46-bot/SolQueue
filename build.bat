@echo off
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" x64 >nul 2>&1
cd /d "c:\Users\PANZ AUTO\Documents\SolQueue"
echo === Starting cargo build ===
cargo build 2>&1
echo === Build exit code: %ERRORLEVEL% ===
