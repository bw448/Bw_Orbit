@echo off
chcp 65001 >nul
cd /d "E:\地信复习系统"
python tools\sync_content.py
if errorlevel 1 (
  echo.
  echo 同步失败，请把上面的错误发给 BW。
) else (
  echo.
  echo 同步完成：网站已重建，系统整理好的复习资料已更新。
)
pause
