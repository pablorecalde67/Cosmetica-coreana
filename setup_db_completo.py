#!/usr/bin/env python3
"""
K-BEAUTY CDE - Setup Completo de Base de Datos
Ejecuta este script en tu computadora (no en la nube)
Hace TODO automáticamente: crea tablas y carga 1000 productos
"""

import sys
import os
from pathlib import Path

def main():
    print("""
╔════════════════════════════════════════════════════════════════╗
║     K-BEAUTY CDE - SETUP COMPLETO DE BASE DE DATOS             ║
║     Este script hace TODA la configuración automáticamente      ║
╚════════════════════════════════════════════════════════════════╝
    """)

    # Paso 1: Instalar psycopg2
    print("\n[1/4] 📦 Instalando herramientas de base de datos...\n")
    try:
        import psycopg2
        print("✅ psycopg2 ya está instalado\n")
    except ImportError:
        print("📥 Instalando psycopg2-binary desde pip...")
        import subprocess
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", "psycopg2-binary"],
            capture_output=False
        )
        if result.returncode != 0:
            print("\n❌ Error instalando psycopg2")
            print("   Intenta manualmente con: pip install psycopg2-binary")
            return False
        import psycopg2
        print("\n✅ psycopg2 instalado correctamente\n")

    # Paso 2: Leer archivos SQL
    print("[2/4] 📖 Leyendo archivos SQL...\n")
    script_dir = Path(__file__).parent

    setup_sql = script_dir / "SETUP_SUPABASE.sql"
    load_sql = script_dir / "LOAD_PRODUCTOS.sql"

    if not setup_sql.exists():
        print(f"❌ No encontré: {setup_sql.name}")
        return False
    if not load_sql.exists():
        print(f"❌ No encontré: {load_sql.name}")
        return False

    print(f"✅ {setup_sql.name}")
    print(f"✅ {load_sql.name}\n")

    # Paso 3: Conectar a Supabase y ejecutar SQL
    print("[3/4] 🔌 Conectando a Supabase...\n")

    # Credenciales
    SUPABASE_HOST = "db.sky-grass.supabase.co"
    SUPABASE_USER = "postgres"
    SUPABASE_DB = "postgres"

    # Pedir contraseña de forma segura (no la mostramos en pantalla)
    import getpass
    print("Necesito la contraseña de Supabase para conectar a la base de datos")
    print("(Esta es la contraseña que viste cuando creaste el proyecto)\n")
    SUPABASE_PASSWORD = getpass.getpass("Contraseña Supabase: ")

    try:
        import psycopg2
        conn = psycopg2.connect(
            host=SUPABASE_HOST,
            user=SUPABASE_USER,
            password=SUPABASE_PASSWORD,
            database=SUPABASE_DB,
            sslmode="require",
            connect_timeout=10
        )
        cursor = conn.cursor()
        print("✅ Conexión establecida a Supabase PostgreSQL\n")

    except psycopg2.OperationalError as e:
        print(f"❌ No se pudo conectar a Supabase: {str(e)}")
        print("\n   Verifica:")
        print("   1. La contraseña sea correcta")
        print("   2. Tengas conexión a Internet")
        print("   3. El proyecto de Supabase esté activo")
        return False

    # Paso 4: Ejecutar SQL
    print("[4/4] 📝 Ejecutando SQL (esto toma 1-2 minutos)...\n")

    try:
        # Leer y ejecutar SETUP_SUPABASE.sql
        print("   → Creando tablas...")
        with open(setup_sql, 'r', encoding='utf-8') as f:
            sql_setup = f.read()

        cursor.execute(sql_setup)
        conn.commit()
        print("   ✅ Tablas creadas correctamente")

        # Leer y ejecutar LOAD_PRODUCTOS.sql
        print("   → Cargando 1000 productos...")
        with open(load_sql, 'r', encoding='utf-8') as f:
            sql_load = f.read()

        cursor.execute(sql_load)
        conn.commit()
        print("   ✅ 1000 productos cargados correctamente")

        # Verificar
        print("\n📊 Verificando...")
        cursor.execute("SELECT COUNT(*) FROM productos;")
        count_productos = cursor.fetchone()[0]
        print(f"   ✅ Productos en base de datos: {count_productos}")

        cursor.execute("SELECT COUNT(*) FROM andreani_zonas;")
        count_zonas = cursor.fetchone()[0]
        print(f"   ✅ Provincias con envío: {count_zonas}")

        cursor.close()
        conn.close()

        print("""
╔════════════════════════════════════════════════════════════════╗
║                    ✅ TODO COMPLETADO                           ║
╚════════════════════════════════════════════════════════════════╝

Tu base de datos ya está lista!

📱 Ahora puedes:
   1. Acceder a la tienda: https://pablorecalde67.github.io/Cosmetica-coreana/
   2. Panel admin: https://pablorecalde67.github.io/Cosmetica-coreana/admin.html
   3. Ver 1000 productos disponibles con envío a todas las provincias

✨ El proyecto está 100% operativo y automatizado
""")
        return True

    except Exception as e:
        print(f"\n❌ Error ejecutando SQL: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
