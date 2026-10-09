@echo off
chcp 65001 >nul
cls

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║     K-BEAUTY CDE - SETUP COMPLETO (Windows)                   ║
echo ║     Este script configura completamente tu base de datos        ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check if Python3 is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python 3 no está instalado
    echo    Descárgalo desde: https://www.python.org/downloads/
    echo.
    echo    ⚠️  Importante: Durante la instalación, marca la opción:
    echo       "Add Python to PATH"
    echo.
    pause
    exit /b 1
)

echo ✅ Python 3 encontrado
echo.

REM Check if psycopg2 is installed
python -c "import psycopg2" >nul 2>&1
if %errorlevel% neq 0 (
    echo 📥 Instalando psycopg2...
    python -m pip install psycopg2-binary
    if %errorlevel% neq 0 (
        echo.
        echo ❌ Error instalando psycopg2
        echo    Intenta abriendo PowerShell como administrador y ejecutar:
        echo    pip install psycopg2-binary
        echo.
        pause
        exit /b 1
    )
)

echo ✅ psycopg2 instalado
echo.

REM Run the setup script
python setup_db_completo.py

if %errorlevel% neq 0 (
    echo.
    echo ❌ Hubo un error durante la configuración
    pause
    exit /b 1
)

echo.
echo ✅ Setup completado
pause
