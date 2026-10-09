#!/bin/bash

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     K-BEAUTY CDE - SETUP COMPLETO (macOS/Linux)                ║"
echo "║     Este script configura completamente tu base de datos        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if Python3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 no está instalado"
    echo "   Descárgalo desde: https://www.python.org/downloads/"
    exit 1
fi

echo "✅ Python 3 encontrado"
echo ""

# Check if psycopg2 is installed
python3 -c "import psycopg2" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📥 Instalando psycopg2..."
    pip3 install psycopg2-binary
    if [ $? -ne 0 ]; then
        echo "❌ Error instalando psycopg2"
        echo "   Intenta: sudo pip3 install psycopg2-binary"
        exit 1
    fi
fi

echo "✅ psycopg2 instalado"
echo ""

# Run the setup script
python3 setup_db_completo.py

exit $?
