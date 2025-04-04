@echo off
echo "در حال ساخت فایل نصب چت بات محلی..."

call npm run dist

echo "فایل نصب در پوشه dist ایجاد شد."
echo "مسیر فایل: dist\ChatBot LM Studio Setup.exe"

pause 