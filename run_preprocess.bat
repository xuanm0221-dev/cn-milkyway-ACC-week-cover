@echo off
chcp 65001 >nul
cd /d "%~dp0"
python preprocess_stock_weeks.py
pause







