@echo off
echo "نصب وابستگی‌های چت بات محلی..."

if not exist node_modules (
    echo "در حال نصب پکیج‌های مورد نیاز..."
    call npm install
) else (
    echo "پکیج‌ها قبلا نصب شده‌اند."
)

echo "همه چیز آماده است! برای اجرای برنامه، از فایل run.bat استفاده کنید."
echo "برای تهیه فایل نصب، از فایل build.bat استفاده کنید."

pause 