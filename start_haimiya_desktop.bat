@echo off
chcp 65001 > nul
title Haimiya Typo - Studio Server & Auto-Sync
color 0b
echo ===============================================================
echo     🎵 Haimiya Typo - ระบบคลังเพลงตัดต่อคลิป & สตูดิโอ
echo ===============================================================
echo.
echo [1/2] กำลังตรวจสอบและซิงค์เพลงใหม่ล่าสุด...
call node auto_update_daily.js --force
echo.
echo [2/2] กำลังเปิดเว็บเซิร์ฟเวอร์บนเครื่องคอม...
start "" "http://localhost:4173"
node serve.js
pause
